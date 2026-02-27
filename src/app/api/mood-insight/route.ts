import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from "@/utils/supabase/server";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ip = getClientIp(req);
        const rl = rateLimit({ key: `api:mood-insight:${user.id}:${ip}`, limit: 10, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: "Rate limit" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { text: "מפתח Gemini חסר", type: "info" }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const { chartData, subscriptions, liabilities = [] } = await req.json();

        if (!chartData || chartData.length < 2) {
            return NextResponse.json({ text: "", type: "info" });
        }

        const subTotal = (subscriptions as { amount: number }[] | undefined)?.reduce((s: number, sub) => s + (sub.amount || 0), 0) || 0;
        const liabTotal = (liabilities as { monthly_payment: number }[] | undefined)?.reduce((s: number, l) => s + (l.monthly_payment || 0), 0) || 0;
        const totalFixed = subTotal + liabTotal;

        const prompt = `
You are a behavioral finance AI in the OurGlass app.
Analyze this user's mood vs. spending data:
${JSON.stringify(chartData, null, 2)}
User also has $${CURRENCY_SYMBOL}${totalFixed} in fixed monthly expenses (Subscriptions + Loans).

Provide exactly ONE short sentence in modern Hebrew (max 12 words) summarizing their emotional spending pattern.
Classify it as "warning" (if they spend a lot when sad/angry), "success" (if stable), or "info" (if they spend for celebrations).

Return EXACTLY a JSON object:
{ "text": "הוצאות גבוהות כשאתם עצובים — טיפול רגשי באשראי 💸", "type": "warning" }
`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        });

        const content = result.response.text() || "{}";
        let parsed = { text: "הנתונים מנותחים...", type: "info" };
        try {
            parsed = JSON.parse(content);
        } catch { }

        return NextResponse.json(parsed);
    } catch (error: unknown) {
        const err = error as { status?: number; code?: string; type?: string; message?: string };
        if (err?.status === 429 || err?.code === 'insufficient_quota' || err?.type === 'insufficient_quota') {
            return NextResponse.json({
                text: "מכסת ה-Gemini שלכם הסתיימה בחשבון הפיתוח, לא ניתן לנתח רגשות כרגע.",
                type: "warning"
            });
        }
        console.error("Gemini Mood Error:", err?.message || err);
        return NextResponse.json({ text: "שגיאה בניתוח AI", type: "error" });
    }
}
