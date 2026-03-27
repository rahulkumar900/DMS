import { requireRole } from '@/lib/auth'
import { getCheckerDocuments } from '@/app/actions/checker'
import { getMyAssignedSites } from '@/app/actions/team'
import { UniversalDocumentTable } from '@/components/shared/universal-document-table'
import { DataTablePagination } from '@/components/shared/DataTablePagination'

export default async function CheckerRejectedPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  const profile = await requireRole(['CHECKER', 'ADMIN'])
  
  const siteId = typeof searchParams.site === 'string' ? searchParams.site : undefined;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const page = Number(searchParams.page) || 1
  const pageSize = Number(searchParams.pageSize) || 12

  const [{ documents, totalCount, totalPages }, sitesData] = await Promise.all([
    getCheckerDocuments({ siteId, status: 'REJECTED', search, page, pageSize }),
    getMyAssignedSites()
  ])

  const sites = (sitesData as any[]).map(s => ({ id: s.id, name: s.name }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive">Queried Bills</h1>
          <p className="text-muted-foreground">Bills that require corrections or clarifications.</p>
        </div>
      </div>

      <div className="space-y-4">
        <UniversalDocumentTable 
          documents={documents as any} 
          userRole={profile.role} 
          sites={sites}
        />
        <DataTablePagination totalPages={totalPages} totalCount={totalCount} />
      </div>
    </div>
  )
}
