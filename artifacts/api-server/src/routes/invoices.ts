import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, invoicesTable } from "@workspace/db";
import {
  CreateInvoiceBody,
  GetInvoiceParams,
  ListInvoicesResponse,
  GetInvoiceResponse,
  GetInvoiceStatsResponse,
} from "@workspace/api-zod";
import { scoreInvoice } from "../lib/riskScoring";

const router: IRouter = Router();

function formatInvoice(row: typeof invoicesTable.$inferSelect) {
  return {
    ...row,
    amount: parseFloat(row.amount as unknown as string),
    riskFlags: Array.isArray(row.riskFlags)
      ? row.riskFlags
      : JSON.parse(row.riskFlags as unknown as string),
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt,
  };
}

router.get("/invoices/stats", async (req, res): Promise<void> => {
  const rows = await db.select().from(invoicesTable);

  const total = rows.length;
  const approved = rows.filter((r) => r.decision === "Approved").length;
  const rejected = rows.filter((r) => r.decision === "Rejected").length;
  const reviewRequired = rows.filter(
    (r) => r.decision === "Review Required",
  ).length;
  const totalAmount = rows.reduce(
    (sum, r) => sum + parseFloat(r.amount as unknown as string),
    0,
  );
  const highRiskCount = rows.filter((r) => r.riskLevel === "High").length;
  const mediumRiskCount = rows.filter((r) => r.riskLevel === "Medium").length;
  const lowRiskCount = rows.filter((r) => r.riskLevel === "Low").length;

  const stats = GetInvoiceStatsResponse.parse({
    total,
    approved,
    rejected,
    reviewRequired,
    totalAmount,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
  });

  res.json(stats);
});

router.get("/invoices", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(invoicesTable)
    .orderBy(desc(invoicesTable.createdAt));

  res.json(ListInvoicesResponse.parse(rows.map(formatInvoice)));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { vendorName, amount, invoiceDate, dueDate, paymentTerms, vendorHistory } =
    parsed.data;

  const numericAmount = Number(amount);
  const { riskLevel, decision, riskFlags } = scoreInvoice({
    amount: numericAmount,
    dueDate,
    vendorHistory: vendorHistory as "first-time" | "repeat" | "flagged",
  });

  const [row] = await db
    .insert(invoicesTable)
    .values({
      vendorName,
      amount: numericAmount.toFixed(2) as unknown as number,
      invoiceDate,
      dueDate,
      paymentTerms,
      vendorHistory,
      riskLevel,
      decision,
      riskFlags,
    })
    .returning();

  res.status(201).json(GetInvoiceResponse.parse(formatInvoice(row)));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetInvoiceParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(GetInvoiceResponse.parse(formatInvoice(row)));
});

export default router;
