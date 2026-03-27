'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadDocument, extractDocumentData, uploadFileToStorage, bulkUploadDocuments } from '@/app/actions/team'
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Trash2, Edit2, Save, X, Info } from 'lucide-react'
import { VendorAutocomplete } from '@/components/vendor-autocomplete'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Site {
  id: string
  name: string
}

export function UploadDocumentForm({ sites }: { sites: Site[] }) {
  const [state, formAction, pending] = useActionState(uploadDocument, undefined)
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  const currentSiteId = searchParams.get('site')
  const [fileName, setFileName] = useState<string>('')
  const [vendorName, setVendorName] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [gstPan, setGstPan] = useState('')
  
  // AI Mode States
  const [isAiMode, setIsAiMode] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedRows, setExtractedRows] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

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
    if (!selectedFile || extractedRows.length === 0 || !currentSiteId) {
      toast.error('Please select a site from navbar and ensure data is extracted.')
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
        siteId: currentSiteId
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

      {!currentSiteId ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-amber-500/5 rounded-xl border border-dashed border-amber-500/30 text-amber-500 text-center">
          <Info className="h-10 w-10 mb-3 opacity-80" />
          <p className="font-semibold text-lg">No Project Site Selected</p>
          <p className="text-sm opacity-80 mt-1">Please select a site from the global filter in the header to start uploading bills.</p>
        </div>
      ) : !isAiMode ? (
        <form ref={formRef} action={formAction} className="space-y-6" suppressHydrationWarning>
          <input type="hidden" name="site_id" value={currentSiteId} />
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Vendor */}
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor / Supplier Name</Label>
              <VendorAutocomplete 
                onSelect={(id, name, pan) => {
                  setVendorName(name)
                  setVendorId(id)
                  if (pan) setGstPan(pan)
                }} 
                disabled={pending} 
              />
              <input type="hidden" name="vendor_id" value={vendorId} />
              <input type="hidden" name="vendor" value={vendorName} />
            </div>

            {/* Unique Code */}
            <div className="space-y-2">
              <Label htmlFor="unique_code">Unique Code / Bill No.</Label>
              <Input
                id="unique_code"
                name="unique_code"
                placeholder="e.g. UC-789"
                className="bg-background h-10"
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                placeholder="e.g. INV-2024-001"
                className="bg-background h-10"
                disabled={pending}
              />
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
                className="bg-background h-10"
                disabled={pending}
              />
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
              className="bg-background h-10 font-bold"
              disabled={pending}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_200px] items-end">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bill Attachment (PDF or Image)</Label>
              <label
                htmlFor="file"
                className={cn(
                  "flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all",
                  fileName ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Upload className={cn("h-5 w-5", fileName ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-medium", fileName ? "text-primary truncate max-w-[200px]" : "text-muted-foreground")}>
                    {fileName || "Click to browse or drag & drop"}
                  </span>
                </div>
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

            <Button type="submit" disabled={pending} className="h-20 w-full flex-col gap-2 rounded-xl">
              {pending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> <span>Uploading...</span></>
              ) : (
                <><CheckCircle2 className="h-5 w-5" /> <span>Submit Bill</span></>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* AI Mode UI */}
          <div className="space-y-4">
            <div className="grid gap-5 md:grid-cols-2">
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
                <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent transition-none">
                        <TableHead className="py-2 text-[10px] font-bold uppercase tracking-wider h-10 px-4">Vendor</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold uppercase tracking-wider h-10 px-4">Date</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold uppercase tracking-wider h-10 px-4">Invoice No</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold uppercase tracking-wider h-10 px-4">Unique Code</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold uppercase tracking-wider h-10 px-4">Amount</TableHead>
                        <TableHead className="py-2 text-[10px] font-bold uppercase tracking-wider h-10 w-[80px] px-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedRows.map((row, index) => (
                        <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium px-4">{row.vendor_name}</TableCell>
                          <TableCell className="p-2 px-4 whitespace-nowrap">
                            <Input 
                              value={row.document_date} 
                              onChange={(e) => handleUpdateRow(index, { document_date: e.target.value })}
                              className="h-8 py-1 px-2 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-2 px-4">
                            <Input 
                              value={row.invoice_number} 
                              onChange={(e) => handleUpdateRow(index, { invoice_number: e.target.value })}
                              className="h-8 py-1 px-2 text-xs"
                            />
                          </TableCell>
                          <TableCell className="p-2 px-4">
                            <Input 
                              value={row.unique_code || ''} 
                              placeholder="Fill Code"
                              onChange={(e) => handleUpdateRow(index, { unique_code: e.target.value })}
                              className="h-8 py-1 px-2 font-mono text-[10px]"
                            />
                          </TableCell>
                          <TableCell className="p-2 px-4 tabular-nums">
                            <Input 
                              type="number"
                              value={row.amount} 
                              onChange={(e) => handleUpdateRow(index, { amount: parseFloat(e.target.value) || 0 })}
                              className="h-8 py-1 px-2 font-bold text-xs"
                            />
                          </TableCell>
                          <TableCell className="px-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
                  disabled={isSubmittingBulk || !currentSiteId} 
                  className="w-full"
                >
                  {isSubmittingBulk ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading {extractedRows.length} documents...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Bulk Submit {extractedRows.length} Documents to {sites.find(s => s.id === currentSiteId)?.name}</>
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
