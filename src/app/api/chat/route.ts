import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { FinancialContext } from "@/types";

interface TransactionSummary {
  [category: string]: {
    count: number;
    total: number;
  };
}

const toSafeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[], context: FinancialContext } = await req.json();

  // Aggregating transactions to save Gemini tokens
  const recentTx = context?.recentTransactions || [];
  const monthlyIncome = toSafeNumber(context?.income);
  const rawBudget = toSafeNumber(context?.budget);
  const totalSpentThisMonth = recentTx.reduce((sum, tx) => sum + toSafeNumber(tx.amount), 0);
  const subscriptions = context?.subscriptions || [];
  const liabilities = context?.liabilities || [];
  const debtObligations = (context?.debtObligations && context.debtObligations.length > 0)
    ? context.debtObligations
    : liabilities.filter((liability) => {
      const remaining = toSafeNumber(liability.remaining_amount ?? liability.current_balance);
      if (remaining <= 0) return false;
      if (!liability.end_date) return true;
      const payoffDate = new Date(liability.end_date);
      return Number.isNaN(payoffDate.getTime()) || payoffDate >= new Date();
    });
  const activeDebtPaymentsTotal = debtObligations.reduce(
    (sum, liability) => sum + toSafeNumber(liability.monthly_payment),
    0
  );

  const activeSubscriptionsTotal = subscriptions
    .filter(subscription => subscription.active !== false)
    .reduce((sum, subscription) => sum + toSafeNumber(subscription.amount), 0);

  const fallbackBudget = monthlyIncome > 0
    ? Math.max(monthlyIncome, totalSpentThisMonth)
    : totalSpentThisMonth > 0
      ? totalSpentThisMonth
      : toSafeNumber(context?.fixedExpenses);
  const resolvedBudget = rawBudget > 0 ? rawBudget : fallbackBudget;

  const currentLeftoverIncome = monthlyIncome - totalSpentThisMonth;

  const txSummary = recentTx.reduce((acc: TransactionSummary, tx) => {
    const cat = tx.category || 'Other';
    if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
    acc[cat].count += 1;
    acc[cat].total += toSafeNumber(tx.amount);
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

    Financial Summary:
    - Income: ₪${monthlyIncome.toLocaleString()}
    - Budget: ₪${resolvedBudget.toLocaleString()}
    - Total Spent This Month (Including Subscriptions): ₪${totalSpentThisMonth.toLocaleString()}
    - Active Subscriptions Total: ₪${activeSubscriptionsTotal.toLocaleString()}
    - Active Debt Payments Total: ₪${activeDebtPaymentsTotal.toLocaleString()}
    - Monthly Budget Limit: ${resolvedBudget} NIS.
    - Current Leftover Income: ₪${currentLeftoverIncome.toLocaleString()}

    CRITICAL MATH RULE: The 'Total Spent This Month' figure ALREADY INCLUDES all paid subscriptions and recurring bills. DO NOT add 'Total Subscriptions Cost' to 'Total Spent This Month'. Doing so is double-counting and strictly forbidden.
    The 'Subscriptions' list is provided ONLY so you know the user's fixed obligations. Do not treat them as extra unrecorded expenses unless predicting future unpaid bills.
    Active monthly debt payments are now automatically included in Fixed Expenses. Help the user prioritize paying off debts with the highest interest rates first (Avalanche strategy).
    Current Leftover Income = (Monthly Income) - (Total Spent This Month).
    
    Financial Context:
    - Monthly Income (from settings): ₪${monthlyIncome.toLocaleString()}
    - Monthly Budget for variable expenses (from settings): ₪${resolvedBudget.toLocaleString()}
    - Fixed Expenses (Total: ₪${toSafeNumber(context?.fixedExpenses).toLocaleString()}):
      * Subscriptions: ${JSON.stringify(subscriptions || 'None')}
      * Debt Obligations (active only): ${JSON.stringify(debtObligations || 'None')}
      * All Liabilities (historical/full list): ${JSON.stringify(liabilities || 'None')}
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
    5. ההכנסה החודשית והתקציב הם מהגדרות המשתמש - אל תנחש אותם. אם הם 0, שאל את המשתמש לעדכן בהגדרות.
    6. כשאתה מחשב מצב כספי נוכחי, השתמש רק ב-Total Spent This Month כהוצאה בפועל. אל תוסיף שוב מנויים שכבר שולמו.`;

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: systemMessage,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
