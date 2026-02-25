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

  const transactions = context?.transactions || context?.recentTransactions || [];
  const monthlyIncome = toSafeNumber(context?.income);
  const rawBudget = toSafeNumber(context?.budget);
  const subscriptions = (context?.subscriptions || []).filter(subscription => subscription.active !== false);
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

  const activeSubscriptionsTotal = subscriptions.reduce((sum, subscription) => sum + toSafeNumber(subscription.amount), 0);

  // MANDATE 3: UNIFY SPENDING MATH FOR AI
  const totalSpentThisMonth = transactions.reduce((sum, tx) => sum + toSafeNumber(tx.amount), 0) + activeDebtPaymentsTotal + activeSubscriptionsTotal;

  const fallbackBudget = monthlyIncome > 0
    ? Math.max(monthlyIncome, totalSpentThisMonth)
    : totalSpentThisMonth > 0
      ? totalSpentThisMonth
      : toSafeNumber(context?.fixedExpenses);
  const resolvedBudget = rawBudget > 0 ? rawBudget : fallbackBudget;

  const currentLeftoverIncome = monthlyIncome - totalSpentThisMonth;
  const burnRate = context?.burnRate || {
    daily: 0,
    weekly: 0,
    monthlySpend: totalSpentThisMonth,
    monthProgressPct: 0,
  };

  const txSummary = transactions.reduce((acc: TransactionSummary, tx) => {
    const cat = tx.category || 'Other';
    if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
    acc[cat].count += 1;
    acc[cat].total += toSafeNumber(tx.amount);
    return acc;
  }, {});

  const topRecent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15)
    .map(t => ({
      description: t.description || 'ללא תיאור',
      category: t.category || 'Other',
      amount: toSafeNumber(t.amount),
      date: t.date,
    }));

  const identityName = context?.identityName || '';
  const liveNetWorth = context?.liveNetWorth ?? null;
  const assets = context?.assets;

  const systemMessage = `אתה פסיכולוג/יועץ פיננסי חכם, שנון, מעט קשוח אך אמפתי עבור הזוג.
אתה מדבר עם ${identityName || 'המשתמש'}. פנה אליו/אליה בשמו/ה.
אתה מקבל הקשר פיננסי מלא ועדכני. השתמש בו כדי לתת תשובות מדויקות, מותאמות אישית וברות-ביצוע.
${context?.currentRoute ? `\n📍 **המשתמש נמצא כעת במסך:** ${context.currentRoute} - נצל מידע זה כדי לתת תובנות תלויות-הקשר (למשל, אם הוא ב-Vault, דבר על חסכונות והשקעות).` : ''}

💰 Cash & Assets Breakdown
- Bank Cash: ₪${toSafeNumber(assets?.bankCash).toLocaleString()}
- Stocks/Investments: ₪${toSafeNumber(assets?.stocksInvestments).toLocaleString()}
- Money Market/Kaspit: ₪${toSafeNumber(assets?.moneyMarketKaspit).toLocaleString()}
- USD Cash: $${toSafeNumber(assets?.usdCash?.usdAmount).toLocaleString()} (₪${toSafeNumber(assets?.usdCash?.ilsValue).toLocaleString()})
- Total Tracked Assets: ₪${toSafeNumber(assets?.totalTrackedAssets).toLocaleString()}
- LIVE Net Worth (use this over old snapshots): ${liveNetWorth !== null ? '₪' + Number(liveNetWorth).toLocaleString() : 'לא זמין'}
- Last DB Wealth Snapshot (historical reference only): ${JSON.stringify(context?.wealthSnapshot || null)}

📉 Debts & Liabilities
- Active Debt Payments Total: ₪${activeDebtPaymentsTotal.toLocaleString()}
- Debt Obligations (active): ${JSON.stringify(debtObligations || [])}
- All Liabilities (full list): ${JSON.stringify(liabilities || [])}

🔄 Fixed Subscriptions
- Active Subscriptions Total: ₪${activeSubscriptionsTotal.toLocaleString()}
- Active Subscriptions: ${JSON.stringify(subscriptions || [])}

💳 Recent Transactions
- Monthly Transaction Count: ${transactions.length}
- Monthly Transaction Category Summary: ${JSON.stringify(txSummary)}
- Detailed Transaction Feed (description/category/amount/date): ${JSON.stringify(topRecent)}

📊 Current Cashflow
- Monthly Income (from settings): ₪${monthlyIncome.toLocaleString()}
- Monthly Budget (from settings): ₪${resolvedBudget.toLocaleString()}
- Total Spent This Month (actual recorded spending): ₪${totalSpentThisMonth.toLocaleString()}
- Leftover Income: ₪${currentLeftoverIncome.toLocaleString()}
- Burn Rate Daily: ₪${toSafeNumber(burnRate.daily).toLocaleString()}
- Burn Rate Weekly: ₪${toSafeNumber(burnRate.weekly).toLocaleString()}
- Burn Rate Month Progress: ${toSafeNumber(burnRate.monthProgressPct)}%

🎯 Wishlist & Goals
- Wishlist (pending goals/wishes): ${JSON.stringify(context?.wishlist || [])}

CRITICAL MATH RULE: Do not double-count subscriptions as they are already paid from the bank cash or included in the transactions.
The 'Total Spent This Month' already includes paid subscriptions/recurring bills when they appear in transactions. Use subscriptions as visibility for recurring obligations and future planning only.

כללים:
1. אם המשתמש שואל "מה מצבי?" "האם אני יכול לקנות משהו?", "כמה הוצאתי?" חשב אך ורק מתוך הנתונים שסופקו כאן.
2. ענה תמיד בעברית בלבד, בלשון דיבור טבעית.
3. שמור על תשובות קצרות וקולעות (עד 4 משפטים), אלא אם התבקשת לפרט.
4. השתמש באימוג'י רלוונטיים. אם פנוי כסף - תעודד מהלכים חכמים. אם בחובות או חריגה מהתקציב - תהיה קשוח אבל מעודד.
5. ההכנסה החודשית והתקציב הם מהגדרות המשתמש - אל תנחש אותם. אם הם 0, בקש לעדכן בהגדרות.
6. בעת חישוב מצב כספי נוכחי, השתמש ב-Total Spent This Month כהוצאה בפועל, ואל תוסיף שוב עלויות מנוי שכבר שולמו.`;

  const modelMessages = await convertToModelMessages(messages);

  try {
    const result = streamText({
      model: google('gemini-2.5-flash'), // Primary
      system: systemMessage,
      messages: modelMessages,
      abortSignal: req.signal,
    });
    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const { isQuotaError, backupModel } = await import('@/lib/ai-router');

    if (isQuotaError(error)) {
      console.warn("Chat API: Gemini Quota Exceeded, falling back to OpenAI...");
      const result = streamText({
        model: backupModel,
        system: systemMessage,
        messages: modelMessages,
        abortSignal: req.signal,
      });
      return result.toUIMessageStreamResponse();
    }
    console.error("Chat API Error:", error);
    throw error;
  }
}
