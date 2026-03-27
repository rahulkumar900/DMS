import { requireRole } from '@/lib/auth'
import { getCheckerDocuments, getDashboardStats, approveDocument, rejectDocument } from '@/app/actions/checker'
import { getMyAssignedSites } from '@/app/actions/team'
import { UniversalDocumentTable } from '@/components/shared/universal-document-table'
import { DataTablePagination } from '@/components/shared/DataTablePagination'
import { Suspense } from 'react'
import { FilterBarSkeleton, TableSkeleton } from '@/components/shared/skeletons'

export default async function CheckerDashboard(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const profile = await requireRole(['CHECKER', 'ADMIN'])
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            Pending bills awaiting checker verification.
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-in fade-in duration-500">
          <FilterBarSkeleton />
          <TableSkeleton rowCount={7} />
        </div>
      }>
        <CheckerContent searchParams={props.searchParams} profile={profile} />
      </Suspense>
    </div>
  )
}

async function CheckerContent({ searchParams, profile }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>, profile: any }) {
  const params = await searchParams;
  const siteId = typeof params.site === 'string' ? params.site : undefined;
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 12

  const [{ documents, totalCount, totalPages }, sitesData] = await Promise.all([
    getCheckerDocuments({ siteId, status: 'PENDING', page, pageSize }),
    getMyAssignedSites()
  ])
  const sites = (sitesData as any[]).map(s => ({ id: s.id, name: s.name }))

  return (
    <div className="space-y-4">
      <UniversalDocumentTable 
        documents={documents as any} 
        userRole={profile.role}
        sites={sites}
        showStatusFilter={true}
        onApprove={approveDocument}
        onReject={rejectDocument}
      />
      <DataTablePagination totalPages={totalPages} totalCount={totalCount} />
    </div>
  )
}
