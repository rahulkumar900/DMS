import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { DashboardLayout } from '@/components/shared/DashboardLayout'
import { VendorsTable } from './vendors-table'

export default async function AdminVendorsPage() {
  const profile = await requireRole(['ADMIN', 'ACCOUNTS'])
  const supabase = await createClient()

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .order('name', { ascending: true })

  return (
    <DashboardLayout 
      userRole={profile.role} 
      userName={profile.full_name} 
      userEmail={profile.email}
    >
      <div className="space-y-8 animate-in-slide">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Vendor Management</h1>
          <p className="text-muted-foreground">Manage authorized suppliers and their tax information.</p>
        </div>

        <VendorsTable initialVendors={vendors || []} />
      </div>
    </DashboardLayout>
  )
}
