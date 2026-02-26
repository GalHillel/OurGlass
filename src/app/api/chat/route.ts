import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage, tool } from 'ai';
import { z } from 'zod';
import { createClient } from "@/utils/supabase/server";
import { FinancialContext } from "@/types";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[], context: FinancialContext } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const coupleId = context?.wealthSnapshot?.couple_id || null;

  const CATEGORIES_LIST = "אוכל, קפה, סופר, תחבורה, דלק, רכב, קניות, בילוי, מסעדה, חשבונות, בריאות, ביטוח, לימודים, קוסמטיקה, עבודה, אחר";

  const systemMessage = `You are OurGlass AI ("רועי"), the ultimate joint-finance assistant.

CRITICAL RULES FOR TOOL CALLING:
1. **ABSOLUTE VALUES ONLY**: All financial amounts you send to tools (amount, target_amount, current_amount, price, average_buy_price) MUST ALWAYS be positive numbers. Never send negative numbers.
2. **INSTALLMENTS (תשלומים)**: If the user mentions installments, pass the EXACT TOTAL AMOUNT as 'amount' and the number of payments as the 'installments' integer. DO NOT modify the description to include "X of Y" and do NOT split the amount yourself.
3. **STOCKS (מניות)**: When adding a stock, you MUST set 'type' to 'stock', and you MUST provide the 'symbol' (e.g., AAPL), 'shares' (quantity), and 'average_buy_price'. If current_amount is missing, it will be computed as shares * average_buy_price.
4. **AUTO-ENRICHMENT**: If the user doesn't specify a category, you MUST guess the best matching category from the app's list (for example: מזון, קניות, בילויים, רכב, דיור, חשבונות, בריאות, ביטוח, לימודים, קוסמטיקה, עבודה, אחר). Use ${CATEGORIES_LIST} as guidance.
5. **EMOJIS**: Every tool that has an 'emoji' parameter MUST get a single, highly relevant emoji. Always pick exactly one emoji that matches the action or item.
6. **MANDATORY FEEDBACK**: Whenever you execute ANY tool, you MUST ALSO send a warm, natural Hebrew message describing exactly what you just did (e.g., "הוספתי את ההוצאה על הזארה, תתחדשו! 👗" או "עדכנתי את המנוי לנטפליקס ל-45 ש\"ח לחודש 🎬"). Never execute tools silently.

General behavior:
- Always act as a proactive, responsible joint-finance assistant for a couple.
- Explain your reasoning in friendly Hebrew when helpful, but keep responses concise.

Context:
${JSON.stringify(context, null, 2)}
User Identity: ${context?.identityName || 'User'}
Current Route: ${context?.currentRoute || 'Unknown'}
`;

  // Define schemas so execute params can be typed via z.infer
  const addTransactionParams = z.object({
    amount: z.number().positive(),
    description: z.string(),
    category: z.string(),
    type: z.enum(['expense', 'income']).default('expense'),
    payer: z.enum(['him', 'her', 'joint']),
    emoji: z.string(),
    installments: z.number().int().min(1).default(1),
    date: z.string().optional(),
    mood_rating: z.number().int().min(1).max(5).optional(),
  });
  type AddTransactionParams = z.infer<typeof addTransactionParams>;

  const updateTransactionParams = z.object({
    id: z.string(),
    updates: z.record(z.string(), z.unknown()),
  });
  type UpdateTransactionParams = z.infer<typeof updateTransactionParams>;

  const deleteTransactionParams = z.object({
    id: z.string(),
  });
  type DeleteTransactionParams = z.infer<typeof deleteTransactionParams>;

  const addAssetParams = z.object({
    name: z.string(),
    emoji: z.string(),
    type: z.enum(['cash', 'stock', 'foreign_currency', 'real_estate', 'money_market']),
    current_amount: z.number().positive().optional(),
    currency: z.string().default('ILS'),
    institution: z.string().optional(),
    symbol: z.string().optional(),
    shares: z.number().positive().optional(),
    average_buy_price: z.number().positive().optional(),
  });
  type AddAssetParams = z.infer<typeof addAssetParams>;

  const addSubscriptionParams = z.object({
    name: z.string(),
    emoji: z.string(),
    amount: z.number().positive(),
    billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
    payer: z.enum(['him', 'her', 'joint']),
    category: z.string().optional(),
  });
  type AddSubscriptionParams = z.infer<typeof addSubscriptionParams>;

  const addWishParams = z.object({
    title: z.string(),
    target_amount: z.number().positive(),
    emoji: z.string(),
  });
  type AddWishParams = z.infer<typeof addWishParams>;

  const mapsToPageParams = z.object({
    path: z.string(),
  });
  type MapsToPageParams = z.infer<typeof mapsToPageParams>;

  // Build tools object with proper Vercel AI SDK tool() helpers
  const tools = {
    addTransaction: tool({
      description: 'Add a new transaction (expense or income).',
      inputSchema: addTransactionParams,
      async execute(
        { amount, description, category, type, payer, emoji, installments, date, mood_rating },
      ) {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .insert({
              amount: Math.abs(amount),
              description: `${emoji} ${description}`,
              category,
              payer,
              user_id: user?.id,
              couple_id: coupleId,
              date: date || new Date().toISOString(),
              mood_rating,
              is_surprise: false,
              tags: null,
            })
            .select()
            .single();

          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },
    }),

    updateTransaction: tool({
      description: 'Update an existing transaction.',
      inputSchema: updateTransactionParams,
      async execute({ id, updates }) {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },
    }),

    deleteTransaction: tool({
      description: 'Delete a transaction.',
      inputSchema: deleteTransactionParams,
      async execute({ id }) {
        try {
          const { error } = await supabase.from('transactions').delete().eq('id', id);
          if (error) throw error;
          return { success: true };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },
    }),

    addAsset: tool({
      description: 'Add an asset (including stocks).',
      inputSchema: addAssetParams,
      async execute({
        name,
        emoji,
        type,
        current_amount,
        currency,
        institution,
        symbol,
        shares,
        average_buy_price,
      }) {
        try {
          let value = current_amount || 0;
          if (type === 'stock' && !current_amount && shares && average_buy_price) {
            value = shares * average_buy_price;
          }

          const payload = {
            name: `${emoji} ${name}`,
            type: type === 'stock' ? 'stock' : 'cash',
            investment_type: type,
            current_amount: value,
            target_amount: value > 0 ? value * 1.5 : 0,
            symbol,
            quantity: shares,
            currency,
            institution,
            couple_id: coupleId,
            last_updated: new Date().toISOString(),
          };

          const { data, error } = await supabase.from('goals').insert(payload).select().single();
          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },
    }),

    addSubscription: tool({
      description: 'Add a recurring subscription.',
      inputSchema: addSubscriptionParams,
      async execute({ name, emoji, amount, billing_cycle, payer, category }) {
        try {
          const payload = {
            name: `${emoji} ${name}`,
            amount: Math.abs(amount),
            billing_day: 1,
            owner: payer,
            category: category || 'חשבונות',
            couple_id: coupleId,
            active: true,
          };

          const { data, error } = await supabase
            .from('subscriptions')
            .insert(payload)
            .select()
            .single();
          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },
    }),

    addWish: tool({
      description: 'Add an item to the wishlist.',
      inputSchema: addWishParams,
      async execute({ title, target_amount, emoji }) {
        try {
          const payload = {
            name: `${emoji} ${title}`,
            price: Math.abs(target_amount),
            status: 'pending',
            current_amount: 0,
            couple_id: coupleId,
            requested_by: user?.id ?? null,
            saved_amount: 0,
            priority: 0,
            link: null,
          };

          const { data, error } = await supabase.from('wishlist').insert(payload).select().single();
          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },
    }),

    MapsToPage: tool({
      description: 'Navigate the UI.',
      inputSchema: mapsToPageParams,
      async execute({ path }) {
        return { success: true, path };
      },
    }),
  };

  try {
    const result = streamText({
      model: google('gemini-1.5-flash-latest'),
      system: systemMessage,
      messages: modelMessages,
      tools,
      abortSignal: req.signal,
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    const { isQuotaError, backupModel } = await import('@/lib/ai-router');
    if (isQuotaError(error)) {
      const result = streamText({
        model: backupModel,
        system: systemMessage,
        messages: modelMessages,
        tools,
        abortSignal: req.signal,
      });
      return result.toUIMessageStreamResponse();
    }
    console.error("Chat API Error:", error);
    throw error;
  }
}
