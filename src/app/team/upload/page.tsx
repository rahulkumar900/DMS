import { requireRole } from '@/lib/auth'
import { getMyAssignedSites, getTeamDocuments } from '@/app/actions/team'
import { UploadDocumentForm } from './upload-form'
import { DocumentStatusList } from './document-list'

export default async function TeamUploadPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  await requireRole(['SITE_TEAM'])

  const siteId = typeof searchParams.site === 'string' ? searchParams.site : undefined;

  const [sitesData, { documents }] = await Promise.all([
    getMyAssignedSites(),
    getTeamDocuments({ siteId, pageSize: 5 })
  ])
  const sites = (sitesData as any[]).map(s => ({ id: s.id, name: s.name }))

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Bill</h1>
          <p className="text-muted-foreground">Submit a site bill for Checker review.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <UploadDocumentForm sites={sites} />
      </div>

      <div className="max-w-5xl mx-auto space-y-4">
        <h2 className="text-xl font-bold">Recent Uploads</h2>
        <DocumentStatusList documents={documents as any[]} />
      </div>
    </div>
  )
}
