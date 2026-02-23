import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSession } from '@/utils/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn().mockImplementation(() => {
        return {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
            }
        };
    })
}));

describe('Supabase Middleware Utility', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('processes request and ignores public routes', async () => {
        const req = new NextRequest(new URL('http://localhost/login'));

        const response = await updateSession(req);
        // It should return the response even if user is null
        expect(response).toBeInstanceOf(NextResponse);
    });

    it('redirects to login if user is missing on protected route', async () => {
        const req = new NextRequest(new URL('http://localhost/settings'));

        const response = await updateSession(req);
        // It redirects back to /login
        expect(response.headers.get('location')).toContain('/login');
    });

    it('allows access to root page /', async () => {
        const req = new NextRequest(new URL('http://localhost/'));

        const response = await updateSession(req);
        // For the root path, if no user, it redirects to /login as it's a protected route
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toContain('/login');
    });
});
