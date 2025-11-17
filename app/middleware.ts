import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Configurar cookies com opções de persistência
            response.cookies.set(name, value, {
              ...options,
              // Garantir que os cookies de autenticação sejam persistentes
              maxAge: options?.maxAge || (name.includes('auth') ? 60 * 60 * 24 * 7 : undefined), // 7 dias para cookies de auth
              sameSite: options?.sameSite || 'lax',
              path: options?.path || '/',
              httpOnly: options?.httpOnly || false,
            })
          })
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
}
