import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const pathname = request.nextUrl.pathname
    const isApiRoute = pathname.startsWith('/api')
    const isLoginRoute = pathname === '/login'
    const isPwaManifestRoute = pathname === '/manifest.webmanifest' || pathname === '/manifest.json' || pathname.startsWith('/icon') || pathname.startsWith('/apple-icon');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables in middleware')
        return supabaseResponse
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
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

    // Try to get user, but don't let a fetch failure block the entire request flow
    let user = null
    try {
        const {
            data: { user: authUser },
            error: userError
        } = await supabase.auth.getUser()

        if (userError) {
            // Treat missing session as a normal state in dev
            if (userError.message === 'Auth session missing!') {
                if (!isApiRoute && !isLoginRoute && !isPwaManifestRoute) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/login'
                    return NextResponse.redirect(url)
                }
                return supabaseResponse
            }
            console.error("Middleware Auth User Error:", userError.message)
        }
        user = authUser
    } catch (e) {
        console.error("Middleware Auth Execution Error (likely fetch failed):", e)
        if (!isApiRoute && !isLoginRoute && !isPwaManifestRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // If no user and trying to access protected routes, redirect to login
    if (!user && !isApiRoute && !isLoginRoute && !isPwaManifestRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user exists and trying to access login, redirect to dashboard
    if (user && isLoginRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }
    return supabaseResponse
}
