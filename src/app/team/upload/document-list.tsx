'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FileText, MoreVertical, Edit2, Trash2, Loader2, ArrowRight } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteDocument, updateDocument } from '@/app/actions/team'

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
  PENDING:  { label: 'Pending',  variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

export function DocumentStatusList({ documents }: { documents: Document[] }) {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        <FileText className="h-10 w-10 mb-3 opacity-30" />
        <p>No bills uploaded yet.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {documents.map((doc) => {
        const config = statusConfig[doc.status] || statusConfig.PENDING
        const date = new Date(doc.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        })

        return (
          <li key={doc.id} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-muted/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{doc.vendor}</span>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {/* @ts-ignore */}
                <span>{doc.sites?.name}</span>
                <span>·</span>
                <span>₹{doc.amount.toLocaleString('en-IN')}</span>
                <span>·</span>
                <span>{date}</span>
              </div>
              {doc.remarks && doc.status !== 'APPROVED' && (
                <p className="mt-1 text-xs text-amber-400 italic">"{doc.remarks}"</p>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/team/documents/${doc.id}${searchParams.get('site') ? `?site=${searchParams.get('site')}` : ""}`}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted-foreground hover:text-foreground")}
                title="View Details"
              >
                <FileText className="h-4 w-4" />
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
