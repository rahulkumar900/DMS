'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { updateUserRole, assignSite, removeSiteAssignment } from '@/app/actions/admin'
import { MoreHorizontal, Shield, MapPin, Loader2, ChevronDown } from 'lucide-react'
import { useState, useTransition } from 'react'

const ROLES = ['ADMIN', 'SITE_TEAM', 'CHECKER', 'ACCOUNTS']

export function UsersTable({ users, availableSites }: { users: any[], availableSites: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  const handleRoleChange = (userId: string, newRole: string) => {
    setLoadingUserId(userId)
    startTransition(async () => {
      await updateUserRole(userId, newRole)
      setLoadingUserId(null)
    })
  }

  const handleSiteToggle = (userId: string, siteId: string, isAssigned: boolean) => {
    setLoadingUserId(userId)
    startTransition(async () => {
      if (isAssigned) {
        await removeSiteAssignment(userId, siteId)
      } else {
        await assignSite(userId, siteId)
      }
      setLoadingUserId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users &amp; Access Management</h2>
        <div className="text-sm text-muted-foreground">Manage roles and site visibility.</div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Sites</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const assignedSiteIds = user.assigned_sites?.map((s: any) => s.site_id) || []
              const isUpdating = isPending && loadingUserId === user.id

              return (
                <TableRow key={user.id} className={isUpdating ? 'opacity-50 pointer-events-none' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.full_name}
                      {user.role === 'ADMIN' && <Shield className="h-3 w-3 text-emerald-500" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 items-center gap-1 rounded-md border border-input bg-transparent px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        {user.role}
                        <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {ROLES.map(role => (
                            <DropdownMenuCheckboxItem
                              key={role}
                              checked={user.role === role}
                              onCheckedChange={() => handleRoleChange(user.id, role)}
                            >
                              {role}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={user.role === 'ADMIN' || user.role === 'ACCOUNTS'}
                        className="flex h-8 items-center gap-1 rounded-md border border-input bg-transparent px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MapPin className="mr-1 h-3 w-3" />
                        {user.role === 'ADMIN' || user.role === 'ACCOUNTS'
                          ? 'All Sites'
                          : `${assignedSiteIds.length} Assigned`}
                        <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Assign Sites</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {availableSites.map((site) => {
                            const isAssigned = assignedSiteIds.includes(site.id)
                            return (
                              <DropdownMenuCheckboxItem
                                key={site.id}
                                checked={isAssigned}
                                onCheckedChange={() => handleSiteToggle(user.id, site.id, isAssigned)}
                              >
                                <span className={!site.is_active ? 'line-through text-muted-foreground' : ''}>
                                  {site.name}
                                </span>
                              </DropdownMenuCheckboxItem>
                            )
                          })}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => alert('Delete via Supabase Auth API')}>
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
