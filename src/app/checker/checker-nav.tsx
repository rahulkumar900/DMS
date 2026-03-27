'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ClipboardList, History, XCircle, Files } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CheckerStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export function CheckerNav({ stats }: { stats: CheckerStats }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Review Queue', href: '/checker', icon: ClipboardList, count: stats.pending, color: 'text-amber-500' },
    { name: 'Approved Bills', href: '/checker/history', icon: History, count: stats.approved, color: 'text-emerald-500' },
    { name: 'Queried Bills', href: '/checker/rejected', icon: XCircle, count: stats.rejected, color: 'text-destructive' },
    { name: 'All Documents', href: '/checker/all', icon: Files, count: stats.total, color: 'text-blue-500' },
  ]

  return (
    <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap group",
              isActive 
                ? "border-primary text-primary bg-primary/5" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className={cn("h-4 w-4 transition-colors", isActive ? item.color : "group-hover:text-foreground")} />
            <span>{item.name}</span>
            {item.count > 0 && (
              <Badge 
                variant={isActive ? "default" : "secondary"} 
                className={cn(
                  "ml-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full",
                  !isActive && "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground"
                )}
              >
                {item.count}
              </Badge>
            )}
          </Link>
        )
      })}
    </div>
  )
}
