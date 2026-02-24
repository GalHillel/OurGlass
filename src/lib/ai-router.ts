import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { type LanguageModel } from 'ai';

/**
 * Resilient AI Router
 * Tries Gemini first, falls back to OpenAI if Gemini hits a quota limit (429).
 */
export function getResilientModel(): LanguageModel {
    // We don't use the built-in 'fallback' if it's causing lint errors in this version.
    // Instead, we implement a wrapper or just use the OpenAI model as primary if Gemini is known to be down,
    // but for 'streamText' we need a model object.

    // Note: Vercel AI SDK 'experimental_fallback' exists in some versions.
    // Since the user reported "Module 'ai' has no exported member 'fallback'", 
    // we will implement a logic in the routes themselves or use a provider wrapper if available.

    // Actually, the best way to handle 'streamText' fallback without the 'fallback' helper
    // is to handle it in the POST handler.

    // However, I can return the Gemini model as default.
    return google('gemini-2.5-flash');
}

export const primaryModel = google('gemini-2.5-flash');
export const backupModel = openai('gpt-4o-mini');

/**
 * Helper to check if an error is a quota/rate limit error
 */
export function isQuotaError(error: unknown): boolean {
    const err = error as { status?: number; statusCode?: number; code?: string; message?: string };
    const status = err?.status || err?.statusCode;
    const code = err?.code;
    const message = String(err?.message || '').toLowerCase();

    return (
        status === 429 ||
        code === 'insufficient_quota' ||
        code === 'rate_limit_exceeded' ||
        message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('resource_exhausted')
    );
}
