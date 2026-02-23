import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(null);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const body = await req.json();
        const { transactions = [], monthlyIncome = 0, hourlyWage = 0, subscriptions = [], liabilities = [] } = body;

        const today = new Date();
        const dayOfMonth = today.getDate();

        // Summarize data to save tokens
        const totalSpend = transactions.reduce((acc: number, t: any) => acc + Number(t.amount), 0);
        const subTotal = subscriptions.reduce((s: number, sub: any) => s + (sub.amount || 0), 0);
        const liabTotal = liabilities.reduce((s: number, l: any) => s + (l.monthly_payment || 0), 0);
        const totalFixed = subTotal + liabTotal;

        const topTx = [...transactions].sort((a: any, b: any) => b.amount - a.amount).slice(0, 3);

        const prompt = `
You are a highly intelligent, proactive financial assistant in the OurGlass app.
Generate ONE highly contextual, daily "smart insight" for the user based on their data.
Today is day ${dayOfMonth} of the month.
Monthly Income: ₪${monthlyIncome}
Hourly Wage: ₪${hourlyWage}
Total Spent this month (variable): ₪${totalSpend}
Total Fixed Payments (Loans + Subs): ₪${totalFixed}
Top 3 biggest expenses: ${JSON.stringify(topTx.map(t => ({ desc: t.description, amount: t.amount })))}

Rules:
1. Speak in modern Hebrew (masculine/plural neutral is fine, e.g., "שמתם לב ש...").
2. Provide exactly ONE insight.
3. Be brutally honest, encouraging, or analytical based on the numbers.
4. If hourlyWage > 0, you can calculate how many "hours of work" a big expense cost them.
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
    } catch (error: any) {
        if (error?.status === 429 || error?.code === 'insufficient_quota' || error?.type === 'insufficient_quota') {
            return NextResponse.json({
                type: "warning",
                text: "המכסה בחשבון ה-Gemini שלכם הסתיימה. לא תתקבלנה תובנות עד שתעדכנו אמצעי תשלום בחשבון הפיתוח שלכם 💳.",
                action: "הבנתי"
            });
        }
        console.error("Gemini Smart Insight Error:", error?.message || error);
        return NextResponse.json(null);
    }
}
