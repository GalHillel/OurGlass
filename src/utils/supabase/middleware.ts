import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        )
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                        console.error('Middleware cookie set error', error)
                    }
                },
            },
        }
    )

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        // If no user and trying to access protected routes, redirect to login
        if (!user && request.nextUrl.pathname !== '/login') {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // If user exists and trying to access login, redirect to dashboard
        if (user && request.nextUrl.pathname === '/login') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    } catch (err) {
        console.error("Middleware Supabase Auth Error:", err);
        // Fallback: If Supabase fails, do not infinitely redirect. Let the request pass
        // through so the client-side app can render an error state or offline mode.
    }

    return supabaseResponse
}
