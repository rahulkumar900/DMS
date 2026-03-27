import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FilterBarSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm mb-4">
      <Skeleton className="h-10 w-full lg:max-w-md rounded-md" />
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <Skeleton className="h-10 w-full lg:w-48 rounded-md" />
        <Skeleton className="h-10 w-full lg:w-56 rounded-md" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[48px] px-4"><Skeleton className="h-4 w-4 rounded" /></TableHead>
            <TableHead className="w-[120px]"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="min-w-[200px]"><Skeleton className="h-4 w-32" /></TableHead>
            <TableHead className="hidden md:table-cell min-w-[150px]"><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
            <TableHead className="text-center w-[100px]"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
            <TableHead className="text-right w-[80px]"><Skeleton className="h-4 w-8 ml-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-4"><Skeleton className="h-4 w-4 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24 sm:hidden" />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function DashboardPageSkeleton({ withStats = false, withFilters = true }: { withStats?: boolean, withFilters?: boolean }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DashboardHeaderSkeleton />
      {withStats && <StatsSkeleton />}
      {withFilters && <FilterBarSkeleton />}
      <div className="space-y-4">
        <TableSkeleton rowCount={7} />
        <div className="flex items-center justify-end space-x-2">
           <Skeleton className="h-9 w-24" />
           <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}
