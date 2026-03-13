import * as XLSX from 'xlsx';

interface SummaryRow {
  token_number: string;
  name: string;
  meals_consumed: number;
  total_bill: number;
  payment_status: "paid" | "unpaid";
}

export function generateExcelExport(data: SummaryRow[], monthStr: string) {
  // 1. Prepare data rows
  const excelData: any[][] = [];
  
  // Row 1: Main Title
  excelData.push(["ONLINE HALL MEAL MANAGER - Monthly Bill Summary", "", "", "", "", ""]);
  // Row 2: Month
  excelData.push([`Month: ${monthStr}`, "", "", "", "", ""]);
  // Row 3: Empty
  excelData.push(["", "", "", "", "", ""]);
  
  // Row 4: Headers
  excelData.push(["#", "Token Number", "Student Name", "Meals Consumed", "Total Bill (BDT)", "Payment Status"]);

  // Rows 5+: Data
  data.forEach((row, index) => {
    excelData.push([
      index + 1,
      row.token_number,
      row.name,
      row.meals_consumed,
      row.total_bill,
      row.payment_status === "paid" ? "Paid" : "Unpaid"
    ]);
  });

  // Calculate Totals
  const totalMeals = data.reduce((sum, row) => sum + row.meals_consumed, 0);
  const totalRevenue = data.reduce((sum, row) => sum + row.total_bill, 0);

  // Append Totals row
  excelData.push(["TOTAL", "", "", totalMeals, totalRevenue, ""]);

  // 2. Create Sheet and Workbook
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // Merge title cells
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  worksheet['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Merge row 0
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Merge row 1
    { s: { r: excelData.length - 1, c: 0 }, e: { r: excelData.length - 1, c: 2 } } // Merge total label
  );

  // Apply styling
  const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:F1");
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = worksheet[cellAddress];
      
      if (!cell) {
        worksheet[cellAddress] = { t: 's', v: "" };
        cell = worksheet[cellAddress];
      }

      // Base style: Left aligned, no background
      const style: any = {
        alignment: { horizontal: "left", vertical: "center" }
      };

      // Header row (R === 3) or Totals row (R === excelData.length - 1)
      if (R === 3 || R === excelData.length - 1) {
        style.font = { bold: true };
      }
      
      // Title rows (R === 0 or R === 1) should remain plain, but user asked for "Main Title... merged, bold, large font" although later said "keep the title rows (row 1, 2) as plain text, no styling". Wait, user prompt:
      // "Row 1: "ONLINE HALL MEAL MANAGER..." (merged, bold, large font)... Keep the title rows (row 1, 2) as plain text, no styling". I'll just add bold to Row 1 and leave Row 2 plain.
      if (R === 0) {
        style.font = { bold: true, sz: 14 };
      }

      // Add borders for headers, data rows, and totals (R >= 3)
      if (R >= 3) {
        style.border = {
          top: { style: 'thin', color: { rgb: "000000" } },
          bottom: { style: 'thin', color: { rgb: "000000" } },
          left: { style: 'thin', color: { rgb: "000000" } },
          right: { style: 'thin', color: { rgb: "000000" } }
        };
      }

      cell.s = style;
    }
  }

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },    // A: #
    { wch: 18 },   // B: Token
    { wch: 25 },   // C: Name
    { wch: 18 },   // D: Meals
    { wch: 18 },   // E: Bill
    { wch: 18 }    // F: Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${monthStr} Bill Summary`.substring(0, 31));

  // 3. Generate buffer and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = window.URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  
  const cleanMonth = monthStr.replace(/\s+/g, "_");
  link.setAttribute('download', `HallMealHub_${cleanMonth}_BillSummary.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
