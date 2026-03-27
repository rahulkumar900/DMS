import { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { AppSidebar } from './AppSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { getMyAssignedSites } from '@/app/actions/team'
import { getAllActiveSites } from '@/app/actions/accounts'
import { Separator } from '@/components/ui/separator'

interface DashboardLayoutProps {
  children: ReactNode
  userRole: string
  userName: string
  userEmail: string
}

export async function DashboardLayout({ children, userRole, userName, userEmail }: DashboardLayoutProps) {
  // Fetch sites based on role
  let sitesData = []
  if (userRole === 'ADMIN' || userRole === 'ACCOUNTS') {
    sitesData = await getAllActiveSites()
  } else {
    sitesData = await getMyAssignedSites()
  }

  const sites = sitesData.map((s: any) => ({ id: s.id, name: s.name }))

  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} userName={userName} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Navbar userRole={userRole} userName={userName} userEmail={userEmail} sites={sites} />
        </header>
        <main className="flex flex-1 flex-col p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
