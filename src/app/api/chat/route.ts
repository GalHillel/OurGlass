import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

// Create an OpenAI API client (that's why we need the API key)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
    const { messages, context } = await req.json();

    // Create a system message with the financial context
    const systemMessage = {
        role: 'system',
        content: `You are a financial therapist for a couple named Gal and Iris. You are witty, strict but kind. 
    Analyze their spending data and give advice.
    
    Current Financial Context:
    - Real Number Balance: ₪${context?.balance || 'Unknown'}
    - Recent Transactions: ${JSON.stringify(context?.recentTransactions || [])}
    
    If the balance is low (< 1000), be strict. If high (> 10000), be encouraging but cautious about lifestyle creep.
    Keep answers concise (under 3 sentences usually). Use emojis.`
    };

    // Ask OpenAI for a streaming completion given the prompt
    const response = await openai.chat.completions.create({
        model: 'gpt-4o', // or gpt-3.5-turbo if 4o is not available
        stream: true,
        messages: [systemMessage, ...messages],
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
}
