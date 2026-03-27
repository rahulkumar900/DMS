import { requireRole } from '@/lib/auth'
import { getMyAssignedSites, getTeamDocuments } from '@/app/actions/team'
import { UploadDocumentForm } from './upload-form'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Bill</h1>
        <p className="text-muted-foreground">Submit a site bill for Checker review.</p>
      </div>


      <div className="max-w-2xl mx-auto py-8">
        <UploadDocumentForm sites={sites} />
      </div>
    </div>
  )
}
