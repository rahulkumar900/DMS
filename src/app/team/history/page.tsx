import { requireRole } from '@/lib/auth'
import { getTeamDocuments, getMyAssignedSites } from '@/app/actions/team'
import { UniversalDocumentTable } from '@/components/shared/universal-document-table'
import { DataTablePagination } from '@/components/shared/DataTablePagination'

export default async function TeamHistoryPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  const profile = await requireRole(['SITE_TEAM'])

  const siteId = typeof searchParams.site === 'string' ? searchParams.site : undefined;
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 12

  const [{ documents, totalCount, totalPages }, sitesData] = await Promise.all([
    getTeamDocuments({ siteId, status: 'APPROVED', page, pageSize }),
    getMyAssignedSites()
  ])
  const sites = (sitesData as any[]).map(s => ({ id: s.id, name: s.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document List</h1>
        <p className="text-muted-foreground">Search and filter all your historical bill submissions.</p>
      </div>

      <UniversalDocumentTable 
        documents={documents as any} 
        userRole={profile.role} 
        sites={sites}
      />
      <DataTablePagination totalPages={totalPages} totalCount={totalCount} />
    </div>
  )
}
