"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Files,
  Clock,
  AlertCircle,
  FileCheck,
  Factory,
  Settings,
  UserCircle,
  ChevronRight,
  Building2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  userRole: string
  userName: string
}

export function AppSidebar({ userRole, userName, ...props }: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSite = searchParams.get('site')

  const getNavLinks = () => {
    const siteParam = currentSite ? `?site=${currentSite}` : ""
    switch (userRole) {
      case 'ADMIN':
        return [
          { group: "Administration", items: [
            { title: 'Dashboard', href: `/admin${siteParam}`, icon: LayoutDashboard },
            { title: 'Sites', href: `/admin/sites${siteParam}`, icon: Factory },
            { title: 'Vendors', href: `/admin/vendors${siteParam}`, icon: Building2 },
            { title: 'Users', href: `/admin/users${siteParam}`, icon: UserCircle },
          ]}
        ]
      case 'SITE_TEAM':
        return [
          { group: "Main", items: [
            { title: 'Dashboard', href: `/team${siteParam}`, icon: LayoutDashboard },
            { title: 'Upload Bill', href: `/team/upload${siteParam}`, icon: Files },
          ]},
          { group: "Document Status", items: [
            { title: 'Pending Approval', href: `/team/pending${siteParam}`, icon: Clock },
            { title: 'Rejected / Queries', href: `/team/rejected${siteParam}`, icon: AlertCircle },
            { title: 'Approved History', href: `/team/history${siteParam}`, icon: FileCheck },
          ]}
        ]
      case 'CHECKER':
        return [
          { group: "Review", items: [
            { title: 'Review Queue', href: `/checker${siteParam}`, icon: LayoutDashboard },
            { title: 'Processed Bills', href: `/checker/history${siteParam}`, icon: FileCheck },
          ]}
        ]
      case 'ACCOUNTS':
        return [
          { group: "Accounting", items: [
            { title: 'Approval Queue', href: `/accounts${siteParam}`, icon: Factory },
            { title: 'Vendors', href: `/admin/vendors${siteParam}`, icon: Building2 },
            { title: 'Archived Docs', href: `/accounts/archive${siteParam}`, icon: Files },
            { title: 'Reports', href: `/accounts/reports${siteParam}`, icon: LayoutDashboard },
          ]}
        ]
      default:
        return []
    }
  }

  const navGroups = getNavLinks()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar" {...props}>
      <SidebarHeader className="h-16 flex items-left px-4 border-b">
        <Link href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Factory className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            SiteStream
          </span>
        </Link>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Factory className="h-4 w-4 text-primary-foreground" />
           </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.group} className="animate-in-fade">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50">{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const baseHref = item.href.split('?')[0];
                  // Determine if active based on baseHref to ignore query params in matching
                  const isActive = 
                    baseHref.split('/').length <= 2 
                      ? pathname === baseHref // Exact match for root dashboards like /admin, /team
                      : pathname.startsWith(baseHref); // Prefix match for subpages

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary"
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
