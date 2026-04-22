import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import { InvoiceRiskLevel, InvoiceDecision } from "@workspace/api-client-react";

export function RiskBadge({ level, className }: { level: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-0",
        level === "Low" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        level === "Medium" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        level === "High" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        {level === "Low" && <ShieldCheck className="w-3.5 h-3.5" />}
        {level === "Medium" && <AlertTriangle className="w-3.5 h-3.5" />}
        {level === "High" && <AlertCircle className="w-3.5 h-3.5" />}
        {level} Risk
      </span>
    </Badge>
  );
}

export function DecisionBadge({ decision, className }: { decision: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium px-2.5 py-0.5",
        decision === "Approved" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400",
        decision === "Rejected" && "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400",
        decision === "Review Required" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        {decision === "Approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
        {decision === "Rejected" && <XCircle className="w-3.5 h-3.5" />}
        {decision === "Review Required" && <AlertTriangle className="w-3.5 h-3.5" />}
        {decision}
      </span>
    </Badge>
  );
}
