import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { text: "מפתח Gemini חסר", type: "info" }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const { chartData, transactions, subscriptions, liabilities = [] } = await req.json();

        if (!chartData || chartData.length < 2) {
            return NextResponse.json({ text: "", type: "info" });
        }

        const subTotal = subscriptions?.reduce((s: number, sub: any) => s + (sub.amount || 0), 0) || 0;
        const liabTotal = liabilities?.reduce((s: number, l: any) => s + (l.monthly_payment || 0), 0) || 0;
        const totalFixed = subTotal + liabTotal;

        const prompt = `
You are a behavioral finance AI in the OurGlass app.
Analyze this user's mood vs. spending data:
${JSON.stringify(chartData, null, 2)}
User also has ₪${totalFixed} in fixed monthly expenses (Subscriptions + Loans).

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
        } catch (e) { }

        return NextResponse.json(parsed);
    } catch (error: any) {
        if (error?.status === 429 || error?.code === 'insufficient_quota' || error?.type === 'insufficient_quota') {
            return NextResponse.json({
                text: "מכסת ה-Gemini שלכם הסתיימה בחשבון הפיתוח, לא ניתן לנתח רגשות כרגע.",
                type: "warning"
            });
        }
        console.error("Gemini Mood Error:", error?.message || error);
        return NextResponse.json({ text: "שגיאה בניתוח AI", type: "error" });
    }
}
