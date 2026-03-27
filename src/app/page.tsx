import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ShieldCheck, 
  FileCheck2, 
  ArrowRight, 
  Upload, 
  CheckCircle2, 
  LayoutDashboard,
  Factory,
  User,
  LogOut
} from "lucide-react";
import { logout } from "@/app/actions/auth";

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default async function Home() {
  const supabase = await createClient();
  
  let user = null;
  let profile = null;
  let dashboardPath = "/login";

  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      
      profile = data;

      if (profile?.role === "ADMIN") {
        dashboardPath = "/admin";
      } else if (profile?.role === "SITE_TEAM") {
        dashboardPath = "/team/upload";
      } else if (profile?.role === "CHECKER") {
        dashboardPath = "/checker";
      } else if (profile?.role === "ACCOUNTS") {
        dashboardPath = "/accounts";
      }
    }
  } catch (error) {
    console.error("Home page Supabase fetch failed:", error);
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    SITE_TEAM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    CHECKER: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    ACCOUNTS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              SiteStream
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href={dashboardPath}>
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                    Dashboard
                  </Button>
                </Link>
                <form action={logout}>
                  <Button variant="ghost" size="sm">
                    Log Out
                  </Button>
                </form>
                {profile && (
                  <Avatar className="h-8 w-8 border shadow-sm">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="default">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 border-b bg-muted/30">
          <div className="container mx-auto px-6 text-center">
            <div className="mx-auto mb-8 flex max-w-fit items-center gap-2 rounded-full border bg-background px-4 py-1 text-xs font-medium shadow-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Document Management System</span>
            </div>
            
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Professional Document Control for <span className="text-primary">Construction Projects</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              A robust 3-tier workflow designed to bring accuracy and transparency to your site documentation.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={dashboardPath}>
                <Button size="lg" className="h-11 px-8">
                  {user ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold md:text-3xl tracking-tight">Three-Tier Workflow</h2>
              <p className="mt-2 text-muted-foreground">From site upload to field verification and final approval.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group rounded-lg border bg-card p-8 shadow-sm transition-colors hover:bg-muted/50">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold">1. Site Upload</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Field teams upload bill photos and PDFs directly from the site with instant verification.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group rounded-lg border bg-card p-8 shadow-sm transition-colors hover:bg-muted/50">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold">2. Field Verification</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dedicated checkers review documents for accuracy, ensuring quantities match reality.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group rounded-lg border bg-card p-8 shadow-sm transition-colors hover:bg-muted/50">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold">3. Final Approval</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Admins and Accounts teams perform final extraction and approval for payment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 border-t bg-muted/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center gap-16 lg:flex-row">
              <div className="flex-1">
                <h2 className="text-3xl font-bold tracking-tight md:text-5xl lg:leading-tight">
                  Engineered for <span className="text-primary">Precision</span>
                </h2>
                <div className="mt-10 space-y-6">
                  {[
                    { title: "Real-time Tracking", desc: "Monitor the status of every document from submission to final payment." },
                    { title: "Automated Data Extraction", desc: "Reduce manual entry errors with AI-powered document processing." },
                    { title: "Role-based Dashboards", desc: "Tailored experiences for Site Teams, Checkers, and Administrators." }
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full max-w-xl mx-auto">
                <div className="rounded-lg border bg-card p-2 shadow-xl">
                   <div className="rounded border bg-muted/50 p-6 space-y-4">
                      <div className="h-3 w-24 rounded bg-primary/20" />
                      <div className="grid grid-cols-2 gap-3">
                         <div className="h-20 rounded bg-background border" />
                         <div className="h-20 rounded bg-background border" />
                      </div>
                      <div className="space-y-2">
                         <div className="h-2 w-full rounded bg-muted" />
                         <div className="h-2 w-full rounded bg-muted" />
                         <div className="h-2 w-2/3 rounded bg-muted" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background py-10">
        <div className="container mx-auto px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">SiteStream</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 SiteStream DMS. Professional Document Control.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
