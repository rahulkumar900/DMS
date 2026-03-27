import { requireRole } from '@/lib/auth'
import { getDashboardStats } from '@/app/actions/team'
import { DashboardStats } from '@/components/shared/DashboardStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Files, Clock, FileCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TeamDashboard(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  await requireRole(['SITE_TEAM'])

  const siteId = typeof searchParams.site === 'string' ? searchParams.site : undefined;
  const stats = await getDashboardStats(siteId)
  const siteParam = siteId ? `?site=${siteId}` : ""

  const quickLinks = [
    { title: 'Upload New Bill', href: `/team/upload${siteParam}`, icon: Files, description: 'Submit a new bill for review', color: 'text-blue-500' },
    { title: 'Pending Bills', href: `/team/pending${siteParam}`, icon: Clock, description: 'Check bills waiting for approval', color: 'text-amber-500' },
    { title: 'Rejected Bills', href: `/team/rejected${siteParam}`, icon: AlertCircle, description: 'Bills that need corrections', color: 'text-destructive' },
    { title: 'Payment History', href: `/team/history${siteParam}`, icon: FileCheck, description: 'View all approved bills', color: 'text-emerald-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">Overview of your site operations and bill submissions.</p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="h-full transition-colors group-hover:bg-muted/50 border-border/50">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="rounded-md p-2 bg-muted transition-colors group-hover:bg-background border">
                  <link.icon className={`h-5 w-5 ${link.color}`} />
                </div>
                <CardTitle className="text-lg font-semibold">{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
