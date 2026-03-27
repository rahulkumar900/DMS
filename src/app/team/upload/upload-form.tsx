'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadDocument, extractDocumentData, uploadFileToStorage, bulkUploadDocuments } from '@/app/actions/team'
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Trash2, Edit2, Save, X } from 'lucide-react'
import { VendorAutocomplete } from '@/components/vendor-autocomplete'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Site {
  id: string
  name: string
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

export function UploadDocumentForm({ sites }: { sites: Site[] }) {
  const [state, formAction, pending] = useActionState(uploadDocument, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const [fileName, setFileName] = useState<string>('')
  const [vendorName, setVendorName] = useState('')
  const [gstPan, setGstPan] = useState('')
  
  // AI Mode States
  const [isAiMode, setIsAiMode] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedRows, setExtractedRows] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')

  // Reset form on success
  useEffect(() => {
    if (state?.success) {
      toast.success('Bill uploaded successfully!')
      if (formRef.current) {
        formRef.current.reset()
        setFileName('')
        setVendorName('')
        setGstPan('')
        setSelectedFile(null)
      }
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state?.success, state?.error])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setSelectedFile(file)

    if (isAiMode) {
      setIsExtracting(true)
      const formData = new FormData()
      formData.append('file', file)

      try {
        const result = await extractDocumentData(formData)
        if (result.success && result.data) {
          setExtractedRows(result.data)
          toast.success(`Extracted ${result.data.length} records!`)
        } else {
          toast.error(result.error || 'Failed to extract data')
        }
      } catch (err) {
        toast.error('An error occurred during extraction')
      } finally {
        setIsExtracting(false)
      }
    }
  }

  const handleRemoveRow = (index: number) => {
    setExtractedRows(rows => rows.filter((_, i) => i !== index))
  }

  const handleUpdateRow = (index: number, updates: any) => {
    setExtractedRows(rows => rows.map((row, i) => i === index ? { ...row, ...updates } : row))
    setEditingIndex(null)
  }

  const handleBulkUpload = async () => {
    if (!selectedFile || extractedRows.length === 0 || !selectedSiteId) {
      toast.error('Please select a site and ensure data is extracted.')
      return
    }

    setIsSubmittingBulk(true)
    try {
      // 1. Upload file once
      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadRes = await uploadFileToStorage(formData)
      
      if (!uploadRes.success || !uploadRes.url) {
        toast.error(uploadRes.error || 'Failed to upload document file')
        return
      }

      // 2. Submit all rows
      const bulkRes = await bulkUploadDocuments({
        rows: extractedRows,
        fileUrl: uploadRes.url,
        siteId: selectedSiteId
      })

      if (bulkRes.success) {
        toast.success(`Successfully uploaded ${bulkRes.count} documents!`)
        setExtractedRows([])
        setFileName('')
        setSelectedFile(null)
        if (formRef.current) formRef.current.reset()
      } else {
        toast.error(bulkRes.error || 'Bulk upload failed')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmittingBulk(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Upload New Bill</h2>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details or use AI Mode for auto-extraction.</p>
        </div>
        <div className="flex items-center space-x-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label htmlFor="ai-mode" className="text-sm font-medium cursor-pointer">AI Mode</Label>
          <Switch 
            id="ai-mode" 
            checked={isAiMode} 
            onCheckedChange={setIsAiMode}
            disabled={pending || isExtracting || isSubmittingBulk}
          />
        </div>
      </div>

      {!isAiMode ? (
        <form ref={formRef} action={formAction} className="space-y-5" suppressHydrationWarning>
          <div className="grid gap-5 md:grid-cols-2">
            {/* Site Selection */}
            <div className="space-y-2">
              <Label htmlFor="site_id">Project Site</Label>
              <select
                id="site_id"
                name="site_id"
                required
                disabled={pending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Select a site --</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Date */}
            <div className="space-y-2">
              <Label htmlFor="document_date">Document Date</Label>
              <Input
                id="document_date"
                name="document_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Vendor */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor / Supplier Name</Label>
              <VendorAutocomplete 
                onSelect={(id, name, pan) => {
                  setVendorName(name)
                  if (pan) setGstPan(pan)
                }} 
                disabled={pending} 
              />
              <input type="hidden" name="vendor" value={vendorName} />
              <input type="hidden" name="gst_pan" value={gstPan} />
            </div>

            {/* Unique Code */}
            <div className="space-y-2">
              <Label htmlFor="unique_code">Unique Code / Bill No.</Label>
              <Input
                id="unique_code"
                name="unique_code"
                placeholder="e.g. UC-789"
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                placeholder="e.g. INV-2024-001"
                disabled={pending}
              />
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                name="state"
                disabled={pending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Select State --</option>
                {INDIAN_STATES.map((stateName) => (
                  <option key={stateName} value={stateName}>
                    {stateName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Bill Amount (₹)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 12500.00"
              required
              disabled={pending}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Bill Attachment (PDF or Image)</Label>
            <label
              htmlFor="file"
              className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background transition-colors hover:border-primary hover:bg-primary/5"
            >
              <FileText className="mb-2 h-6 w-6 text-muted-foreground" />
              {fileName ? (
                <span className="text-sm font-medium text-primary truncate max-w-[90%]">{fileName}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Click to browse or drag & drop</span>
              )}
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                required
                disabled={pending}
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <Button type="submit" disabled={pending || sites.length === 0} className="w-full">
            {pending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Submit Bill for Review</>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* AI Mode UI */}
          <div className="space-y-4">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bulk_site_id">Project Site</Label>
                <select
                  id="bulk_site_id"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmittingBulk || isExtracting}
                >
                  <option value="">-- Select a site --</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Document File</Label>
                <label
                  htmlFor="ai_file"
                  className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-primary/5"
                >
                  <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{fileName || "Select PDF or Image"}</span>
                  <input
                    id="ai_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={isExtracting || isSubmittingBulk}
                  />
                </label>
              </div>
            </div>

            {isExtracting && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Gemini AI is extracting data...</p>
              </div>
            )}

            {!isExtracting && extractedRows.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedRows.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.vendor_name}</TableCell>
                          <TableCell>{row.document_date}</TableCell>
                          <TableCell>{row.invoice_number}</TableCell>
                          <TableCell>₹{row.amount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveRow(index)}
                              disabled={isSubmittingBulk}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button 
                  onClick={handleBulkUpload} 
                  disabled={isSubmittingBulk || !selectedSiteId} 
                  className="w-full"
                >
                  {isSubmittingBulk ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading {extractedRows.length} documents...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Bulk Submit {extractedRows.length} Documents</>
                  )}
                </Button>
              </div>
            )}

            {!isExtracting && extractedRows.length === 0 && fileName && (
              <div className="flex flex-col items-center justify-center py-12 space-y-2 rounded-lg border border-dashed text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>No data extracted. Try another file or switch to Manual Mode.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {sites.length === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          You have no active sites assigned. Contact your admin.
        </p>
      )}
    </div>
  )
}
