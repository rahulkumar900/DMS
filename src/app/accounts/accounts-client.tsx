'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { UniversalDocumentTable } from '@/components/shared/universal-document-table'
import { archiveDocument, getMasterExportData } from '@/app/actions/accounts'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/shared/DataTablePagination'

export function MasterExportButton() {
  const [isExporting, setIsExporting] = useState(false)

  const handleMasterExport = async () => {
    setIsExporting(true)
    try {
      const allDocs = await getMasterExportData()
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Master Bill Report')

      sheet.columns = [
        { header: 'Date', key: 'date', width: 16 },
        { header: 'Site', key: 'site', width: 22 },
        { header: 'Vendor', key: 'vendor', width: 28 },
        { header: 'Amount (₹)', key: 'amount', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Uploaded By', key: 'uploaded_by', width: 22 },
        { header: 'Archived', key: 'is_archived', width: 10 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ]

      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: 'FF1A1B1E' }
      }

      allDocs.forEach((doc: any) => {
        sheet.addRow({
          date: new Date(doc.created_at).toLocaleDateString('en-IN'),
          site: doc.sites?.name ?? '--',
          vendor: doc.vendors?.name || 'N/A',
          amount: Number(doc.amount),
          status: doc.status,
          uploaded_by: doc.profiles?.full_name ?? '--',
          is_archived: doc.is_archived ? 'YES' : 'NO',
          remarks: doc.remarks ?? '',
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SiteStream-Master-Report-${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Master report exported successfully")
    } catch (e) {
      console.error('Export failed', e)
      toast.error("Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button 
      onClick={handleMasterExport} 
      disabled={isExporting} 
      variant="outline" 
      className="rounded-full px-6 font-bold border-primary/20 hover:bg-primary/5 gap-2"
    >
      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Master Export
    </Button>
  )
}

export function AccountsContainer({ documents, totalPages, totalCount, sites }: any) {
  const [isPending, startTransition] = useTransition()

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      try {
        await archiveDocument(id)
        toast.success("Bill marked as paid and archived")
      } catch (e) {
        toast.error("Failed to archive bill")
      }
    })
  }

  return (
    <div className="space-y-4">
      <UniversalDocumentTable 
        documents={documents} 
        userRole="ACCOUNTS" 
        sites={sites}
        onArchive={handleArchive}
        isActionPending={isPending}
      />
      <DataTablePagination totalPages={totalPages} totalCount={totalCount} />
    </div>
  )
}
