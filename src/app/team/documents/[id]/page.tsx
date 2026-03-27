import { requireRole } from '@/lib/auth'
import { getDocumentById, deleteDocument, updateDocument, getMyAssignedSites } from '@/app/actions/team'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DocumentDetailsContent } from './details-content'
import { parseFileUrls } from '@/lib/utils'

export default async function DocumentDetailsPage(
  props: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  await requireRole(['SITE_TEAM'])

  const [doc, sitesData] = await Promise.all([
    getDocumentById(params.id),
    getMyAssignedSites()
  ])

  if (!doc) {
    notFound()
  }

  const siteId = typeof searchParams.site === 'string' ? searchParams.site : undefined;
  const backUrl = siteId ? `?site=${siteId}` : ""
  
  // Decide which back link to show (simplified to common team routes)
  const backHref = doc.status === 'PENDING' ? `/team/pending${backUrl}` : 
                   doc.status === 'REJECTED' ? `/team/rejected${backUrl}` :
                   `/team/history${backUrl}`

  const sites = (sitesData as any[]).map(s => ({ id: s.id, name: s.name }))

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <Link 
          href={backHref}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to List
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={doc.status === 'APPROVED' ? 'default' : doc.status === 'REJECTED' ? 'destructive' : 'secondary'}>
            {doc.status}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Side: Details */}
        <div className="w-1/3 bg-card border border-border rounded-xl overflow-y-auto p-6 shadow-sm">
          <DocumentDetailsContent doc={doc} sites={sites} />
        </div>

        {/* Right Side: PDF Preview */}
        <div className="flex-1 bg-muted/20 border border-border rounded-xl overflow-hidden shadow-sm">
          <iframe 
            src={`${parseFileUrls(doc.file_url)[0] || doc.file_url}#toolbar=0`} 
            className="w-full h-full border-none"
            title="Bill Preview"
          />
        </div>
      </div>
    </div>
  )
}
