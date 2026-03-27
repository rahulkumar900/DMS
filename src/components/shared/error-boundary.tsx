'use client'

import { AlertCircle, RefreshCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function GlobalErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-6 animate-in fade-in duration-500">
      <Alert variant="destructive" className="max-w-md bg-destructive/5 shadow-md">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold tracking-tight">Something went wrong!</AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed opacity-90">
          {error.message || "An unexpected error occurred while loading this section. Our team has been notified."}
        </AlertDescription>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={reset} className="bg-background text-foreground hover:bg-muted font-semibold">
            <RefreshCcw className="mr-2 h-4 w-4" /> Try again
          </Button>
        </div>
      </Alert>
    </div>
  )
}
