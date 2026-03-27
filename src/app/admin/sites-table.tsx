'use client'

import { useActionState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Power } from 'lucide-react'
import { createSite, toggleSiteActivity } from '@/app/actions/admin'

export function SitesTable({ sites }: { sites: any[] }) {
  const [state, formAction, pending] = useActionState(createSite, undefined)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sites Management</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="default">
              <Plus className="mr-2 h-4 w-4" /> Add Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
              <DialogDescription>
                Create a new project site for document tracking.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" name="name" className="col-span-3" required disabled={pending} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input id="location" name="location" className="col-span-3" disabled={pending} />
                </div>
                {state?.error && (
                  <p className="text-sm text-destructive col-span-4 text-center">{state.error}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell>{site.location || '--'}</TableCell>
                <TableCell>
                  <Badge variant={site.is_active ? 'default' : 'secondary'}>
                    {site.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSiteActivity(site.id, site.is_active)}
                    title={site.is_active ? 'Deactivate Site' : 'Activate Site'}
                  >
                    <Power className={`h-4 w-4 ${site.is_active ? 'text-destructive' : 'text-emerald-500'}`} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sites.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No sites found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
