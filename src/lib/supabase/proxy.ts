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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, and tries to visit login, redirect to role-specific dashboard
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    // Fetch profile ONLY when needed for redirection
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const url = request.nextUrl.clone()
      
      // Determine redirect path based on role
      if (profile.role === 'ADMIN') {
        url.pathname = '/admin'
      } else if (profile.role === 'SITE_TEAM') {
        url.pathname = '/team/upload'
      } else if (profile.role === 'CHECKER') {
        url.pathname = '/checker'
      } else if (profile.role === 'ACCOUNTS') {
        url.pathname = '/accounts'
      } else {
        url.pathname = '/'
      }
      
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
