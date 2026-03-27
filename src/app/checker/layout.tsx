import { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { DashboardLayout } from '@/components/shared/DashboardLayout'
import { CheckerNav } from './checker-nav'
import { getDashboardStats } from '@/app/actions/checker'

export default async function CheckerLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole(['CHECKER'])
  const stats = await getDashboardStats()

  return (
    <DashboardLayout userRole={profile.role} userName={profile.full_name} userEmail={profile.email}>
      <div className="container mx-auto py-6">
        <CheckerNav stats={stats} />
        {children}
      </div>
    </DashboardLayout>
  )
}
