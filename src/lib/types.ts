export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'

export interface Vendor {
  id: string
  name: string
  pan_gst?: string
}

export interface Site {
  id: string
  name: string
}

export interface Profile {
  id: string
  full_name: string
  role: string
}

export interface Document {
  id: string
  vendor_id: string
  site_id: string
  uploaded_by: string
  amount: number
  status: DocumentStatus
  invoice_number?: string
  unique_code?: string
  document_date: string
  file_url: string
  remarks?: string | null
  state?: string
  created_at: string
  updated_at: string
  
  // Joined fields
  sites?: Site
  vendors?: Vendor
  profiles?: Profile
}
