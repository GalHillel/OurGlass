import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage, tool } from 'ai';
import { z } from 'zod';
import { createClient } from "@/utils/supabase/server";
import { FinancialContext } from "@/types";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[], context: FinancialContext } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit({ key: `api:chat:${user.id}:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return new Response("Rate limit", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  // Fetch verified profile data to get the real coupleId
  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id, name')
    .eq('id', user.id)
    .single();

  const coupleId = profile?.couple_id;
  if (!coupleId) {
    return new Response("No couple associated with this user", { status: 403 });
  }

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
User Identity: ${context?.identityName || profile?.name || 'User'}
Current Route: ${context?.currentRoute || 'Unknown'}
`;

  // Define schemas so execute params can be typed via z.infer
  const addTransactionParams = z.object({
    idempotency_key: z.string().uuid(),
    amount: z.number().positive(),
    description: z.string(),
    category: z.string(),
    type: z.enum(['expense', 'income', 'transfer', 'adjustment']).default('expense'),
    payer: z.enum(['him', 'her', 'joint']),
    emoji: z.string(),
    installments: z.number().int().min(1).default(1),
    date: z.string().optional(),
    mood_rating: z.number().int().min(1).max(5).optional(),
  });

  const updateTransactionParams = z.object({
    id: z.string(),
    updates: z.object({
      description: z.string().optional(),
      category: z.string().optional(),
      amount: z.number().positive().optional(),
      type: z.enum(['expense', 'income', 'transfer', 'adjustment']).optional(),
      payer: z.enum(['him', 'her', 'joint']).optional(),
      emoji: z.string().optional(),
      date: z.string().optional(),
      mood_rating: z.number().int().min(1).max(5).optional(),
    }),
  });

  const deleteTransactionParams = z.object({
    id: z.string(),
  });

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

  // Build tools object with proper Vercel AI SDK tool() helpers
  const tools = {
    addTransaction: tool({
      description: 'Add a new transaction (expense or income).',
      inputSchema: addTransactionParams,
      async execute(
        { idempotency_key, amount, description, category, type, payer, emoji, date, mood_rating },
      ) {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .upsert({
              idempotency_key,
              amount: Math.abs(amount),
              type,
              description: `${emoji} ${description}`,
              category,
              payer,
              user_id: user.id,
              couple_id: coupleId,
              date: date || new Date().toISOString(),
              mood_rating,
              is_surprise: false,
              tags: null,
            }, { onConflict: 'couple_id,idempotency_key' })
            .select()
            .single();

          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          console.error("Tool Error (addTransaction):", e);
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
          // Security: Ensure the transaction belongs to the same couple
          const { data: existing } = await supabase
            .from('transactions')
            .select('couple_id')
            .eq('id', id)
            .single();

          if (existing?.couple_id !== coupleId) {
            throw new Error("Unauthorized to update this transaction");
          }

          const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .eq('couple_id', coupleId)
            .select()
            .single();

          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          console.error("Tool Error (updateTransaction):", e);
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
          // Security check
          const { data: existing } = await supabase
            .from('transactions')
            .select('couple_id')
            .eq('id', id)
            .single();

          if (existing?.couple_id !== coupleId) {
            throw new Error("Unauthorized to delete this transaction");
          }

          const { error } = await supabase.from('transactions').delete().eq('id', id).eq('couple_id', coupleId);
          if (error) throw error;
          return { success: true };
        } catch (e) {
          console.error("Tool Error (deleteTransaction):", e);
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
          console.error("Tool Error (addAsset):", e);
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
      async execute({ name, emoji, amount, payer, category }) {
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
          console.error("Tool Error (addSubscription):", e);
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
            requested_by: user.id,
            saved_amount: 0,
            priority: 0,
            link: null,
          };

          const { data, error } = await supabase.from('wishlist').insert(payload).select().single();
          if (error) throw error;
          return { success: true, data };
        } catch (e) {
          console.error("Tool Error (addWish):", e);
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
    const stream = streamText({
      model: google('gemini-1.5-flash-latest'),
      system: systemMessage,
      messages: modelMessages,
      tools,
      abortSignal: req.signal,
    });

    return stream.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Stream Error:", error);

    try {
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
    } catch (importErr) {
      console.error("Error importing AI router:", importErr);
    }

    return new Response(JSON.stringify({ error: "חלה שגיאה בעיבוד הבקשה. אנא נסה שנית." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

}
