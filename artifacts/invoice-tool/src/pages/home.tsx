import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useCreateInvoice, getListInvoicesQueryKey, getGetInvoiceStatsQueryKey, CreateInvoiceBodyVendorHistory, Invoice } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Receipt, Search, FileText, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { RiskBadge, DecisionBadge } from "@/components/status-badges";

const invoiceSchema = z.object({
  vendorName: z.string().min(2, "Vendor name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  vendorHistory: z.enum(["first-time", "repeat", "flagged"] as const),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function InvoiceSubmission() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<Invoice | null>(null);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      vendorName: "",
      amount: 0,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      paymentTerms: "Net 30",
      vendorHistory: "first-time",
    },
  });

  const createInvoice = useCreateInvoice();

  function onSubmit(data: InvoiceFormValues) {
    createInvoice.mutate(
      { data },
      {
        onSuccess: (invoice) => {
          setResult(invoice);
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetInvoiceStatsQueryKey() });
          toast({
            title: "Invoice submitted",
            description: "Risk assessment complete.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Submission failed",
            description: "There was an error processing the invoice.",
          });
        },
      }
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Submit Invoice</h1>
        <p className="text-muted-foreground mt-1">Submit an invoice for automated risk assessment and approval.</p>
      </div>

      <Card className="border-muted">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Invoice Details
          </CardTitle>
          <CardDescription>Enter the details from the vendor's invoice</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Amount ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                          <Input type="number" step="0.01" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="Net 30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor History</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select history" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="first-time">First-time Vendor</SelectItem>
                          <SelectItem value="repeat">Repeat Vendor (Good Standing)</SelectItem>
                          <SelectItem value="flagged">Flagged Vendor (Prior Issues)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" size="lg" disabled={createInvoice.isPending} className="min-w-32">
                  {createInvoice.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Run Assessment
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20 bg-primary/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-900 border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Decision Result</h3>
                <p className="text-sm text-muted-foreground mt-1">Invoice #{result.id} processed successfully</p>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={result.riskLevel} />
                <DecisionBadge decision={result.decision} />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Vendor</p>
                <p className="font-medium">{result.vendorName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                <p className="font-medium text-lg">${result.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Dates</p>
                <p className="font-medium text-sm">Inv: {format(new Date(result.invoiceDate), "MMM d, yyyy")}</p>
                <p className="font-medium text-sm">Due: {format(new Date(result.dueDate), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Terms</p>
                <p className="font-medium">{result.paymentTerms}</p>
              </div>
            </div>

            {result.riskFlags && result.riskFlags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-primary/10">
                <p className="text-sm font-semibold mb-3 flex items-center text-foreground">
                  <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" />
                  Risk Flags Detected
                </p>
                <ul className="space-y-2">
                  {result.riskFlags.map((flag, idx) => (
                    <li key={idx} className="text-sm flex items-start bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-md border border-primary/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2.5 flex-shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
