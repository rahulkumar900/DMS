'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FileText, MoreVertical, Edit2, Trash2, Loader2, ArrowRight } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IndianRupee, Eye, Building } from 'lucide-react'

interface Document {
  id: string
  vendor: string
  amount: number
  status: string
  remarks: string | null
  created_at: string
  file_url: string
  sites?: { name: string }
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING:  { label: 'PENDING',  variant: 'secondary' },
  APPROVED: { label: 'APPROVED', variant: 'default' },
  REJECTED: { label: 'REJECTED', variant: 'destructive' },
}

export function DocumentStatusList({ documents }: { documents: Document[] }) {
  const searchParams = useSearchParams()

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl bg-muted/5">
        <FileText className="h-10 w-10 mb-3 text-muted-foreground opacity-20" />
        <h3 className="text-sm font-medium text-muted-foreground">No bills uploaded recently.</h3>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="hidden md:table-cell">Site</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center w-[120px]">Status</TableHead>
            <TableHead className="text-right w-[80px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const config = statusConfig[doc.status] || statusConfig.PENDING
            const formattedDate = new Intl.DateTimeFormat('en-IN', { 
              day: '2-digit', month: 'short', year: 'numeric' 
            }).format(new Date(doc.created_at))

            return (
              <TableRow key={doc.id} className="group cursor-default hover:bg-muted/50 transition-colors">
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formattedDate}
                </TableCell>
                <TableCell className="font-medium">
                  {doc.vendor}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {doc.sites?.name || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold">
                  <div className="flex items-center justify-end text-sm">
                    <IndianRupee className="h-3 w-3" />
                    {doc.amount.toLocaleString('en-IN')}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={config.variant}
                    className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-tight"
                  >
                    {config.label}
                  </Badge>
                  {doc.remarks && doc.status !== 'APPROVED' && (
                    <p className="mt-1 text-[10px] text-destructive italic truncate max-w-[100px] mx-auto" title={doc.remarks}>
                      {doc.remarks}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/team/documents/${doc.id}${searchParams.get('site') ? `?site=${searchParams.get('site')}` : ""}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100")}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
