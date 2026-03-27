import { requireRole } from '@/lib/auth'
import { getUsers, getSites } from '@/app/actions/admin'
import { UsersTable } from './users-table'
import { SitesTable } from './sites-table'

export default async function AdminDashboard() {
  await requireRole(['ADMIN'])

  const [users, sites] = await Promise.all([
    getUsers(),
    getSites(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage system users, sites, and assignments here.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="p-1">
          <UsersTable users={users} availableSites={sites} />
        </div>

        <div className="p-1">
          <SitesTable sites={sites} />
        </div>
      </div>
    </div>
  )
}
