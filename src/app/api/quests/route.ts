import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ quests: [] });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const body = await req.json();
        const { transactions = [], subscriptions = [], liabilities = [], balance = 0, budget = 0, xpParams } = body;

        const subTotal = (subscriptions as { amount: number }[]).reduce((s: number, sub) => s + (sub.amount || 0), 0);
        const liabTotal = (liabilities as { monthly_payment: number }[]).reduce((s: number, l) => s + (l.monthly_payment || 0), 0);
        const totalFixed = subTotal + liabTotal;

        const prompt = `
You are the gamification master in the OurGlass finance app.
Generate exactly 3 personalized financial quests (challenges/achievements) for the user this month.
These should be based on their current spending and budget behavior.

Data context:
- Monthly Budget: ₪${budget}
- Current total spent (variable): ₪${xpParams?.totalSpent || 0}
- Total fixed expenses (subscriptions + loans): ₪${totalFixed} (Subs: ₪${subTotal}, Loans: ₪${liabTotal})
- Unique days with transactions: ${xpParams?.daysWithTransactions || 0}
- App recording streak: ${xpParams?.streak || 0} days

Rules:
1. Speak in modern Hebrew context.
2. Return EXACTLY a JSON array wrapped in a 'quests' object. Example:
{
  "quests": [
    {
      "id": "fixed-cost-audit",
      "title": "בלש הוצאות קבועות",
      "description": "בדוק אם אפשר לקצץ מתוך ה-₪${totalFixed} הקבועים שלכם",
      "icon": "Target",
      "progress": 50,
      "completed": false,
      "xp": 50,
      "color": "blue"
    }
  ]
}
3. The 'icon' MUST be one of these exact strings: Trophy, Star, Shield, Zap, TrendingDown, Target, Gift, Lock, ShieldCheck, Coins, Flame.
4. 'color' MUST be one of: emerald, yellow, blue, purple, orange, red.
5. Make sure the 'progress' (0 to 100) logically reflects their 'xpParams'.
6. Evaluate if the quest is 'completed' (boolean).
7. Do not wrap in markdown \`\`\`json. Return bare JSON.
`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.8,
                responseMimeType: "application/json",
            }
        });

        const content = result.response.text() || "{}";
        let parsed: { quests: unknown[] } = { quests: [] };
        try {
            const temp = JSON.parse(content);
            if (Array.isArray(temp)) {
                parsed = { quests: temp };
            } else if (temp && Array.isArray(temp.quests)) {
                parsed = temp;
            }
        } catch (e) {
            console.error("Failed to parse quests json", content);
        }

        return NextResponse.json(parsed);
    } catch (error: unknown) {
        const err = error as { status?: number; code?: string; type?: string; message?: string };
        if (err?.status === 429 || err?.code === 'insufficient_quota' || err?.type === 'insufficient_quota') {
            return NextResponse.json({
                quests: [
                    {
                        id: "quota-missing",
                        title: "סיימו מגבלות API",
                        description: "עדכנו אמצעי תשלום בחשבון ה-Gemini כדי לקבל משימות",
                        icon: "Lock",
                        progress: 0,
                        completed: false,
                        xp: 0,
                        color: "red"
                    }
                ]
            });
        }
        console.error("Gemini Quests Error:", err?.message || err);
        return NextResponse.json({ quests: [] });
    }
}
