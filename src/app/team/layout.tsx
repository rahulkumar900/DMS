import { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { DashboardLayout } from '@/components/shared/DashboardLayout'

export default async function TeamLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole(['SITE_TEAM'])

  return (
    <DashboardLayout userRole={profile.role} userName={profile.full_name} userEmail={profile.email}>
      {children}
    </DashboardLayout>
  )
}
