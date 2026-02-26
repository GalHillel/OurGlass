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
CRITICAL RULES FOR EXECUTING TOOLS:
1. **INSTALLMENTS (תשלומים)**: If the user mentions installments, input the EXACT TOTAL AMOUNT as 'amount' and the number of payments as the 'installments' integer. DO NOT modify the description to include "X of Y".
2. **STOCKS (מניות)**: When adding a stock, you MUST set 'type' to 'stock', and you MUST provide the 'symbol' (e.g., AAPL), 'shares' (quantity), and 'average_buy_price'. 
3. **ABSOLUTE VALUES ONLY**: Financial amounts (amount, target_amount, current_amount, price, average_buy_price) MUST ALWAYS BE POSITIVE NUMBERS.
4. **EMOJIS**: Every tool requires an 'emoji'. Always pick a highly fitting, single emoji.
5. **AUTO-ENRICHMENT**: If the user doesn't specify a category, magically guess the best matching category from this list: ${CATEGORIES_LIST}.
6. **FEEDBACK**: Immediately output a natural, warm Hebrew text acknowledging the precise action you just took (e.g., "הוספתי את המניה לאפל! 🍏"). DO NOT just execute the tool silently.

Context:
${JSON.stringify(context, null, 2)}
User Identity: ${context?.identityName || 'User'}
Current Route: ${context?.currentRoute || 'Unknown'}
`;

  // Define parameter schemas
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

  const updateTransactionParams = z.object({
    id: z.string(),
    updates: z.record(z.string(), z.any()),
  });

  const deleteTransactionParams = z.object({ id: z.string() });

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

  const addSubscriptionParams = z.object({
    name: z.string(),
    emoji: z.string(),
    amount: z.number().positive(),
    billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
    payer: z.enum(['him', 'her', 'joint']),
    category: z.string().optional(),
  });

  const addWishParams = z.object({
    title: z.string(),
    target_amount: z.number().positive(),
    emoji: z.string(),
  });

  const mapsToPageParams = z.object({
    path: z.string(),
  });

  // Build tools object with explicit 'any' to resolve persistent version-mismatch lint errors
  const tools: any = {
    addTransaction: tool({
      description: 'Add a new transaction.',
      parameters: addTransactionParams,
      execute: async (params: any) => {
        try {
          const { amount, description, category, type, payer, emoji, installments, date, mood_rating } = params;
          const finalDescription = `${emoji} ${description}`;
          const isExpense = type === 'expense';
          const items = [];

          if (installments > 1) {
            const perInstallment = Math.round((amount / installments) * 100) / 100;
            const startDate = date ? new Date(date) : new Date();
            for (let i = 0; i < installments; i++) {
              const d = new Date(startDate);
              d.setMonth(startDate.getMonth() + i);
              items.push({
                amount: isExpense ? -perInstallment : perInstallment,
                description: `${finalDescription} (${i + 1}/${installments})`,
                category: category,
                payer: payer,
                user_id: user?.id,
                couple_id: coupleId,
                date: d.toISOString(),
                mood_rating: mood_rating,
              });
            }
          } else {
            items.push({
              amount: isExpense ? -Math.abs(amount) : Math.abs(amount),
              description: finalDescription,
              category: category,
              payer: payer,
              user_id: user?.id,
              couple_id: coupleId,
              date: date || new Date().toISOString(),
              mood_rating: mood_rating,
            });
          }

          const { error } = await supabase.from('transactions').insert(items);
          if (error) throw error;
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    updateTransaction: tool({
      description: 'Update an existing transaction.',
      parameters: updateTransactionParams,
      execute: async ({ id, updates }: any) => {
        try {
          const { error } = await supabase.from('transactions').update(updates).eq('id', id);
          if (error) throw error;
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    deleteTransaction: tool({
      description: 'Delete a transaction.',
      parameters: deleteTransactionParams,
      execute: async ({ id }: any) => {
        try {
          const { error } = await supabase.from('transactions').delete().eq('id', id);
          if (error) throw error;
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    addAsset: tool({
      description: 'Add an asset.',
      parameters: addAssetParams,
      execute: async (params: any) => {
        try {
          let value = params.current_amount || 0;
          if (params.type === 'stock' && params.shares && params.average_buy_price) {
            value = params.shares * params.average_buy_price;
          }

          const { error } = await supabase.from('goals').insert({
            name: `${params.emoji} ${params.name}`,
            type: params.type === 'stock' ? 'stock' : 'cash',
            investment_type: params.type,
            current_amount: value,
            target_amount: value * 1.5,
            symbol: params.symbol,
            quantity: params.shares,
            currency: params.currency,
            institution: params.institution,
            couple_id: coupleId,
            last_updated: new Date().toISOString(),
          });
          if (error) throw error;
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    addSubscription: tool({
      description: 'Add a recurring subscription.',
      parameters: addSubscriptionParams,
      execute: async (params: any) => {
        try {
          const { error } = await supabase.from('subscriptions').insert({
            name: `${params.emoji} ${params.name}`,
            amount: params.amount,
            owner: params.payer,
            category: params.category || 'חשבונות',
            billing_cycle: params.billing_cycle,
            couple_id: coupleId,
            active: true,
          });
          if (error) throw error;
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    addWish: tool({
      description: 'Add an item to the wishlist.',
      parameters: addWishParams,
      execute: async (params: any) => {
        try {
          const { error } = await supabase.from('wishlist').insert({
            name: `${params.emoji} ${params.title}`,
            price: params.target_amount,
            status: 'pending',
            current_amount: 0,
            couple_id: coupleId,
            requested_by: user?.id,
          });
          if (error) throw error;
          return { success: true };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    }),

    MapsToPage: tool({
      description: 'Navigate the UI.',
      parameters: mapsToPageParams,
      execute: async ({ path }: any) => {
        return { success: true, path };
      },
    }),
  };

  try {
    const result = streamText({
      model: google('gemini-1.5-flash-latest'),
      system: systemMessage,
      messages: modelMessages,
      tools: tools,
      maxSteps: 5,
      abortSignal: req.signal,
    } as any);
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    const { isQuotaError, backupModel } = await import('@/lib/ai-router');
    if (isQuotaError(error)) {
      const result = streamText({
        model: backupModel,
        system: systemMessage,
        messages: modelMessages,
        tools: tools,
        maxSteps: 5,
        abortSignal: req.signal,
      } as any);
      return result.toUIMessageStreamResponse();
    }
    console.error("Chat API Error:", error);
    throw error;
  }
}
