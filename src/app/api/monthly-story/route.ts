import { generateText } from "ai";
import { createClient } from "@/utils/supabase/server";
import { getNow } from "@/demo/demo-config";
import { getBillingPeriodForDate } from "@/lib/billing";
import { primaryModel } from "@/lib/ai-router";
import { NextResponse } from "next/server";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ip = getClientIp(req);
        const rl = rateLimit({ key: `api:monthly-story:${user.id}:${ip}`, limit: 5, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: "Rate limit" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        const coupleId = profile?.couple_id;
        if (!coupleId) return NextResponse.json({ error: "No couple found" }, { status: 400 });

        const { start, end } = getBillingPeriodForDate(getNow());

        // Fetch everything for the month
        const [txs, subs] = await Promise.all([
            supabase
                .from("transactions")
                .select("*")
                .eq("couple_id", coupleId)
                .gte("date", start.toISOString())
                .lt("date", end.toISOString()),
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
        const subscriptions = subs.data || [];

        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0) +
            subscriptions.reduce((sum, s) => sum + (s.active ? s.amount : 0), 0);

        const topCategory = transactions.reduce((acc: Record<string, number>, t) => {
            const category = t.category || "General";
            acc[category] = (acc[category] || 0) + (t.amount || 0);
            return acc;
        }, {});

        const biggestCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0] || ["כללי", 0];

        const prompt = `
        You are a financial storyteller for "OurGlass", a premium AI-first finance app.
        Create a 4-slide "Spotify Wrapped" style story for this couple.
        Data:
        - Total Spent This Month: ${CURRENCY_SYMBOL}${totalSpent}
        - Budget: ${CURRENCY_SYMBOL}${profile.budget}
        - Top Spending Category: ${biggestCategory[0]} ($${CURRENCY_SYMBOL}${biggestCategory[1]})
        - Number of Transactions: ${transactions.length}
        - Passive Income/Savings Goal progress: High
        
        Return a JSON array of 4 objects exactly in this format:
        [
          {
            "title": "Short catchy title (Hebrew)",
            "description": "Engaging, slightly witty, emotional insight (Hebrew)",
            "emoji": "One relevant emoji",
            "colorGlow": "Tailwind color class (e.g., from-purple-500, from-emerald-500, from-amber-500, from-rose-500)"
          }
        ]
        Keep descriptions short (max 100 chars). Be premium and "wow" the user.
        `;

        const { text } = await generateText({
            model: primaryModel,
            system: "You are a professional financial analyst with a creative soul. Respond only with valid JSON.",
            prompt: prompt,
        });

        const story = JSON.parse(text.replace(/```json|```/g, "").trim());

        return NextResponse.json(story);
    } catch (error: unknown) {
        console.error("Monthly Story Error:", error);

        // Check for common error types
        const errorMessage = error instanceof Error ? error.message : "Failed to generate story";

        if (errorMessage.includes("quota") || errorMessage.includes("429")) {
            return NextResponse.json(
                { error: "המכסה היומית של ה-AI הסתיימה. נסה שוב בעוד כמה דקות." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "אירעה שגיאה בייצור הסיפור. אנא נסו שוב מאוחר יותר." },
            { status: 500 }
        );
    }
}
