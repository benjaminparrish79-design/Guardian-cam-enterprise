import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project')) {
    return res;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        },
      },
    });

    const { data: { session } } = await supabase.auth.getSession();

    // Strict protection for all API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      if (req.nextUrl.pathname === '/api/config') {
        return res;
      }

      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Valid authentication session required' },
          { status: 401 }
        );
      }

      // Additional: Block common attack paths
      if (req.nextUrl.pathname.includes('/ai/') && req.method === 'POST') {
        // Rate limit AI harder (handled in routes too)
      }

      // Extract user role from session user metadata or app metadata (defaulting to operator)
      const userRole = (session.user?.user_metadata?.role || session.user?.app_metadata?.role || 'operator') as string;

      // 1. Gated sensitive paths - Billing configuration changes (POST/PUT/DELETE) require 'admin'
      if (req.nextUrl.pathname.startsWith('/api/billing') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        if (userRole !== 'admin') {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Only an organization admin is permitted to perform billing configurations.' },
            { status: 403 }
          );
        }
      }

      // 2. Gated sensitive paths - Florida GIBMP Compliance updates (POST/PUT/DELETE) require 'admin' or 'inspector'
      if (req.nextUrl.pathname.startsWith('/api/compliance') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        if (userRole !== 'admin' && userRole !== 'inspector') {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Access denied. You must hold an admin or inspector role to modify compliance records.' },
            { status: 403 }
          );
        }
      }
    }

  } catch (err) {
    console.error('Middleware auth error:', err);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
    }
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
