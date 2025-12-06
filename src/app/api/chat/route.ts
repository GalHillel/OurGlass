import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, context } = await req.json();

    // Create a system message with the financial context
    const systemMessage = `You are a financial therapist for a couple named Gal and Iris. You are witty, strict but kind. 
    Analyze their spending data and give advice.
    
    Current Financial Context:
    - Real Number Balance: ₪${context?.balance || 'Unknown'}
    - Recent Transactions: ${JSON.stringify(context?.recentTransactions || [])}
    
    If the balance is low (< 1000), be strict. If high (> 10000), be encouraging but cautious about lifestyle creep.
    Keep answers concise (under 3 sentences usually). Use emojis.`;

    const result = streamText({
        model: openai('gpt-4o'),
        system: systemMessage,
        messages,
    });

    return result.toTextStreamResponse();
}
