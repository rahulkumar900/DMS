import { requireRole } from '@/lib/auth'
import { getMyAssignedSites, getTeamDocuments, getDashboardStats, deleteDocument, updateDocument } from '@/app/actions/team'
import { UniversalDocumentTable } from '@/components/shared/universal-document-table'
import { DataTablePagination } from '@/components/shared/DataTablePagination'
import { Suspense } from 'react'
import { FilterBarSkeleton, TableSkeleton } from '@/components/shared/skeletons'

export default async function TeamPendingPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const profile = await requireRole(['SITE_TEAM'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approval</h1>
        <p className="text-muted-foreground">Bills currently being reviewed by the Checker.</p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-in fade-in duration-500">
          <FilterBarSkeleton />
          <TableSkeleton rowCount={5} />
        </div>
      }>
        <TeamPendingContent searchParams={props.searchParams} profile={profile} />
      </Suspense>
    </div>
  )
}

async function TeamPendingContent({ searchParams, profile }: any) {
  const params = await searchParams;
  const siteId = typeof params.site === 'string' ? params.site : undefined;
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 12

  const [{ documents, totalCount, totalPages }, stats, sitesData] = await Promise.all([
    getTeamDocuments({ siteId, status: 'PENDING', page, pageSize }),
    getDashboardStats(siteId),
    getMyAssignedSites()
  ])
  const sites = (sitesData as any[]).map(s => ({ id: s.id, name: s.name }))

  return (
    <div className="space-y-4">
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
