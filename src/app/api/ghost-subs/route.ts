import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/utils/supabase/server";
import { subMonths } from "date-fns";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const ip = getClientIp(req);
        const rl = rateLimit({ key: `api:ghost-subs:${user.id}:${ip}`, limit: 5, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: "Rate limit" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        const coupleId = profile?.couple_id;
        if (!coupleId) return new Response("No couple found", { status: 400 });

        // Fetch last 90 days of transactions + all registered subscriptions
        const ninetyDaysAgo = subMonths(new Date(), 3).toISOString();

        const [txs, subs] = await Promise.all([
            supabase
                .from("transactions")
                .select("*")
                .eq("couple_id", coupleId)
                .gte("date", ninetyDaysAgo),
            supabase
                .from("subscriptions")
                .select("*")
                .eq("couple_id", coupleId)
        ]);

        const transactions = (txs.data || []).filter((t: unknown) => {
            const obj = t as Record<string, unknown>;
            const type = typeof obj.type === "string" ? obj.type : "expense";
            return type === "expense";
        });
        const registeredSubscriptions = subs.data || [];

        const prompt = `
        You are a "Ghost Subscription Hunter". Your job is to find recurring payments in transactions that are NOT in the registered subscriptions list.
        
        Registered Subscriptions:
        ${registeredSubscriptions.map(s => `${s.name} ($${CURRENCY_SYMBOL}${s.amount})`).join(", ")}
        
        Recent Transactions (Last 90 days):
        ${transactions.map(t => `${t.description}: $${CURRENCY_SYMBOL}${t.amount} (${t.date})`).join("\n")}
        
        Detect recurring patterns (same merchant, similar amount, monthly frequency).
        If a pattern exists but is NOT in the Registered Subscriptions list, it's a "Ghost Subscription".
        
        Return a JSON array of objects:
        [
          {
            "name": "Merchant Name",
            "amount": 59.90,
            "frequency": "monthly",
            "confidence": 0.95,
            "reason": "Appeared index 3 times in 90 days with identical amount."
          }
        ]
        If nothing found, return [].
        Only return the JSON.
        `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            system: "You are a sharp financial forensic auditor. Respond only with JSON.",
            prompt: prompt,
        });

        const ghostSubs = JSON.parse(text.replace(/```json|```/g, "").trim());

        return NextResponse.json(ghostSubs);
    } catch (error: unknown) {
        const err = error as { status?: number; name?: string; message?: string };
        const isQuotaError =
            err.status === 429 ||
            err.name === "AI_RetryError" ||
            err.message?.toLowerCase().includes("quota") ||
            err.message?.toLowerCase().includes("rate limit");

        if (isQuotaError) {
            console.warn("Ghost Subs API: AI Quota reached");
            return NextResponse.json(
                { error: "המכסה היומית של ה-AI הסתיימה. נסה שוב בעוד כמה דקות." },
                { status: 429 }
            );
        }

        console.error("Ghost Subs API Error:", error);
        return NextResponse.json(
            { error: "Failed to detect ghost subs" },
            { status: 500 }
        );
    }
}
