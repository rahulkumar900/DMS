import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUserProfile() {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return profile ? { ...profile, email: user.email } : null
  } catch (error) {
    console.error('getUserProfile: Supabase fetch failed:', error)
    return null
  }
}

export async function requireRole(allowedRoles: string[]) {
  const profile = await getUserProfile()
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/login')
  }
  
  return profile
}
