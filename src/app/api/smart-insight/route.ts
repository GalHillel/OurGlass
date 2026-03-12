import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from "@/utils/supabase/server";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { getNow } from "@/demo/demo-config";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(null, { status: 401 });
        }

        const ip = getClientIp(req);
        const rl = rateLimit({ key: `api:smart-insight:${user.id}:${ip}`, limit: 10, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json(null, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(null);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const body = await req.json();
        const { transactions = [], monthlyIncome = 0, hourlyWage = 0, subscriptions = [], liabilities = [] } = body;

        const today = getNow();
        const dayOfMonth = today.getDate();

        // Summarize data to save tokens
        const totalSpend = (transactions as { amount: number | string }[]).reduce((acc: number, t) => acc + Number(t.amount), 0);
        const subTotal = (subscriptions as { amount: number }[]).reduce((s: number, sub) => s + (sub.amount || 0), 0);
        const liabTotal = (liabilities as { monthly_payment: number }[]).reduce((s: number, l) => s + (l.monthly_payment || 0), 0);
        const totalFixed = subTotal + liabTotal;

        const incomeNum = Number(monthlyIncome) || 0;
        const totalCommitted = totalSpend + totalFixed;
        const realBudgetUsagePct = incomeNum > 0 ? (totalCommitted / incomeNum) * 100 : 0;

        const topTx = ([...transactions] as { amount: number; description: string }[]).sort((a, b) => b.amount - a.amount).slice(0, 3);

        const prompt = `
You are a highly intelligent, proactive financial assistant in the OurGlass app.
Generate ONE highly contextual, daily "smart insight" for the couple based on their TOTAL spending.

CRITICAL: The "Total Spent" MUST include BOTH Variable expenses (transactions) AND Fixed expenses (subscriptions + loans).
If you only see variable expenses, you are missing half the picture.

Today is day ${dayOfMonth} of the month.
Monthly Income: ${CURRENCY_SYMBOL}${monthlyIncome}
Hourly Wage: ${CURRENCY_SYMBOL}${hourlyWage}
Variable spent (daily): ${CURRENCY_SYMBOL}${totalSpend}
Fixed spent (Loans + Subs): ${CURRENCY_SYMBOL}${totalFixed}
TOTAL COMMITTED SPEND: ${CURRENCY_SYMBOL}${totalCommitted}
Real Budget Usage: ${realBudgetUsagePct.toFixed(1)}% of income

Top 3 biggest variable expenses: ${JSON.stringify(topTx.map(t => ({ desc: t.description, amount: t.amount })))}

Rules:
1. Speak in modern Hebrew (plural "אתם/שלכם").
2. Provide exactly ONE insight.
3. Be brutally honest, encouraging, or analytical based on the TOTAL numbers.
4. If hourlyWage > 0, you can calculate how many "hours of work" a big expense (variable or fixed) cost them.
5. Return EXACTLY a JSON object with:
   - "type": "warning" | "opportunity" | "tip" | "info"
   - "text": The insight text (max 20 words).
   - "action": A short 2-3 word call to action (e.g. "בדוק תקציב").
`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        });

        const content = result.response.text() || "{}";
        const parsed = JSON.parse(content);

        return NextResponse.json(parsed);
    } catch (error: unknown) {
        const err = error as { status?: number; code?: string; type?: string; message?: string };
        if (err?.status === 429 || err?.code === 'insufficient_quota' || err?.type === 'insufficient_quota') {
            return NextResponse.json({
                type: "warning",
                text: "המכסה בחשבון ה-Gemini שלכם הסתיימה. לא תתקבלנה תובנות עד שתעדכנו אמצעי תשלום בחשבון הפיתוח שלכם 💳.",
                action: "הבנתי"
            });
        }
        console.error("Gemini Smart Insight Error:", err?.message || err);
        return NextResponse.json(null);
    }
}
