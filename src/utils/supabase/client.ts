import { createBrowserClient } from '@supabase/ssr'

import { DEMO_MODE } from '@/demo/demo-config';

export function createClient() {
    // In demo mode, we don't need real credentials
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || (DEMO_MODE ? 'https://demo.supabase.co' : '');
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (DEMO_MODE ? 'demo-key' : '');

    return createBrowserClient(
        url!,
        key!
    )
}
