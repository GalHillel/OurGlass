import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const body = await req.json();
        const { transactions, budget, monthlyIncome, subscriptions, liabilities = [] } = body;

        const totalSpent = (transactions as { amount: number }[]).reduce((s: number, t) => s + t.amount, 0);
        const subTotal = (subscriptions as { amount: number }[]).reduce((s: number, sub) => s + (sub.amount || 0), 0);
        const liabTotal = (liabilities as { monthly_payment: number }[]).reduce((s: number, l) => s + (l.monthly_payment || 0), 0);
        const totalFixed = subTotal + liabTotal;
        const budgetUsage = budget > 0 ? (totalSpent / budget) * 100 : 0;
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalSpent) / monthlyIncome) * 100 : 0;

        // Group categories securely to avoid token limit explosions
        const categoryTotals: Record<string, number> = {};
        (transactions as { category?: string; amount: number }[]).forEach((tx) => {
            const cat = tx.category || "אחר";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
        });

        const prompt = `
You are a witty, slightly sarcastic but highly intelligent financial coach in a couple's finance app called OurGlass.
Your job is to analyze their current month's financial data and provide 3 short, punchy insights in Hebrew.
Each insight must be either a "roast" (if they are doing poorly) or a "praise" (if they are doing well).

Here is their data for the month:
- Total budget: ₪${budget}
- Monthly Income: ₪${monthlyIncome}
- Total spent so far: ₪${totalSpent} (${budgetUsage.toFixed(1)}% of budget)
- Savings rate: ${savingsRate.toFixed(1)}%
- Total fixed expenses (subscriptions + liabilities/loans): ₪${totalFixed} (Subs: ₪${subTotal}, Loans: ₪${liabTotal})
- Spending by category: ${JSON.stringify(categoryTotals)}
- Number of transactions: ${transactions.length}

Rules:
1. Speak directly to the couple in plural Hebrew (אתם, שלכם).
2. Use modern, Gen-Z / millennial Israeli slang where appropriate (e.g., "אחלה", "וואלה", "הגזמתם", "פצצה").
3. Be brutally honest but funny.
4. Return EXACTLY a JSON array of 3 objects, nothing else. No markdown wrappers.
5. Each object must have:
   - "type": "roast" or "praise"
   - "text": The insight text (max 15 words)
   - "emoji": A single relevant emoji

Example Output format:
[
  { "type": "roast", "text": "חרגתם בטירוף על אוכל, וולט חוגגים עליכם החודש 🍔", "emoji": "🍔" },
  { "type": "praise", "text": "חסכתם 30% מההכנסה! וורן באפט מצדיע לכם 📈", "emoji": "📈" }
]
`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.8,
                responseMimeType: "application/json",
            }
        };

        let content = "";

        try {
            const result = await model.generateContent(payload);
            content = result.response.text() || "[]";
        } catch (error: unknown) {
            const { isQuotaError } = await import('@/lib/ai-router');
            if (isQuotaError(error) && process.env.OPENAI_API_KEY) {
                console.warn("Insights: Gemini Quota Exceeded, falling back to OpenAI...");
                const { generateText } = await import('ai');
                const { openai } = await import('@ai-sdk/openai');

                const { text } = await generateText({
                    model: openai('gpt-4o-mini'),
                    prompt: prompt,
                });
                content = text || "[]";
            } else {
                throw error;
            }
        }

        // Sometimes GPT wraps in JSON object if response_format is json_object
        // We asked for an array. Let's parse safely.
        let parsed = [];
        try {
            const parsedContent = JSON.parse(content);
            if (Array.isArray(parsedContent)) {
                parsed = parsedContent;
            } else if (parsedContent.insights && Array.isArray(parsedContent.insights)) {
                parsed = parsedContent.insights;
            } else {
                // If it returned an object with an array inside
                const values = Object.values(parsedContent);
                const arrayVal = values.find(v => Array.isArray(v));
                if (arrayVal) parsed = arrayVal as unknown[];
            }
        } catch (e: unknown) {
            console.error("Failed to parse Gemini/AI response", content, e);
        }

        return NextResponse.json({ insights: parsed.slice(0, 3) });
    } catch (error: unknown) {
        const err = error as { status?: number | string; code?: number | string; message?: string };
        const isQuotaError =
            err?.status === 429 ||
            err?.code === 429 ||
            err?.status === 'RESOURCE_EXHAUSTED' ||
            err?.code === 'insufficient_quota' ||
            (typeof err?.message === 'string' && (
                err.message.toLowerCase().includes('quota') ||
                err.message.toLowerCase().includes('exhausted')
            ));

        if (isQuotaError) {
            return NextResponse.json({
                insights: [{
                    type: "info",
                    text: "המכסה בחשבון ה-Gemini שלכם הסתיימה (שגיאה 429). אנא קשרו אמצעי תשלום כדי להמשיך להשתמש ב-AI.",
                    emoji: "💳"
                }]
            });
        }
        console.error("Gemini Insights Error Detailed:", err.message || err, "Status:", err.status);

        // Catch-all fallback so the frontend never crashes
        return NextResponse.json({
            insights: [{
                type: "info",
                text: "מערכת ה-AI עמוסה כרגע או שגיאת התחברות (Server Error). אנא נסו שוב מאוחר יותר.",
                emoji: "🤖"
            }]
        });
    }
}
