'use client'

import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, User, Building, IndianRupee, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  amount: number
  status: string
  remarks: string | null
  created_at: string
  sites?: { name: string }
  vendors?: { name: string }
  profiles?: { full_name: string }
}

export function CheckerDocumentList({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl border-border bg-muted/10">
        <FileText className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No bills found</h3>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {documents.map((doc) => (
        <div 
          key={doc.id}
          className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-md"
        >
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg">{doc.vendors?.name || 'Unknown Vendor'}</span>
                <Badge variant={
                  doc.status === 'APPROVED' ? 'default' : 
                  doc.status === 'REJECTED' ? 'destructive' : 'secondary'
                }>
                  {doc.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  {doc.sites?.name || 'Unknown Site'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(doc.created_at))}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {doc.profiles?.full_name || 'System'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right border-t sm:border-none pt-3 sm:pt-0">
            <div className="flex flex-col sm:items-end">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount</span>
              <span className="text-xl font-bold flex items-center gap-0.5">
                <IndianRupee className="h-4 w-4" />
                {Number(doc.amount).toLocaleString('en-IN')}
              </span>
            </div>
            
            {doc.status === 'PENDING' ? (
                <Link 
                  href="/checker"
                  className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Review
                </Link>
            ) : (
                <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
            )}
          </div>

          {doc.remarks && doc.status === 'REJECTED' && (
            <div className="absolute -bottom-2 right-4 px-3 py-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-md flex items-center gap-1 shadow-sm uppercase tracking-tighter">
              <AlertCircle className="h-3 w-3" />
              Remark: {doc.remarks}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
