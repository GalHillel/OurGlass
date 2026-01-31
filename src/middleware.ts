import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// DEMO MODE: Middleware neutralized - allow all requests without authentication
export async function middleware(req: NextRequest) {
    // Simply pass through all requests without checking for session
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
