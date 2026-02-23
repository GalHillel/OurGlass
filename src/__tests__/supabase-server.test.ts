import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import * as supabaseSsr from '@supabase/ssr';

vi.mock('next/headers', () => ({
    cookies: vi.fn()
}));

vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn().mockReturnValue('mock-server-client')
}));

describe('Supabase Server Utility', () => {
    const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (cookies as any).mockResolvedValue(mockCookieStore);

        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    it('creates a server client correctly', async () => {
        const client = await createClient();

        expect(supabaseSsr.createServerClient).toHaveBeenCalled();
        expect(client).toBe('mock-server-client');
    });
});
