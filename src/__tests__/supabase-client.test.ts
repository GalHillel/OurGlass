import { describe, it, expect, vi } from 'vitest';
import * as supabaseSsr from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn().mockReturnValue('mock-browser-client')
}));

describe('Supabase Client Utility', () => {
    it('creates a browser client with environment variables', async () => {
        vi.resetModules();
        vi.unmock('@/utils/supabase/client');
        const { createClient } = await import('@/utils/supabase/client');

        // Suppress missing env warnings temporarily
        const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const client = createClient();

        expect(supabaseSsr.createBrowserClient).toHaveBeenCalledWith('http://localhost', 'test-key');
        expect(client).toBe('mock-browser-client');

        process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });
});
