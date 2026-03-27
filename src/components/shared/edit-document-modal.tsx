'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Loader2, 
  Save, 
  X, 
  FileUp, 
  Trash2, 
  Clock, 
  Building, 
  IndianRupee, 
  Hash, 
  User, 
  MapPin,
  ExternalLink,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  File
} from "lucide-react"
import { Document, Site } from "@/lib/types"
import { VendorAutocomplete } from "../vendor-autocomplete"
import { updateDocument, uploadFileToStorage } from "@/app/actions/team"
import { toast } from "sonner"
import { cn, parseFileUrls } from "@/lib/utils"

interface EditDocumentModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  sites: Site[]
}

export function EditDocumentModal({ 
  document, 
  isOpen, 
  onClose,
  onSuccess,
  sites
}: EditDocumentModalProps) {
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorId: '',
    amount: '',
    invoiceNumber: '',
    uniqueCode: '',
    documentDate: '',
    siteId: '',
    state: ''
  })
  
  // Multi-file state
  const [existingFileUrls, setExistingFileUrls] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<{file: File, previewUrl: string}[]>([])
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (document) {
      setFormData({
        vendorName: document.vendors?.name || '',
        vendorId: document.vendor_id || '',
        amount: document.amount.toString(),
        invoiceNumber: document.invoice_number || '',
        uniqueCode: document.unique_code || '',
        documentDate: document.document_date || '',
        siteId: document.site_id || '',
        state: document.state || ''
      })
      const urls = parseFileUrls(document.file_url)
      setExistingFileUrls(urls)
      setNewFiles([])
      setCurrentPreviewIndex(0)
    }
  }, [document])

  if (!document) return null

  const allFilePreviews = [
    ...existingFileUrls.map(url => ({ type: 'existing', url, name: url.split('/').pop()?.split('?')[0] || 'Existing File' })),
    ...newFiles.map(nf => ({ type: 'new', url: nf.previewUrl, name: nf.file.name }))
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newEntries = Array.from(files).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }))
      setNewFiles(prev => [...prev, ...newEntries])
      // Switch focus to the first newly added file
      setCurrentPreviewIndex(allFilePreviews.length)
    }
  }

  const removeFile = (index: number) => {
    if (index < existingFileUrls.length) {
      // Remove existing file
      const newUrls = [...existingFileUrls]
      newUrls.splice(index, 1)
      setExistingFileUrls(newUrls)
    } else {
      // Remove newly added file
      const newIdx = index - existingFileUrls.length
      const updatedNewFiles = [...newFiles]
      updatedNewFiles.splice(newIdx, 1)
      setNewFiles(updatedNewFiles)
    }

    // Adjust current index if needed
    if (currentPreviewIndex >= allFilePreviews.length - 1) {
      setCurrentPreviewIndex(Math.max(0, allFilePreviews.length - 2))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      const finalUrls = [...existingFileUrls]

      // 1. Upload new files
      for (const nf of newFiles) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', nf.file)
        const uploadResult = await uploadFileToStorage(uploadFormData)
        if (uploadResult.success && uploadResult.url) {
          finalUrls.push(uploadResult.url)
        } else {
          toast.error(`Upload failed for ${nf.file.name}: ${uploadResult.error || "Unknown error"}`)
          setIsPending(false)
          return
        }
      }

      if (finalUrls.length === 0) {
        toast.error("At least one document file is required.")
        setIsPending(false)
        return
      }

      // 2. Update document details
      // Store URLs as JSON string if multiple, or single string if one
      const fileUrlData = finalUrls.length === 1 ? finalUrls[0] : JSON.stringify(finalUrls)
      
      const statusUpdate = document.status === 'REJECTED' ? { status: 'PENDING' } : {}
      
      const result = await updateDocument(document.id, {
        vendor_id: formData.vendorId,
        amount: parseFloat(formData.amount) || 0, // Cast to number for TS
        invoice_number: formData.invoiceNumber,
        unique_code: formData.uniqueCode,
        document_date: formData.documentDate,
        site_id: formData.siteId,
        state: formData.state,
        file_url: fileUrlData,
        ...statusUpdate
      })

      if (result.success) {
        toast.success("Document updated successfully")
        onSuccess?.()
        onClose()
      } else {
        toast.error(result.error || "Failed to update document")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsPending(false)
    }
  }

  const currentPreview = allFilePreviews[currentPreviewIndex]
  const isImage = currentPreview?.url?.match(/\.(jpg|jpeg|png|webp)$/i) || 
                  (currentPreview?.type === 'new' && newFiles[currentPreviewIndex - existingFileUrls.length]?.file?.type.startsWith('image/'))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] flex flex-col p-0 gap-0 border-none shadow-2xl overflow-hidden sm:rounded-xl bg-background">
        <DialogHeader className="p-6 border-b flex flex-row items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Badge variant={
                document.status === 'APPROVED' ? 'default' : 
                document.status === 'REJECTED' ? 'destructive' : 'secondary'
              } className="px-3 py-0.5">
                {document.status}
              </Badge>
              <DialogTitle className="text-xl font-bold text-foreground">
                Editing: {document.vendors?.name || 'Unknown Vendor'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Originally submitted {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(document.created_at))}
            </DialogDescription>
          </div>
          
          <div className="flex items-center gap-2 mr-10">
             <Button variant="outline" size="sm" onClick={onClose} disabled={isPending} className="h-9">
               Cancel
             </Button>
             <Button variant="default" size="sm" onClick={handleSubmit} disabled={isPending} className="h-9">
               {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
               Save Changes
             </Button>
          </div>
        </DialogHeader>

        <div className="flex-auto h-full w-full overflow-hidden grid lg:grid-cols-[1fr_400px]">
          {/* Preview Section */}
          <div className="bg-muted/30 flex flex-col items-center justify-center relative group border-r h-full overflow-hidden">
            {currentPreview ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {isImage ? (
                  <img 
                    src={currentPreview.url} 
                    alt="Document preview" 
                    className="max-h-full max-w-full object-contain shadow-md"
                  />
                ) : (
                  <iframe 
                    src={`${currentPreview.url}#toolbar=0&view=FitH`} 
                    title="Document preview" 
                    className="w-full h-full border-none"
                  />
                )}
                
                {allFilePreviews.length > 1 && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 shadow-lg rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={() => setCurrentPreviewIndex(prev => (prev > 0 ? prev - 1 : allFilePreviews.length - 1))}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 shadow-lg rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={() => setCurrentPreviewIndex(prev => (prev < allFilePreviews.length - 1 ? prev + 1 : 0))}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 opacity-20" />
                <p>No files attached. Please add at least one.</p>
              </div>
            )}
            
            {/* Overlay Pagination Count */}
            {allFilePreviews.length > 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-background/80 backdrop-blur-md rounded-full border shadow-sm text-xs font-bold pointer-events-none">
                File {currentPreviewIndex + 1} of {allFilePreviews.length}
              </div>
            )}

            {/* File Actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 shadow-lg rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={() => fileInputRef.current?.click()}
                    title="Add More Files"
                >
                    <FileUp className="h-5 w-5" />
                </Button>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple
            />
          </div>

          {/* Form Section */}
          <div className="p-6 space-y-6 overflow-y-auto bg-card">
              {/* File List Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-1 bg-amber-500 rounded-full" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Document Files</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{allFilePreviews.length} Files</Badge>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {allFilePreviews.map((file, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer",
                        currentPreviewIndex === idx ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted"
                      )}
                      onClick={() => setCurrentPreviewIndex(idx)}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {file.url.match(/\.pdf$/i) ? <FileText className="h-4 w-4 shrink-0 text-red-500" /> : <File className="h-4 w-4 shrink-0 text-blue-500" />}
                        <span className="truncate font-medium">{file.name}</span>
                        {file.type === 'new' && <Badge className="h-4 px-1 text-[8px] bg-emerald-500 border-none">NEW</Badge>}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(idx)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {allFilePreviews.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">No files uploaded</p>}
                </div>
              </div>

             <div className="space-y-6 pt-2">
               <div className="flex items-center gap-2 pb-2 border-b">
                 <div className="h-7 w-1 bg-primary rounded-full" />
                 <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Bill Details</h3>
               </div>

               <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Vendor Name</Label>
                    <VendorAutocomplete 
                      defaultValue={formData.vendorName}
                      onSelect={(id, name) => setFormData(prev => ({ ...prev, vendorName: name, vendorId: id }))}
                      disabled={isPending} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase">Amount (₹)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="pl-9 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documentDate" className="text-xs font-semibold text-muted-foreground uppercase">Bill Date</Label>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="documentDate"
                          name="documentDate"
                          type="date"
                          value={formData.documentDate}
                          onChange={handleInputChange}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber" className="text-xs font-semibold text-muted-foreground uppercase">Invoice #</Label>
                      <Input 
                        id="invoiceNumber"
                        name="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={handleInputChange}
                        placeholder="INV-..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="uniqueCode" className="text-xs font-semibold text-muted-foreground uppercase">Unique Number</Label>
                      <Input 
                        id="uniqueCode"
                        name="uniqueCode"
                        value={formData.uniqueCode}
                        onChange={handleInputChange}
                        placeholder="UTR / Internal #"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Site / Project</Label>
                    <Select 
                      value={formData.siteId} 
                      onValueChange={(val) => handleSelectChange('siteId', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map(site => (
                          <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               {document.status === 'REJECTED' && document.remarks && (
                 <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                   <div className="flex items-center gap-2 text-destructive">
                     <AlertCircle className="h-4 w-4" />
                     <span className="text-xs font-bold uppercase tracking-wider">Reason for Rejection</span>
                   </div>
                   <p className="text-sm text-muted-foreground leading-relaxed italic">{document.remarks}</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
