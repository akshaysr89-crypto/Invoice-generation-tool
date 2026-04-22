import { useListInvoices, useGetInvoiceStats, getListInvoicesQueryKey, getGetInvoiceStatsQueryKey, useGetInvoice, getGetInvoiceQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RiskBadge, DecisionBadge } from "@/components/status-badges";
import { format } from "date-fns";
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function AdminDashboard() {
  const { data: invoices, isLoading: invoicesLoading } = useListInvoices({
    query: { queryKey: getListInvoicesQueryKey() }
  });

  const { data: stats, isLoading: statsLoading } = useGetInvoiceStats({
    query: { queryKey: getGetInvoiceStatsQueryKey() }
  });

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const { data: selectedInvoice, isLoading: selectedInvoiceLoading } = useGetInvoice(
    selectedInvoiceId || 0,
    { query: { enabled: !!selectedInvoiceId, queryKey: getGetInvoiceQueryKey(selectedInvoiceId || 0) } }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of all processed invoices and risk assessments.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${(stats?.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Approved */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.approved ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Auto-approved</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Review Required */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Review Required</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.reviewRequired ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Pending manual review</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.rejected ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Auto-rejected</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : !invoices || invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No invoices processed yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                    >
                      <TableCell className="font-medium">{invoice.vendorName}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell><RiskBadge level={invoice.riskLevel} /></TableCell>
                      <TableCell><DecisionBadge decision={invoice.decision} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(invoice.invoiceDate), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoiceId} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoiceLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedInvoice ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedInvoice.vendorName}</h3>
                  <p className="text-sm text-muted-foreground">Invoice #{selectedInvoice.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={selectedInvoice.riskLevel} />
                  <DecisionBadge decision={selectedInvoice.decision} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Amount</p>
                  <p className="font-medium">${selectedInvoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Dates</p>
                  <p className="text-sm">Inv: {format(new Date(selectedInvoice.invoiceDate), "MMM d, yyyy")}</p>
                  <p className="text-sm">Due: {format(new Date(selectedInvoice.dueDate), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Terms</p>
                  <p className="font-medium">{selectedInvoice.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Vendor History</p>
                  <p className="font-medium capitalize">{selectedInvoice.vendorHistory.replace('-', ' ')}</p>
                </div>
              </div>

              {selectedInvoice.riskFlags && selectedInvoice.riskFlags.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-semibold mb-3 flex items-center text-foreground">
                    <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" />
                    Risk Flags
                  </p>
                  <ul className="space-y-2">
                    {selectedInvoice.riskFlags.map((flag, idx) => (
                      <li key={idx} className="text-sm flex items-start bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300 p-2.5 rounded-md border border-red-100 dark:border-red-900/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-2.5 flex-shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
