'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FileText, ExternalLink, MapPin, Search, Eye } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'

interface Document {
  id: string
  vendor: string
  amount: number
  status: string
  created_at: string
  file_url: string
  sites?: { name: string }
}

interface HistoryTableProps {
  initialDocuments: Document[]
  sites: { id: string; name: string }[]
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
}

export function HistoryTable({ initialDocuments }: HistoryTableProps) {
  const searchParams = useSearchParams()

  return (
    <div className="space-y-4">
      {/* Search/Filter UI has been moved to Navbar/Page level or is handled by URL params */}


      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialDocuments.map((doc) => {
              const config = statusConfig[doc.status] || statusConfig.PENDING
              return (
                <TableRow key={doc.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="font-medium">{doc.vendor}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {doc.sites?.name}
                  </TableCell>
                  <TableCell>₹{Number(doc.amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/team/documents/${doc.id}${searchParams.get('site') ? `?site=${searchParams.get('site')}` : ""}`}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted-foreground hover:text-foreground")}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Open File"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {initialDocuments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
