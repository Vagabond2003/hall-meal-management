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
  const excelData: any[] = [];
  
  // Row 1: Main Title
  excelData.push(["HALL MEAL HUB - Monthly Bill Summary"]);
  // Row 2: Month
  excelData.push([`Month: ${monthStr}`]);
  // Row 3: Empty
  excelData.push([]);
  
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
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Merge row 0 from col 0 to 5
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }  // Merge row 1 from col 0 to 5
  );

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },    // #
    { wch: 15 },   // Token
    { wch: 30 },   // Name
    { wch: 15 },   // Meals
    { wch: 20 },   // Bill
    { wch: 15 }    // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${monthStr} Bill Summary`.substring(0, 31)); // excel sheet names limited to 31 chars

  // 3. Generate buffer and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = window.URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  
  // Add generated stamp
  const cleanMonth = monthStr.replace(/\s+/g, "_");
  link.setAttribute('download', `HallMealHub_${cleanMonth}_BillSummary.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
