import { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { DashboardLayout } from '@/components/shared/DashboardLayout'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Protect this entire route tree to only admins
  const profile = await requireRole(['ADMIN'])

  return (
    <DashboardLayout userRole={profile.role} userName={profile.full_name} userEmail={profile.email}>
      {children}
    </DashboardLayout>
  )
}
