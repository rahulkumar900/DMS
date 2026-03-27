'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Get all APPROVED documents that are NOT archived with pagination
export async function getApprovedDocuments({
  siteId,
  search,
  page = 1,
  pageSize = 10
}: {
  siteId?: string,
  search?: string,
  page?: number,
  pageSize?: number
} = {}) {
  const supabase = await createClient()
  await requireRole(['ACCOUNTS', 'ADMIN'])

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('documents')
    .select('*, sites(name), profiles(full_name)', { count: 'exact' })
    .eq('status', 'APPROVED')
    .eq('is_archived', false)

  if (siteId && siteId !== 'all') {
    query = query.eq('site_id', siteId)
  }

  if (search) {
    // 1. Search for matching vendors and sites to get their IDs
    const [vendorMatch, siteMatch] = await Promise.all([
      supabase.from('vendors').select('id').ilike('name', `%${search}%`),
      supabase.from('sites').select('id').ilike('name', `%${search}%`)
    ])

    const matchedVendorIds = vendorMatch.data?.map((v: any) => v.id) || []
    const matchedSiteIds = siteMatch.data?.map((s: any) => s.id) || []

    // 2. Build OR conditions
    const orConditions = [
      `unique_code.ilike.%${search}%`,
      `invoice_number.ilike.%${search}%`,
      `document_date.ilike.%${search}%`
    ]

    if (matchedVendorIds.length > 0) {
      orConditions.push(`vendor_id.in.(${matchedVendorIds.join(',')})`)
    }
    if (matchedSiteIds.length > 0) {
      orConditions.push(`site_id.in.(${matchedSiteIds.join(',')})`)
    }

    // Amount search (exact match if numeric)
    const numericSearch = parseFloat(search)
    if (!isNaN(numericSearch)) {
      orConditions.push(`amount.eq.${numericSearch}`)
    }

    query = query.or(orConditions.join(','))
  }

  const { data, count, error } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching approved docs:', error)
    return { documents: [], totalCount: 0, totalPages: 0 }
  }

  return {
    documents: data,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// Get all active sites for the filter (Admin/Accounts)
export async function getAllActiveSites() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sites')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
  return data ?? []
}

// Mark a document as COMPLETED (Archived)
export async function archiveDocument(documentId: string) {
  await requireRole(['ACCOUNTS', 'ADMIN'])
  const supabase = await createClient()

  const { error } = await supabase
    .from('documents')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', documentId)

  if (error) return { error: error.message }

  revalidatePath('/accounts')
  return { success: true }
}

// Get ALL documents for Master Excel Export
export async function getMasterExportData() {
  const supabase = await createClient()
  await requireRole(['ACCOUNTS', 'ADMIN'])

  const { data, error } = await supabase
    .from('documents')
    .select('*, sites(name), profiles(full_name)')
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

// Get dashboard summary stats for accounts/admin
export async function getDashboardStats(siteId?: string) {
  const supabase = await createClient()
  await requireRole(['ACCOUNTS', 'ADMIN'])

  let query = supabase
    .from('documents')
    .select('status')
    .eq('is_archived', false)

  if (siteId && siteId !== 'all') {
    query = query.eq('site_id', siteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching accounts stats:', error)
    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }

  return {
    total: data.length,
    pending: data.filter(d => d.status === 'PENDING').length,
    approved: data.filter(d => d.status === 'APPROVED').length,
    rejected: data.filter(d => d.status === 'REJECTED').length,
  }
}
