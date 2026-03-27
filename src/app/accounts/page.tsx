import { requireRole } from '@/lib/auth'
import { getApprovedDocuments, getAllActiveSites, getDashboardStats } from '@/app/actions/accounts'
import { DashboardStats } from '@/components/shared/DashboardStats'
import { MasterExportButton, AccountsContainer } from './accounts-client'
import { Suspense } from 'react'
import { StatsSkeleton, FilterBarSkeleton, TableSkeleton } from '@/components/shared/skeletons'

export default async function AccountsDashboard(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requireRole(['ACCOUNTS', 'ADMIN'])
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Approved Bills</h1>
          <p className="text-sm text-muted-foreground">
            Payment processing and archival overview.
          </p>
        </div>
        <MasterExportButton />
      </div>

      <Suspense fallback={
        <div className="space-y-6 animate-in fade-in duration-500">
          <StatsSkeleton />
          <div className="space-y-4">
            <FilterBarSkeleton />
            <TableSkeleton rowCount={7} />
          </div>
        </div>
      }>
        <AccountsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}

async function AccountsContent({ searchParams }: any) {
  const params = await searchParams;
  const siteId = typeof params.site === 'string' ? params.site : undefined;
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10

  const [{ documents, totalCount, totalPages }, sitesData, stats] = await Promise.all([
    getApprovedDocuments({ siteId, page, pageSize }),
    getAllActiveSites(),
    getDashboardStats(siteId)
  ])
  
  return (
    <div className="space-y-8">
      <DashboardStats stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-xl font-semibold tracking-tight">
             Pending Payments
           </h2>
        </div>
        
        <AccountsContainer documents={documents} totalPages={totalPages} totalCount={totalCount} sites={sitesData} />
      </div>
    </div>
  )
}
