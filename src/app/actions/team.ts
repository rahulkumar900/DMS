'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { extractBillDataFromBuffer } from '@/lib/gemini'

// Get all sites assigned to the current SITE_TEAM user
export async function getMyAssignedSites() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_sites')
    .select('site_id, sites(id, name, is_active)')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching assigned sites:', error)
    return []
  }

  return data
    // @ts-ignore
    .flatMap(us => Array.isArray(us.sites) ? us.sites : (us.sites ? [us.sites] : []))
    // @ts-ignore
    .filter(site => site && site.is_active)
}

// Get all documents uploaded by the current user (for status tracker)
export async function getMyDocuments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('documents')
    .select('*, sites(name), vendors(name, pan_gst)')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data
}

// Upload a new document
export async function uploadDocument(state: any, formData: FormData) {
  const profile = await requireRole(['SITE_TEAM', 'ADMIN'])
  const supabase = await createClient()

  const siteId = formData.get('site_id') as string
  const vendorName = formData.get('vendor') as string
  const documentDate = formData.get('document_date') as string
  const amount = formData.get('amount') as string
  const invoiceNumber = formData.get('invoice_number') as string
  const uniqueCode = formData.get('unique_code') as string
  const gstPan = formData.get('gst_pan') as string
  const stateVal = formData.get('state') as string
  const file = formData.get('file') as File

  if (!siteId || !vendorName || !amount || !file || file.size === 0) {
    return { error: 'Site, Vendor, Amount and File are required.' }
  }

  // 1. Get or Create Vendor
  let vendorId = null
  const { data: existingVendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('name', vendorName)
    .single()

  if (existingVendor) {
    vendorId = existingVendor.id
  } else {
    const { data: newVendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({ name: vendorName, pan_gst: gstPan, state: stateVal })
      .select('id')
      .single()
    if (!vendorError) vendorId = newVendor.id
  }

  // 2. Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${profile.id}/${Date.now()}.${fileExt}`
  const { data: storageData, error: storageError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    return { error: `File upload failed: ${storageError.message}` }
  }

  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(storageData.path)

  // 4. Insert document record
  const { error: dbError } = await supabase
    .from('documents')
    .insert({
      site_id: siteId,
      uploaded_by: profile.id,
      vendor_id: vendorId,
      amount: parseFloat(amount),
      document_date: documentDate || new Date().toISOString().split('T')[0],
      invoice_number: invoiceNumber,
      unique_code: uniqueCode,
      state: stateVal,
      file_url: publicUrl,
      status: 'PENDING',
    })

  if (dbError) {
    return { error: `Database error: ${dbError.message}` }
  }

  revalidatePath('/team/upload')
  return { success: true }
}

// Upload file ONLY (for AI Mode)
export async function uploadFileToStorage(formData: FormData) {
  const profile = await requireRole(['SITE_TEAM', 'ADMIN'])
  const supabase = await createClient()

  const file = formData.get('file') as FormDataEntryValue | null
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'File is required.' }
  }

  // 1. Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${profile.id}/${Date.now()}.${fileExt}`
  const { data: storageData, error: storageError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    return { error: `File upload failed: ${storageError.message}` }
  }

  // 2. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(storageData.path)

  return { success: true, url: publicUrl }
}

// AI Mode: Extract data from file
export async function extractDocumentData(formData: FormData) {
  await requireRole(['SITE_TEAM', 'ADMIN'])
  
  const file = formData.get('file') as FormDataEntryValue | null
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'File is required.' }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const extractedData = await extractBillDataFromBuffer(buffer, file.type)
    return { success: true, data: extractedData }
  } catch (error: any) {
    console.error('Extraction error:', error)
    return { error: error.message || 'Failed to extract data from document.' }
  }
}

// AI Mode: Bulk upload extracted documents
export async function bulkUploadDocuments(data: {
  rows: any[],
  fileUrl: string,
  siteId: string
}) {
  const profile = await requireRole(['SITE_TEAM', 'ADMIN'])
  const supabase = await createClient()

  const { rows, fileUrl, siteId } = data
  
  if (!rows || rows.length === 0 || !fileUrl || !siteId) {
    return { error: 'Missing required data for bulk upload.' }
  }

  const results = []
  const errors = []

  for (const row of rows) {
    try {
      // 1. Get or Create Vendor
      let vendorId = null
      if (row.vendor_name) {
        const { data: existingVendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('name', row.vendor_name)
          .single()

        if (existingVendor) {
          vendorId = existingVendor.id
        } else {
          const { data: newVendor, error: vendorError } = await supabase
            .from('vendors')
            .insert({ name: row.vendor_name, state: row.state })
            .select('id')
            .single()
          if (!vendorError) vendorId = newVendor.id
        }
      }

      // 2. Insert document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          site_id: siteId,
          uploaded_by: profile.id,
          vendor_id: vendorId,
          amount: parseFloat(row.amount) || 0,
          document_date: row.document_date || new Date().toISOString().split('T')[0],
          invoice_number: row.invoice_number,
          unique_code: row.unique_code,
          state: row.state,
          file_url: fileUrl,
          status: 'PENDING',
        })

      if (dbError) {
        errors.push(`Row ${row.invoice_number || 'unknown'}: ${dbError.message}`)
      } else {
        results.push(row)
      }
    } catch (err: any) {
      errors.push(`Row ${row.invoice_number || 'unknown'}: ${err.message}`)
    }
  }

  revalidatePath('/team/upload')
  revalidatePath('/team/history')
  
  if (errors.length > 0 && results.length === 0) {
    return { error: `All uploads failed: ${errors.join(', ')}` }
  }

  return { 
    success: true, 
    count: results.length, 
    errors: errors.length > 0 ? errors : undefined 
  }
}


// Get team documents with search, site filter, status and pagination
export async function getTeamDocuments({
  search,
  siteId,
  status,
  page = 1,
  pageSize = 10
}: {
  search?: string,
  siteId?: string,
  status?: string,
  page?: number,
  pageSize?: number
} = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { documents: [], totalCount: 0, totalPages: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('documents')
    .select('*, sites(name), vendors(name), profiles(full_name)', { count: 'exact' })
    .eq('uploaded_by', user.id)

  if (search) {
    // Search is now more complex with joins if using Supabase client directly
    // Ideally we filter by vendor name from the joined table
    // For now, let's use vendor_id if we have it, or search vendor table separately
    // Or use a more advanced query
    query = query.or(`unique_code.ilike.%${search}%,invoice_number.ilike.%${search}%`)
  }

  if (siteId && siteId !== 'all') {
    query = query.eq('site_id', siteId)
  }

  if (status && status !== 'ALL') {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching filtered documents:', error)
    return { documents: [], totalCount: 0, totalPages: 0 }
  }

  return {
    documents: data,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// Deprecated: use getTeamDocuments instead
export async function getFilteredDocuments(search?: string, siteId?: string) {
  const { documents } = await getTeamDocuments({ search, siteId })
  return documents
}

// Delete a pending document
export async function deleteDocument(id: string) {
  const profile = await requireRole(['SITE_TEAM'])
  const supabase = await createClient()

  // First verify the document belongs to user and is PENDING
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('id, file_url')
    .eq('id', id)
    .eq('uploaded_by', profile.id)
    .eq('status', 'PENDING')
    .single()

  if (fetchError || !doc) {
    return { error: 'Document not found or cannot be deleted.' }
  }

  // Delete the file from storage
  const urlParts = doc.file_url.split('/documents/')
  if (urlParts.length === 2) {
    const filePath = urlParts[1]
    await supabase.storage.from('documents').remove([filePath])
  }

  // Delete from DB
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return { error: 'Failed to delete document.' }
  }

  revalidatePath('/team', 'layout')
  return { success: true }
}

// Update a pending document
export async function updateDocument(id: string, updates: {
  vendor_id?: string,
  amount?: number,
  invoice_number?: string,
  unique_code?: string,
  document_date?: string,
  site_id?: string,
  state?: string,
  status?: string,
  file_url?: string
}) {
  try {
    const profile = await requireRole(['SITE_TEAM', 'ADMIN', 'ACCOUNTS'])
    const supabase = await createClient()

    if (updates.amount !== undefined) {
      const amount = parseFloat(updates.amount as any)
      updates.amount = isNaN(amount) ? 0 : amount
    }

    // Handle file changes for cleanup
    if (updates.file_url) {
        // ... (cleanup logic if needed, but for multi-file we might not want to auto-delete)
    }

    const { error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Update error:', error)
      return { error: `Database error: ${error.message}` }
    }

    revalidatePath('/team', 'layout')
    revalidatePath('/checker', 'layout')
    revalidatePath('/accounts', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('Action error:', err)
    return { error: err.message || 'An unexpected error occurred' }
  }
}

// Get dashboard summary stats for the current user
export async function getDashboardStats(siteId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, pending: 0, approved: 0, rejected: 0 }

  let query = supabase
    .from('documents')
    .select('status')
    .eq('uploaded_by', user.id)

  if (siteId && siteId !== 'all') {
    query = query.eq('site_id', siteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching dashboard stats:', error)
    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }

  return {
    total: data.length,
    pending: data.filter(d => d.status === 'PENDING').length,
    approved: data.filter(d => d.status === 'APPROVED').length,
    rejected: data.filter(d => d.status === 'REJECTED').length,
  }
}

// Get a single document by ID with site info
export async function getDocumentById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('documents')
    .select('*, sites(id, name), vendors(id, name, pan_gst)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching document details:', error)
    return null
  }

  return data
}

// Search vendors by name
export async function searchVendors(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, pan_gst')
    .ilike('name', `%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error searching vendors:', error)
    return []
  }

  return data
}

// Create a new vendor with uniqueness checks
export async function createVendor(data: { name: string, pan_gst?: string, state?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Check for name uniqueness (case-insensitive)
  const { data: nameCheck } = await supabase
    .from('vendors')
    .select('id')
    .ilike('name', data.name)
    .maybeSingle()
  
  if (nameCheck) return { error: 'A vendor with this name already exists' }
  
  // 2. Check for PAN/GST uniqueness if provided
  if (data.pan_gst) {
    const { data: gstCheck } = await supabase
      .from('vendors')
      .select('id')
      .eq('pan_gst', data.pan_gst)
      .maybeSingle()
    
    if (gstCheck) return { error: 'A vendor with this PAN/GST already exists' }
  }
  
  // 3. Insert new vendor
  const { data: newVendor, error } = await supabase
    .from('vendors')
    .insert([data])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating vendor:', error)
    return { error: `Failed to create vendor: ${error.message}` }
  }
  
  revalidatePath('/team/upload')
  return { success: true, vendor: newVendor }
}

