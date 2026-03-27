'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { approveDocument, rejectDocument, getAllDocumentsForSites } from '@/app/actions/checker'
import {
  CheckCircle2, XCircle, FileText, ChevronRight,
  Download, Loader2, AlertCircle, ExternalLink, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  vendor_id?: string
  amount: number
  status: string
  remarks: string | null
  file_url: string
  created_at: string
  invoice_number?: string
  unique_code?: string
  sites?: { name: string }
  vendors?: { id: string, name: string, pan_gst?: string }
  profiles?: { full_name: string }
}

export function CheckerReviewPanel({ documents }: { documents: Document[] }) {
  const [selected, setSelected] = useState<Document | null>(documents[0] ?? null)
  const [remarks, setRemarks] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Update selected document when the list changes (e.g. after filtering)
  useEffect(() => {
    if (documents.length > 0 && (!selected || !documents.find(d => d.id === selected.id))) {
      setSelected(documents[0])
    } else if (documents.length === 0) {
      setSelected(null)
    }
  }, [documents])

  const handleApprove = () => {
    if (!selected) return
    startTransition(async () => {
      const res = await approveDocument(selected.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Bill from ${selected.vendors?.name || 'Vendor'} approved!`)
        setSelected(null)
      }
    })
  }

  const handleReject = () => {
    if (!selected || !remarks.trim()) {
      toast.warning('Please enter a remark before querying.')
      return
    }
    startTransition(async () => {
      const res = await rejectDocument(selected.id, remarks)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Query submitted for ${selected.vendors?.name || 'Vendor'}`)
        setRemarks('')
        setShowRejectForm(false)
        setSelected(null)
      }
    })
  }

  const handleExcel = async () => {
    setIsExporting(true)
    try {
      const allDocs = await getAllDocumentsForSites()
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Documents')

      sheet.columns = [
        { header: 'Date', key: 'date', width: 16 },
        { header: 'Site', key: 'site', width: 22 },
        { header: 'Vendor', key: 'vendor', width: 28 },
        { header: 'Amount (₹)', key: 'amount', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Uploaded By', key: 'uploaded_by', width: 22 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ]

      // Style header row
      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF1A1B1E' }
      }

      allDocs.forEach((doc: any) => {
        sheet.addRow({
          date: new Date(doc.created_at).toLocaleDateString('en-IN'),
          site: doc.sites?.name ?? '--',
          vendor: doc.vendors?.name ?? '--',
          amount: doc.amount,
          status: doc.status,
          // @ts-ignore
          uploaded_by: doc.profiles?.full_name ?? '--',
          remarks: doc.remarks ?? '',
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SiteStream-Report-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed', e)
    } finally {
      setIsExporting(false)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 opacity-80" />
        <div>
          <p className="text-lg font-semibold">All caught up!</p>
          <p className="text-sm text-muted-foreground">No pending bills for your assigned sites.</p>
        </div>
        <Button variant="outline" onClick={handleExcel} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export Full Report
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr] animate-in-slide">
      {/* Queue panel */}
      <div className="flex flex-col gap-1 rounded-xl border border-white/5 glass p-3">
        <div className="flex items-center justify-between px-2 py-2 mb-1">
          <span className="text-sm font-semibold">Pending Queue</span>
          <Badge variant="secondary">{documents.length}</Badge>
        </div>
        <div className="overflow-y-auto space-y-1 max-h-[520px]">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { setSelected(doc); setShowRejectForm(false); setError(null) }}
              className={`w-full text-left rounded-lg px-3 py-3 transition-all hover:bg-white/5 flex items-center gap-3 ${selected?.id === doc.id ? 'bg-white/10 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' : ''}`}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.vendors?.name || 'Unknown Vendor'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {doc.sites?.name} · ₹{Number(doc.amount).toLocaleString('en-IN')}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="w-full" onClick={handleExcel} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Review panel */}
      {selected ? (
        <div className="rounded-xl border border-white/5 glass flex flex-col overflow-hidden">
          {/* File preview */}
          <div className="relative bg-muted/30 flex-1 min-h-[300px] flex items-center justify-center">
            {selected.file_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
              <img
                src={selected.file_url}
                alt="Bill preview"
                className="max-h-[400px] max-w-full object-contain rounded"
              />
            ) : (
              <iframe
                src={selected.file_url}
                title="Bill preview"
                className="w-full h-[400px] border-0"
              />
            )}
            <a
              href={selected.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 rounded-md bg-background/80 p-1.5 text-muted-foreground hover:text-foreground hover:bg-background backdrop-blur"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Metadata & actions */}
          <div className="p-5 space-y-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Vendor</p>
                <p className="font-medium">{selected.vendors?.name || 'Unknown Vendor'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Amount</p>
                <p className="font-medium">₹{Number(selected.amount).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Site</p>
                {/* @ts-ignore */}
                <p className="font-medium">{selected.sites?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Uploaded By</p>
                {/* @ts-ignore */}
                <p className="font-medium">{selected.profiles?.full_name ?? '--'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Submitted</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(selected.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {showRejectForm && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Query Remark (required)
                </label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Explain what needs to be corrected..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isPending}
                onClick={handleApprove}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve
              </Button>

              {showRejectForm ? (
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={isPending}
                  onClick={handleReject}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Submit Query
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Query / Reject
                </Button>
              )}

              <a 
                href={selected.file_url} 
                download 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "flex-[0.8]")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground text-sm">
          Select a bill from the queue to review.
        </div>
      )}
    </div>
  )
}
