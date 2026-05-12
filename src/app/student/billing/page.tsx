"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Receipt, XCircle, CheckCircle, TrendingDown, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface BillingRecord {
  id: string;
  month: number;
  year: number;
  total_cost: number;
  is_paid: boolean;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function BillingSummaryPage() {
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (record: BillingRecord) => {
    setDownloadingId(record.id);
    try {
      const res = await fetch(
        `/api/student/bill-pdf?month=${record.month}&year=${record.year}`
      );
      if (!res.ok) throw new Error("Failed to fetch bill data");
      const data = await res.json();

      const monthName = MONTH_NAMES[record.month - 1];
      const monthStr = `${monthName} ${record.year}`;

      const [{ pdf }, { StudentMonthlyBill }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/pdf/StudentMonthlyBill"),
      ]);

      const blob = await pdf(
        <StudentMonthlyBill
          studentName={data.studentName}
          tokenNumber={data.tokenNumber}
          monthStr={monthStr}
          meals={data.meals}
          totalCost={data.totalCost}
          isPaid={record.is_paid}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Bill_${monthName}_${record.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
      toast.success(`Downloaded bill for ${monthStr}`);
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch("/api/student/billing");
        const data = await res.json();
        setBilling(data.billing ?? []);
      } catch {
        toast.error("Failed to load billing records");
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const totalPaid = billing.filter((b) => b.is_paid).reduce((acc, b) => acc + Number(b.total_cost), 0);
  const totalUnpaid = billing.filter((b) => !b.is_paid).reduce((acc, b) => acc + Number(b.total_cost), 0);
  const avgMonthly = billing.length > 0 ? billing.reduce((acc, b) => acc + Number(b.total_cost), 0) / billing.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Billing Summary</h1>
        <p className="mt-1 text-text-secondary text-sm">Your monthly meal costs and payment status.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-danger/8 border border-danger/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-danger" />
            <p className="text-xs font-semibold text-danger uppercase tracking-wider">Outstanding Balance</p>
          </div>
          <p className="text-3xl font-heading font-bold text-danger">৳{totalUnpaid.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-success/8 border border-success/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-success" />
            <p className="text-xs font-semibold text-success uppercase tracking-wider">Total Paid</p>
          </div>
          <p className="text-3xl font-heading font-bold text-success">৳{totalPaid.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-primary/8 border border-primary/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Avg Monthly</p>
          </div>
          <p className="text-3xl font-heading font-bold text-primary">৳{avgMonthly.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Billing Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-14 bg-surface-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : billing.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-text-secondary">
          <Receipt className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">No billing records found.</p>
          <p className="text-xs text-center max-w-xs">Billing records are generated monthly. Check back after your first complete month.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-3 min-w-[400px] bg-surface-secondary text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
            <span>Month</span>
            <span>Year</span>
            <span>Total Cost</span>
            <span className="text-right">Download</span>
          </div>
          {/* Table Rows */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {billing.map((record, i) => (
              <motion.div
                key={record.id}
                variants={rowVariants}
                className={`grid grid-cols-4 gap-4 px-6 py-4 min-w-[400px] border-b border-border/40 last:border-0 items-center text-sm hover:bg-primary-muted/30 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/30" : ""}`}
              >
                <span className="font-medium text-text-primary">{MONTH_NAMES[record.month - 1]}</span>
                <span className="text-text-secondary">{record.year}</span>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-text-primary">৳{Number(record.total_cost).toFixed(2)}</span>
                  {record.is_paid ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full w-fit">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full w-fit">
                      <XCircle className="w-3 h-3" /> Unpaid
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDownloadPDF(record)}
                    disabled={downloadingId === record.id}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark border border-primary/30 hover:bg-primary/5 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingId === record.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
