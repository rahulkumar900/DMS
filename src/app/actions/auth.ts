'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      if (profile?.role === 'ADMIN') {
        redirect('/admin')
      } else if (profile?.role === 'SITE_TEAM') {
        redirect('/team/upload')
      } else if (profile?.role === 'CHECKER') {
        redirect('/checker')
      } else if (profile?.role === 'ACCOUNTS') {
        redirect('/accounts')
      }
    }

    // Fallback
    redirect('/')
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error; // Next.js redirect
    console.error('Login action failed:', error)
    return { error: 'Authentication service unavailable. Please check your connection or API keys.' }
  }
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout action failed:', error)
  }
  redirect('/login')
}
