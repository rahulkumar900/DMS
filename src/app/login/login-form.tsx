'use client'

import { useActionState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/auth'
import { Loader2, Factory } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader className="space-y-1 flex flex-col items-center justify-center text-center pb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm mb-2">
          <Factory className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">SiteStream DMS</CardTitle>
        <CardDescription>Enter your email and password to access your dashboard.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required disabled={pending} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full font-semibold" type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
