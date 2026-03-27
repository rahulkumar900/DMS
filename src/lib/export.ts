import ExcelJS from 'exceljs'
import { Document } from './types'

export async function exportDocumentsToExcel(documents: Document[]) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Documents')

  // Define columns
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Vendor', key: 'vendor', width: 30 },
    { header: 'Invoice Number', key: 'invoice', width: 20 },
    { header: 'Amount (INR)', key: 'amount', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Site', key: 'site', width: 20 },
    { header: 'Uploaded By', key: 'uploader', width: 25 },
    { header: 'Unique Code', key: 'code', width: 15 },
    { header: 'Document Link', key: 'link', width: 50 }
  ]

  // Add rows
  documents.forEach(doc => {
    worksheet.addRow({
      date: new Date(doc.created_at).toLocaleDateString('en-IN'),
      vendor: doc.vendors?.name || 'N/A',
      invoice: doc.invoice_number || 'N/A',
      amount: doc.amount,
      status: doc.status,
      site: doc.sites?.name || 'N/A',
      uploader: doc.profiles?.full_name || 'N/A',
      code: doc.unique_code || 'N/A',
      link: doc.file_url
    })
  })

  // Styling
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' } // Primary color (indigo-600)
  }

  // Format amount column
  worksheet.getColumn('amount').numFmt = '#,##0.00'

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  
  // Trigger download
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `documents_export_${new Date().toISOString().split('T')[0]}.xlsx`
  anchor.click()
  window.URL.revokeObjectURL(url)
}
