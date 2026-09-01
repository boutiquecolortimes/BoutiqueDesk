"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface ExportableTransaction {
  id: string;
  date: string;
  store: string;
  bookingNumber: string;
  type: string;
  method: string;
  amount: number;
  note: string;
  recordedBy: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ transactions }: { transactions: ExportableTransaction[] }) {
  function exportCsv() {
    const csv = Papa.unparse(
      transactions.map((t) => ({
        Date: formatDate(t.date),
        Store: t.store,
        Booking: t.bookingNumber,
        Type: t.type,
        Method: t.method,
        Amount: t.amount,
        Note: t.note,
        "Recorded by": t.recordedBy,
      }))
    );
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "boutiquedesk-transactions.csv");
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("BoutiqueDesk — Revenue Report", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${formatDate(new Date())}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Store", "Booking", "Type", "Method", "Amount"]],
      body: transactions.map((t) => [
        formatDate(t.date),
        t.store,
        t.bookingNumber || "—",
        t.type.replace("_", " "),
        t.method,
        formatCurrency(t.amount),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [50, 40, 30] },
    });

    doc.save("boutiquedesk-revenue-report.pdf");
  }

  if (transactions.length === 0) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={exportCsv}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium hover:bg-secondary"
      >
        <FileSpreadsheet className="size-3.5" /> CSV
      </button>
      <button
        onClick={exportPdf}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-3 text-xs font-medium hover:bg-secondary"
      >
        <Download className="size-3.5" /> PDF
      </button>
    </div>
  );
}
