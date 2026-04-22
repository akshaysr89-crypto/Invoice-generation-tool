import { Link, useLocation } from "wouter";
import { Building2, FileText, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export function RootLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 30000 } });

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Top Navigation Bar */}
      <header className="border-b bg-card sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-base tracking-tight">InvoiceGuard</span>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            <Link href="/">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                location === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <FileText className="w-4 h-4" />
                Submit Invoice
              </div>
            </Link>

            <Link href="/admin">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                location === "/admin"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </div>
            </Link>
          </nav>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            <span className={cn("w-2 h-2 rounded-full", health?.status === "ok" ? "bg-emerald-500" : "bg-red-500")} />
            <span className="hidden sm:inline">{health?.status === "ok" ? "System Operational" : "System Error"}</span>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
