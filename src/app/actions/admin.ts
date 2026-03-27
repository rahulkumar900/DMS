'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Define interfaces
export interface Profile {
  id: string
  full_name: string
  role: string
  created_at: string
}

export interface Site {
  id: string
  name: string
  location: string | null
  is_active: boolean
}

export interface UserSite {
  user_id: string
  site_id: string
  sites?: Site
}

export async function getUsers() {
  await requireRole(['ADMIN'])
  const supabase = await createClient()

  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  // Fetch all assignments concurrently for all users
  const { data: assignments } = await supabase
    .from('user_sites')
    .select('user_id, site_id, sites(name, is_active)')

  // Map assignments to profiles
  const usersWithSites = profiles.map(profile => ({
    ...profile,
    assigned_sites: assignments
      ?.filter(a => a.user_id === profile.id)
      ?.map(a => ({
        site_id: a.site_id,
        // @ts-ignore - Supabase join typing is complex
        name: a.sites?.name,
        // @ts-ignore
        is_active: a.sites?.is_active
      }))
  }))

  return usersWithSites
}

export async function getSites() {
  await requireRole(['ADMIN'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching sites:', error)
    return []
  }

  return data
}

export async function updateUserRole(userId: string, targetRole: string) {
  await requireRole(['ADMIN'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role: targetRole })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function assignSite(userId: string, siteId: string) {
  await requireRole(['ADMIN'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_sites')
    .insert({ user_id: userId, site_id: siteId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function removeSiteAssignment(userId: string, siteId: string) {
  await requireRole(['ADMIN'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_sites')
    .delete()
    .match({ user_id: userId, site_id: siteId })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function createSite(state: any, formData: FormData) {
  await requireRole(['ADMIN'])
  const supabase = await createClient()

  const name = formData.get('name') as string
  const location = formData.get('location') as string

  if (!name) return { error: 'Site name is required' }

  const { error } = await supabase
    .from('sites')
    .insert({ name, location })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function toggleSiteActivity(siteId: string, isActive: boolean) {
  await requireRole(['ADMIN'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('sites')
    .update({ is_active: !isActive })
    .eq('id', siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
