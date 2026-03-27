import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const items = [
    {
      title: "Total Documents",
      value: stats.total,
      icon: FileText,
      description: "Total bills submitted",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending Approval",
      value: stats.pending,
      icon: Clock,
      description: "Awaiting Checker review",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      description: "Cleared for payment",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Queries / Rejected",
      value: stats.rejected,
      icon: AlertCircle,
      description: "Bills needing correction",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in-fade">
      {items.map((item, index) => (
        <Card 
          key={item.title} 
          className="border border-border/50 shadow-sm transition-all hover:bg-muted/50"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <div className={`rounded-md p-1.5 ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
