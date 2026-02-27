import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const rl = rateLimit({ key: `api:yield-accrue:${user.id}:${ip}`, limit: 120, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile fetch error in /api/yield/accrue:", profileError);
    return NextResponse.json({ error: "Profile error", details: profileError.message }, { status: 500 });
  }

  const coupleId = profile?.couple_id;
  if (!coupleId) {
    console.warn(`No couple_id found for user ${user.id} in /api/yield/accrue. Skipping accrual.`);
    return NextResponse.json({ updated: 0, message: "No couple_id found" });
  }

  const { data, error } = await supabase.rpc("accrue_yield_for_couple", { p_couple_id: coupleId });
  if (error) {
    console.error("accrue_yield_for_couple RPC error:", error);
    // Treat yield accrual as best-effort; don't block the app if it fails.
    return NextResponse.json({ updated: 0, error: error.message });
  }

  return NextResponse.json({ updated: data ?? 0 });
}


