import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/shared/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield, Building, Calendar } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    SITE_TEAM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CHECKER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ACCOUNTS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  }

  return (
    <DashboardLayout 
      userRole={profile.role} 
      userName={profile.full_name} 
      userEmail={user.email!}
    >
      <div className="space-y-8 animate-in-slide">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">User Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 glass border-white/5">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-2 border-indigo-500/20 shadow-xl">
                  <AvatarFallback className="bg-brand-gradient text-white text-2xl font-bold">
                    {profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold">{profile.full_name}</h2>
                <Badge variant="outline" className={`mt-2 font-black tracking-widest ${roleColors[profile.role]}`}>
                  {profile.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 glass border-white/5">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="bg-indigo-500/10 p-2 rounded-md">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Email Address</span>
                  <span className="font-medium">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="bg-purple-500/10 p-2 rounded-md">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Permissions Level</span>
                  <span className="font-medium">{profile.role} Access</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="bg-emerald-500/10 p-2 rounded-md">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Member Since</span>
                  <span className="font-medium">{new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
