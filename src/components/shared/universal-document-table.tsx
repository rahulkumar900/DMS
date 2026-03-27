'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Eye, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Archive,
  Pencil, 
  Trash2,
  ExternalLink,
  IndianRupee,
  Building,
  Calendar,
  User,
  AlertCircle,
  Download,
  FileSpreadsheet,
  X,
  Loader2,
  Search,
  Filter
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Document, DocumentStatus } from "@/lib/types"
import { DocumentPreviewModal } from "./document-preview-modal"
import { EditDocumentModal } from "./edit-document-modal"
import { cn, parseFileUrls } from "@/lib/utils"
import { exportDocumentsToExcel } from "@/lib/export"
import { toast } from "sonner"

interface UniversalDocumentTableProps {
  documents: Document[]
  userRole: string
  sites?: { id: string; name: string }[]
  showStatusFilter?: boolean
  onApprove?: (id: string) => Promise<any>
  onReject?: (id: string, remarks: string) => Promise<any>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => Promise<any>
  onArchive?: (id: string) => Promise<any>
  isActionPending?: boolean
}

export function UniversalDocumentTable({
  documents,
  userRole,
  sites,
  showStatusFilter = false,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onArchive,
  isActionPending = false,
}: UniversalDocumentTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentSearch = searchParams?.get('search') || ''
  const currentSite = searchParams?.get('site') || 'all'
  const currentStatus = searchParams?.get('status') || 'ALL'

  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const debouncedSearch = useDebounce(searchTerm, 500)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (value === 'all' || value === 'ALL' || !value) {
        params.delete(name)
      } else {
        params.set(name, value)
      }
      params.delete('page') 
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      router.push(`?${createQueryString('search', debouncedSearch)}`)
    }
  }, [debouncedSearch, currentSearch, router, createQueryString])

  const handleSiteChange = (value: string) => router.push(`?${createQueryString('site', value)}`)
  const handleStatusChange = (value: string) => router.push(`?${createQueryString('status', value)}`)
  const clearFilters = () => {
    setSearchTerm('')
    router.push(searchParams?.get('status') ? `?status=${searchParams?.get('status')}` : window.location.pathname)
  }

  const hasFilters = searchTerm || currentSite !== 'all' || (showStatusFilter && currentStatus !== 'ALL')

  // Local state for reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string>('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [docToEdit, setDocToEdit] = useState<Document | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkActionPending, setIsBulkActionPending] = useState(false)
  // Bulk reject dialog state
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false)
  const [bulkRejectRemarks, setBulkRejectRemarks] = useState('')

  const handlePreview = (doc: Document) => {
    setSelectedDoc(doc)
    setIsPreviewOpen(true)
  }

  const handleEdit = (doc: Document) => {
    setDocToEdit(doc)
    setIsEditOpen(true)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size === documents.length) {
        return new Set()
      } else {
        return new Set(documents.map(d => d.id))
      }
    })
  }

  const handleBulkExport = async () => {
    setIsBulkActionPending(true)
    try {
      const selectedDocs = documents.filter(d => selectedIds.has(d.id))
      await exportDocumentsToExcel(selectedDocs)
    } finally {
      setIsBulkActionPending(false)
    }
  }

  const handleBulkApprove = async () => {
    if (!onApprove) return
    setIsBulkActionPending(true)
    try {
      const ids = Array.from(selectedIds)
      for (const id of ids) {
        await onApprove(id)
      }
      setSelectedIds(new Set())
    } finally {
      setIsBulkActionPending(false)
    }
  }

  const handleBulkReject = async () => {
    if (!onReject) return
    if (!bulkRejectRemarks.trim()) {
      toast.warning('Please enter a remark for bulk reject')
      return
    }
    setIsBulkActionPending(true)
    try {
      const ids = Array.from(selectedIds)
      for (const id of ids) {
        await onReject(id, bulkRejectRemarks.trim())
      }
      setSelectedIds(new Set())
      setBulkRejectDialogOpen(false)
      setBulkRejectRemarks('')
    } finally {
      setIsBulkActionPending(false)
    }
  }

  const handleBulkDownload = async () => {
    setIsBulkActionPending(true)
    try {
      const selectedDocs = documents.filter(d => selectedIds.has(d.id))
      for (const doc of selectedDocs) {
        const link = document.createElement('a')
        link.href = doc.file_url
        link.download = `bill_${doc.id}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Small delay to avoid browser blocking
        await new Promise(r => setTimeout(r, 300))
      }
    } finally {
      setIsBulkActionPending(false)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/5">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No documents found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
          Adjust your filters or search terms to find what you're looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {sites && sites.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search across all fields..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {showStatusFilter && (
              <div className="flex-1 lg:w-48">
                <Select value={currentStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-10">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex-1 lg:w-56">
              <Select value={currentSite} onValueChange={handleSiteChange}>
                <SelectTrigger className="h-10 font-medium">
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs h-10 px-3 hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[48px] min-w-[48px] px-4 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelectAll()
                }}
              >
                <Checkbox 
                  checked={
                    selectedIds.size === documents.length && documents.length > 0
                      ? true
                      : selectedIds.size > 0
                      ? "indeterminate"
                      : false
                  }
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="min-w-[200px]">Vendor</TableHead>
              <TableHead className="hidden md:table-cell min-w-[150px]">Site</TableHead>
              <TableHead className="hidden lg:table-cell">Uploaded By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center w-[100px]">Status</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow 
                key={doc.id} 
                className={cn(
                  "group transition-colors",
                  selectedIds.has(doc.id) && "bg-muted"
                )}
                onClick={() => handlePreview(doc)}
              >
                <TableCell 
                  className="px-4 w-[48px] min-w-[48px]" 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelect(doc.id)
                  }}
                >
                  <Checkbox 
                    checked={selectedIds.has(doc.id)}
                    aria-label={`Select ${doc.vendors?.name}`}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                   {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(doc.created_at))}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{doc.vendors?.name || 'Unknown Vendor'}</span>
                    <span className="text-[10px] text-muted-foreground font-normal sm:hidden">
                      {doc.sites?.name || 'Unknown Site'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building className="h-3 w-3" />
                      {doc.sites?.name || 'N/A'}
                   </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                   <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {doc.profiles?.full_name || 'System'}
                   </div>
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold">
                   <div className="flex items-center justify-end text-sm">
                      <IndianRupee className="h-3 w-3" />
                      {Math.floor(doc.amount).toLocaleString('en-IN')}
                   </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={
                    doc.status === 'APPROVED' ? 'default' : 
                    doc.status === 'REJECTED' ? 'destructive' : 'secondary'
                  } className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-tight">
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5">Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handlePreview(doc)} className="gap-2 focus:bg-primary/5 cursor-pointer">
                          <Eye className="h-4 w-4 text-primary" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-0 focus:bg-primary/5 cursor-pointer">
                          <a href={parseFileUrls(doc.file_url)[0] || doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full px-2 py-1.5 h-full">
                            <ExternalLink className="h-4 w-4 text-blue-500" /> Open PDF
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      
                      {/* SITE_TEAM specific actions */}
                      {userRole === 'SITE_TEAM' && (doc.status === 'PENDING' || doc.status === 'REJECTED') && (
                        <DropdownMenuGroup>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => handleEdit(doc)} className="gap-2 focus:bg-amber-500/5 cursor-pointer text-amber-500">
                               <Pencil className="h-4 w-4" /> Edit Bill
                          </DropdownMenuItem>
                          {doc.status === 'PENDING' && (
                            <DropdownMenuItem onClick={() => onDelete?.(doc.id)} className="gap-2 focus:bg-destructive/5 cursor-pointer text-destructive">
                               <Trash2 className="h-4 w-4" /> Delete Bill
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuGroup>
                      )}

                      {/* CHECKER specific actions */}
                      {(userRole === 'CHECKER' || userRole === 'ADMIN') && doc.status === 'PENDING' && (
                        <DropdownMenuGroup>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => onApprove?.(doc.id)} className="gap-2 focus:bg-emerald-500/5 cursor-pointer text-emerald-500">
                             <CheckCircle2 className="h-4 w-4" /> Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setRejectDocId(doc.id); setRejectRemarks(''); setRejectDialogOpen(true); }} className="gap-2 focus:bg-destructive/5 cursor-pointer text-destructive">
                             <XCircle className="h-4 w-4" /> Reject / Query
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}

                      {/* ACCOUNTS specific actions */}
                      {(userRole === 'ACCOUNTS' || userRole === 'ADMIN') && (
                        <DropdownMenuGroup>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => onArchive?.(doc.id)} className="gap-2 focus:bg-emerald-500/5 cursor-pointer text-emerald-500">
                             <CheckCircle2 className="h-4 w-4" /> Mark as Paid / Archive
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DocumentPreviewModal 
        document={selectedDoc} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)}
        onApprove={onApprove}
        onReject={onReject}
        onEdit={handleEdit}
        isActionPending={isActionPending}
      />
      
      <EditDocumentModal 
        document={docToEdit}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => router.refresh()}
        sites={sites || []}
      />
      {/* Reject / Query Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject / Query Document</DialogTitle>
            <DialogDescription>Provide a remark explaining why the document is being rejected or queried.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter remark..."
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!rejectRemarks.trim() || isActionPending}
              onClick={() => {
                onReject?.(rejectDocId, rejectRemarks.trim());
                setRejectDialogOpen(false);
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Reject / Query Documents</DialogTitle>
            <DialogDescription>Enter a remark to apply to all selected documents.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter remark for bulk reject..."
            value={bulkRejectRemarks}
            onChange={(e) => setBulkRejectRemarks(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!bulkRejectRemarks.trim() || isActionPending}
              onClick={handleBulkReject}
            >
              Submit Bulk Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-foreground text-background px-2 py-2 rounded-lg shadow-lg flex items-center gap-2 border">
            <div className="flex items-center gap-3 pl-4 pr-4 border-r border-background/20 h-8">
               <div className="bg-primary text-primary-foreground h-6 px-2 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {selectedIds.size}
               </div>
               <span className="text-xs font-medium">Selected</span>
            </div>

            <div className="flex items-center gap-1 pr-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedIds(new Set())}
                className="text-background/70 hover:text-background hover:bg-background/10 h-9 px-4 rounded-md gap-2 text-xs"
              >
                <X className="size-4" /> Clear
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBulkDownload}
                disabled={isBulkActionPending}
                className="text-background/70 hover:text-background hover:bg-background/10 h-9 px-4 rounded-md gap-2 text-xs"
              >
                {isBulkActionPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Download
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleBulkExport}
                disabled={isBulkActionPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-6 rounded-md gap-2 text-xs font-bold"
              >
                {isBulkActionPending ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                Export Excel
              </Button>
                {/* Bulk Actions conditionally rendered */}
                {(userRole === 'CHECKER' || userRole === 'ADMIN') && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={isBulkActionPending}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4 rounded-md gap-2 text-xs"
                    >
                      Approve Selected
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkRejectDialogOpen(true)}
                      disabled={isBulkActionPending}
                      className="bg-red-600 text-white hover:bg-red-700 h-9 px-4 rounded-md gap-2 text-xs"
                    >
                      Reject Selected
                    </Button>
                  </>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  )
}
