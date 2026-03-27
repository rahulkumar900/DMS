import { requireRole } from '@/lib/auth'
import { getMyAssignedSites, getTeamDocuments, getDashboardStats, deleteDocument } from '@/app/actions/team'
import { UniversalDocumentTable } from '@/components/shared/universal-document-table'
import { DataTablePagination } from '@/components/shared/DataTablePagination'

export default async function TeamRejectedPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  const profile = await requireRole(['SITE_TEAM'])

  const siteId = typeof searchParams.site === 'string' ? searchParams.site : undefined;
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 12

  const [{ documents, totalCount, totalPages }, stats, sitesData] = await Promise.all([
    getTeamDocuments({ siteId, status: 'REJECTED', page, pageSize }),
    getDashboardStats(siteId),
    getMyAssignedSites()
  ])
  const sites = (sitesData as any[]).map(s => ({ id: s.id, name: s.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-destructive">Rejected / Queries</h1>
        <p className="text-muted-foreground">Bills that need correction or have remarks from the Checker.</p>
      </div>

      <UniversalDocumentTable 
        documents={documents as any} 
        userRole={profile.role}
        sites={sites}
        onDelete={deleteDocument}
      />
      <DataTablePagination totalPages={totalPages} totalCount={totalCount} />
    </div>
  )
}
