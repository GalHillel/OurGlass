import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfills for Radix UI, Framer Motion, and Vaul (Drawer)
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

if (typeof window !== 'undefined') {
    class MockPointerEvent extends Event {
        button: number;
        ctrlKey: boolean;
        pointerType: string;

        constructor(type: string, props: PointerEventInit) {
            super(type, props);
            this.button = props.button || 0;
            this.ctrlKey = props.ctrlKey || false;
            this.pointerType = props.pointerType || 'mouse';
        }
    }
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
}

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: null }),
                    order: () => ({
                        limit: () => Promise.resolve({ data: [], error: null })
                    })
                }),
                gte: () => ({
                    lt: () => ({
                        order: () => Promise.resolve({ data: [], error: null })
                    })
                }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: null })
                })
            }),
        }),
        channel: () => {
            const channelObj = {
                on: () => channelObj,
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            };
            return channelObj;
        }
    }),
}));

// Mock Supabase server client (Next.js request-scope APIs are unavailable in tests)
vi.mock('@/utils/supabase/server', () => ({
    createClient: async () => ({
        auth: {
            getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: { couple_id: 'test-couple' }, error: null }),
                    order: () => ({
                        limit: () => Promise.resolve({ data: [], error: null })
                    })
                }),
                gte: () => ({
                    lt: () => ({
                        order: () => Promise.resolve({ data: [], error: null })
                    })
                }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: null })
                })
            }),
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: {}, error: null }),
                }),
            }),
            upsert: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: {}, error: null }),
                }),
            }),
            update: () => ({
                eq: () => ({
                    eq: () => ({
                        select: () => ({
                            single: () => Promise.resolve({ data: {}, error: null }),
                        }),
                    }),
                }),
            }),
            delete: () => ({
                eq: () => ({
                    eq: () => Promise.resolve({ error: null }),
                }),
            }),
        }),
        rpc: async () => ({ data: 0, error: null }),
        channel: () => {
            const channelObj = {
                on: () => channelObj,
                subscribe: vi.fn(),
                unsubscribe: vi.fn()
            };
            return channelObj;
        }
    }),
}));

// Mock framer-motion components
vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal<typeof import('framer-motion')>();
    return {
        ...actual,
        motion: {
            div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
            button: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <button {...props}>{children}</button>,
            span: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <span {...props}>{children}</span>,
            section: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <section {...props}>{children}</section>,
            nav: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <nav {...props}>{children}</nav>,
            article: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <article {...props}>{children}</article>,
            main: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <main {...props}>{children}</main>,
            header: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <header {...props}>{children}</header>,
            p: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <p {...props}>{children}</p>,
        },
        AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
        useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
        useSpring: (v: unknown) => v,
        useTransform: (
            v: unknown,
            f: ((value: unknown) => unknown) | unknown,
            o?: unknown
        ) => {
            if (typeof f === 'function') return f(v);
            if (Array.isArray(o)) return o[0];
            return v;
        },
        useMotionValue: (v: unknown) => ({ get: () => v, set: vi.fn() }),
    };
});

// Mock AnimatedCounter to render value directly
vi.mock('@/components/AnimatedCounter', () => ({
    AnimatedCounter: ({ value }: { value: number }) => <span>{Math.round(value).toLocaleString()} </span>
}));
