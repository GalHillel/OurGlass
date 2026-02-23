import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { Transaction, Subscription, Liability, WealthSnapshot, WishlistItem, FinancialContext } from "@/types";

interface TransactionSummary {
  [category: string]: {
    count: number;
    total: number;
  };
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[], context: FinancialContext } = await req.json();

  // Aggregating transactions to save Gemini tokens
  const recentTx = context?.recentTransactions || [];
  const txSummary = recentTx.reduce((acc: TransactionSummary, tx) => {
    const cat = tx.category || 'Other';
    if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
    acc[cat].count += 1;
    acc[cat].total += Number(tx.amount);
    return acc;
  }, {});

  const topRecent = [...recentTx]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(t => ({ desc: t.description, amt: t.amount, cat: t.category }));

  // Identity & settings from context
  const identityName = context?.identityName || '';
  const liveNetWorth = context?.liveNetWorth ?? null;

  // Create a system message with the financial context
  const systemMessage = `אתה פסיכולוג/יועץ פיננסי חכם, שנון, מעט קשוח אך אמפתי עבור הזוג.
    אתה מדבר עם ${identityName || 'המשתמש'}. פנה אליו/אליה בשמו/ה.
    אתה מקבל את כל הנתונים שלהם עד היום. השתמש במידע זה כדי לתת תשובות סופר-מדויקות, מותאמות אישית, שמראות שאתה מכיר את כל החשבונות שלהם.
    
    Financial Context:
    - Monthly Income (from settings): ₪${context?.income ?? '0'}
    - Monthly Budget for variable expenses (from settings): ₪${context?.budget ?? '0'}
    - Fixed Expenses (Total: ₪${context?.fixedExpenses || '0'}):
      * Subscriptions: ${JSON.stringify(context?.subscriptions || 'None')}
      * Loans/Liabilities: ${JSON.stringify(context?.liabilities || 'None')}
    - LIVE Net Worth (calculated right now): ${liveNetWorth !== null ? '₪' + Number(liveNetWorth).toLocaleString() : 'לא זמין'}
    - Last DB Wealth Snapshot (historical reference): ${JSON.stringify(context?.wealthSnapshot || 'No snapshot')}
    - Wishlist (What they are saving for): ${JSON.stringify(context?.wishlist || 'Empty')}
    - This Month Spending Summary by Category: ${JSON.stringify(txSummary)}
    - 5 Most Recent Transactions: ${JSON.stringify(topRecent)}
    
    כללים:
    1. אם המשתמש שואל "מה מצבי?" "האם אני יכול לקנות משהו?", "כמה הוצאתי?", חשב נתונים מתוך המידע שסופק וענה לו בצורה מדויקת. השתמש תמיד בשווי הנקי החי (LIVE Net Worth), לא בסנאפשוט ישן.
    2. ענה תמיד בעברית בלבד, בלשון דיבור טבעית.
    3. שמור על תשובות קצרות וקולעות (עד 4 משפטים), אלא אם התבקשת לפרט.
    4. השתמש באימוג'י רלוונטיים. אם פנוי כסף - תוציא אותם לקניות! אם בחובות או חריגה מהתקציב - תהיה קשוח אבל מעודד.
    5. ההכנסה החודשית והתקציב הם מהגדרות המשתמש - אל תנחש אותם. אם הם 0, שאל את המשתמש לעדכן בהגדרות.`;

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: systemMessage,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
