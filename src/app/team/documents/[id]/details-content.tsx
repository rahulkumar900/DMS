"use client"

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Save, X, Trash2, Loader2, AlertCircle, FileText, Hash, Building2, MapPin } from 'lucide-react'
import { updateDocument, deleteDocument } from '@/app/actions/team'
import { cn } from '@/lib/utils'

interface Site {
  id: string
  name: string
}

interface Document {
  id: string
  vendor_id?: string
  amount: number
  status: string
  site_id: string
  remarks: string | null
  invoice_number?: string
  unique_code?: string
  state?: string
  sites?: { id: string, name: string }
  vendors?: { id: string, name: string, pan_gst?: string }
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
]

export function DocumentDetailsContent({ doc, sites }: { doc: Document, sites: Site[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [vendorName, setVendorName] = useState(doc.vendors?.name || '')
  const [vendorId, setVendorId] = useState(doc.vendor_id || '')
  const [amount, setAmount] = useState(doc.amount.toString())
  const [siteId, setSiteId] = useState(doc.site_id)
  const [invoiceNumber, setInvoiceNumber] = useState(doc.invoice_number || '')
  const [uniqueCode, setUniqueCode] = useState(doc.unique_code || '')
  const [gstPan, setGstPan] = useState(doc.vendors?.pan_gst || '')
  const [docState, setDocState] = useState(doc.state || '')

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateDocument(doc.id, { 
        vendor_id: vendorId, 
        amount: parseFloat(amount),
        invoice_number: invoiceNumber,
        unique_code: uniqueCode,
        site_id: siteId,
        state: docState
      })
      if (res.success) {
        setIsEditing(false)
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this bill?')) return
    startTransition(async () => {
      const res = await deleteDocument(doc.id)
      if (res.success) {
        const site = searchParams.get('site')
        const backUrl = doc.status === 'PENDING' ? '/team/pending' : 
                        doc.status === 'REJECTED' ? '/team/rejected' : '/team/history'
        router.push(`${backUrl}${site ? `?site=${site}` : ""}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bill Details</h2>
        <div className="flex gap-2">
          {doc.status === 'PENDING' && (
            <>
              {isEditing ? (
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Vendor & Amount Section */}
        <div className="space-y-4 rounded-lg bg-muted/30 p-4 border border-border/50">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Vendor Name
                </Label>
                <Input 
                  id="vendor"
                  value={vendorName} 
                  onChange={(e) => setVendorName(e.target.value)} 
                  disabled={!isEditing || isPending}
                  className={cn(!isEditing && "bg-transparent border-none p-0 h-auto shadow-none text-base font-semibold")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <span>₹</span> Bill Amount
                </Label>
                <Input 
                  id="amount"
                  type="number"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  disabled={!isEditing || isPending}
                  className={cn(!isEditing && "bg-transparent border-none p-0 h-auto shadow-none text-base font-semibold")}
                />
              </div>
           </div>
        </div>

        {/* Technical Codes Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unique_code" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> Unique Code
            </Label>
            <Input 
              id="unique_code"
              value={uniqueCode} 
              onChange={(e) => setUniqueCode(e.target.value)} 
              disabled={!isEditing || isPending}
              placeholder="Not specified"
              className={cn(!isEditing && "bg-transparent border-none p-0 h-auto shadow-none text-sm font-medium")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice_number" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Invoice No.
            </Label>
            <Input 
              id="invoice_number"
              value={invoiceNumber} 
              onChange={(e) => setInvoiceNumber(e.target.value)} 
              disabled={!isEditing || isPending}
              placeholder="Not specified"
              className={cn(!isEditing && "bg-transparent border-none p-0 h-auto shadow-none text-sm font-medium")}
            />
          </div>
        </div>

        {/* GST & State Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gst_pan" className="text-xs uppercase tracking-wider text-muted-foreground">GST / PAN</Label>
            <Input 
              id="gst_pan"
              value={gstPan} 
              onChange={(e) => setGstPan(e.target.value)} 
              disabled={!isEditing || isPending}
              placeholder="Not specified"
              className={cn(!isEditing && "bg-transparent border-none p-0 h-auto shadow-none text-sm font-medium")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> State
            </Label>
            {isEditing ? (
              <Select value={docState} onValueChange={setDocState} disabled={isPending}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm font-medium h-8 flex items-center">{docState || 'Not specified'}</div>
            )}
          </div>
        </div>

        {/* Site Selection */}
        <div className="space-y-2 border-t pt-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Project Site</Label>
          {isEditing ? (
             <Select value={siteId} onValueChange={setSiteId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
             </Select>
          ) : (
            <div className="text-base font-medium py-1">{doc.sites?.name || 'Unknown Site'}</div>
          )}
        </div>

        {doc.remarks && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 mt-2">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Checker Remarks</span>
            </div>
            <p className="text-sm text-amber-400 italic">"{doc.remarks}"</p>
          </div>
        )}
      </div>

      {isEditing && (
        <Button className="w-full" onClick={handleUpdate} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      )}

      {doc.status === 'PENDING' && !isEditing && (
        <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Delete Bill
        </Button>
      )}
    </div>
  )
}
