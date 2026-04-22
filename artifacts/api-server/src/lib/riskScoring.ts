export type VendorHistory = "first-time" | "repeat" | "flagged";
export type RiskLevel = "Low" | "Medium" | "High";
export type Decision = "Approved" | "Rejected" | "Review Required";

export interface RiskResult {
  riskLevel: RiskLevel;
  decision: Decision;
  riskFlags: string[];
}

export function scoreInvoice(params: {
  amount: number;
  dueDate: string;
  vendorHistory: VendorHistory;
}): RiskResult {
  const { amount, dueDate, vendorHistory } = params;
  const flags: string[] = [];

  if (vendorHistory === "flagged") {
    return {
      riskLevel: "High",
      decision: "Rejected",
      riskFlags: ["Vendor is flagged — auto-rejected"],
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  let riskScore = 0;

  if (amount > 500000) {
    riskScore += 2;
    flags.push(`Invoice amount ($${amount.toLocaleString()}) exceeds $500,000 threshold`);
  }

  if (daysUntilDue < 7) {
    riskScore += 1;
    if (daysUntilDue < 0) {
      flags.push(`Invoice is overdue by ${Math.abs(daysUntilDue)} day(s)`);
    } else if (daysUntilDue === 0) {
      flags.push("Invoice is due today");
    } else {
      flags.push(`Invoice due in ${daysUntilDue} day(s) — urgent`);
    }
  }

  if (vendorHistory === "first-time") {
    riskScore += 1;
    flags.push("First-time vendor — additional review recommended");
  }

  let riskLevel: RiskLevel;
  let decision: Decision;

  if (riskScore >= 2) {
    riskLevel = "High";
    decision = "Review Required";
  } else if (riskScore === 1) {
    riskLevel = "Medium";
    decision = "Review Required";
  } else {
    riskLevel = "Low";
    decision = "Approved";
  }

  if (flags.length === 0) {
    flags.push("All checks passed");
  }

  return { riskLevel, decision, riskFlags: flags };
}
