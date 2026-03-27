'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, UserCircle } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { ModeToggle } from '@/components/mode-toggle'
import { SiteFilter } from '@/components/site-filter'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Site {
  id: string
  name: string
}

interface NavbarProps {
  userRole: string
  userName: string
  userEmail: string
  sites: Site[]
}

export function Navbar({ userRole, userName, userEmail, sites }: NavbarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      toast.promise(logout(), {
        loading: 'Logging out...',
        success: 'Logged out successfully',
        error: 'Failed to log out',
      })
    })
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    SITE_TEAM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CHECKER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ACCOUNTS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };



  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Placeholder if needed */}
      </div>


      <div className="flex items-center gap-4">
        {sites.length > 0 && <SiteFilter sites={sites} />}
        <ModeToggle />
        
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-border bg-background shadow-sm">

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full outline-none ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-8 w-8 border border-border shadow-sm">
                <AvatarImage src="" alt={userName} />
                <AvatarFallback className="bg-indigo-500 text-white text-xs font-bold">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userRole}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="flex w-full items-center">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" 
                  disabled={isPending} 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
