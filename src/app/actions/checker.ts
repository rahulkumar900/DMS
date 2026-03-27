'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Get documents for the checker's assigned sites with status and search filters
export async function getCheckerDocuments({
  siteId,
  status = 'PENDING',
  search,
  page = 1,
  pageSize = 10
}: {
  siteId?: string,
  status?: string,
  search?: string,
  page?: number,
  pageSize?: number
} = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { documents: [], totalCount: 0, totalPages: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Get the checker's assigned site IDs
  const { data: assignments } = await supabase
    .from('user_sites')
    .select('site_id')
    .eq('user_id', user.id)

  const siteIds = assignments?.map(a => a.site_id) ?? []
  if (siteIds.length === 0) return { documents: [], totalCount: 0, totalPages: 0 }
  
  // If a specific site is requested, verify the checker is assigned to it
  const filterIds = siteId && siteId !== 'all' && siteIds.includes(siteId) ? [siteId] : siteIds

  let query = supabase
    .from('documents')
    .select('*, sites(name), vendors(id, name, pan_gst), profiles(full_name)', { count: 'exact' })
    .in('site_id', filterIds)

  if (status !== 'ALL') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`unique_code.ilike.%${search}%,invoice_number.ilike.%${search}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: status === 'PENDING' })
    .range(from, to)

  if (error) {
    console.error('Error fetching checker docs:', error)
    return { documents: [], totalCount: 0, totalPages: 0 }
  }

  return {
    documents: data,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// Deprecated: use getCheckerDocuments instead
export async function getPendingDocuments(params: any) {
  return getCheckerDocuments({ ...params, status: 'PENDING' })
}

// Get all documents (any status) for the checker's assigned sites (for Excel export)
export async function getAllDocumentsForSites() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: assignments } = await supabase
    .from('user_sites')
    .select('site_id')
    .eq('user_id', user.id)

  const siteIds = assignments?.map(a => a.site_id) ?? []
  if (siteIds.length === 0) return []

  const { data, error } = await supabase
    .from('documents')
    .select('*, sites(name), profiles(full_name)')
    .in('site_id', siteIds)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

// Approve a document
export async function approveDocument(documentId: string) {
  await requireRole(['CHECKER'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('documents')
    .update({ status: 'APPROVED', remarks: null, updated_at: new Date().toISOString() })
    .eq('id', documentId)

  if (error) return { error: error.message }

  revalidatePath('/checker')
  return { success: true }
}

// Reject / query a document with remarks
export async function rejectDocument(documentId: string, remarks: string) {
  await requireRole(['CHECKER'])
  const supabase = await createClient()

  if (!remarks?.trim()) {
    return { error: 'A remark is required when querying a document.' }
  }

  const { error } = await supabase
    .from('documents')
    .update({ status: 'REJECTED', remarks: remarks.trim(), updated_at: new Date().toISOString() })
    .eq('id', documentId)

  if (error) return { error: error.message }

  revalidatePath('/checker')
  return { success: true }
}

// Get dashboard summary stats for checker's assigned sites
export async function getDashboardStats(siteFilterId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, pending: 0, approved: 0, rejected: 0 }

  // Get assigned site IDs
  const { data: assignments } = await supabase
    .from('user_sites')
    .select('site_id')
    .eq('user_id', user.id)

  const siteIds = assignments?.map(a => a.site_id) ?? []
  if (siteIds.length === 0) return { total: 0, pending: 0, approved: 0, rejected: 0 }

  const filterIds = siteFilterId && siteIds.includes(siteFilterId) ? [siteFilterId] : siteIds

  const { data, error } = await supabase
    .from('documents')
    .select('status')
    .in('site_id', filterIds)

  if (error) {
    console.error('Error fetching checker stats:', error)
    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }

  return {
    total: data.length,
    pending: data.filter(d => d.status === 'PENDING').length,
    approved: data.filter(d => d.status === 'APPROVED').length,
    rejected: data.filter(d => d.status === 'REJECTED').length,
  }
}

