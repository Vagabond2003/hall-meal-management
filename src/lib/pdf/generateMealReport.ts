import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateMealReport(data: {
  date: string;
  dateFormatted: string;
  meal: string;
  mealLabel: string;
  students: { name: string; token_number: string; room_no: string }[];
  totalCount: number;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── TITLE ──────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.mealLabel} Report`, 105, 20, { align: "center" });

  // ── META ───────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(`Date: ${data.dateFormatted}`, 14, 32);
  doc.text(`Meal: ${data.mealLabel}`, 14, 38);
  doc.text(`Total Students: ${data.totalCount}`, 196, 32, { align: "right" });
  doc.text(
    `Generated: ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}`,
    196,
    38,
    { align: "right" }
  );

  // ── DIVIDER ────────────────────────────────────
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(14, 43, 196, 43);

  // ── TABLE ──────────────────────────────────────
  autoTable(doc, {
    startY: 47,
    head: [["#", "Student Name", "Token Number", "Room No."]],
    body: data.students.map((s, i) => [
      i + 1,
      s.name ?? "N/A",
      s.token_number ?? "N/A",
      s.room_no ?? "N/A",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 10,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 90 },
      2: { cellWidth: 50, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  // ── TOTAL ROW ──────────────────────────────────
  const finalY = (doc as any).lastAutoTable?.finalY ?? 200;
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.rect(14, finalY + 4, 182, 9);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Total ${data.mealLabel} Count: ${data.totalCount} students`,
    105,
    finalY + 9.5,
    { align: "center" }
  );

  // ── FOOTER ─────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text(
    "Online Hall Meal Management System — Auto-generated report",
    105,
    287,
    { align: "center" }
  );

  doc.save(`${data.meal}-report-${data.date}.pdf`);
}
