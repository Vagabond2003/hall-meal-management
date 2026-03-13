import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface SummaryRow {
  token_number: string;
  name: string;
  meals_consumed: number;
  total_bill: number;
  payment_status: "paid" | "unpaid";
}

interface MonthlyBillSummaryProps {
  data: SummaryRow[];
  monthStr: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerBox: {
    backgroundColor: '#1A3A2A',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  headerDate: {
    color: '#C4873A',
    fontSize: 10,
  },
  table: {
    width: 'auto',
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 8,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    paddingTop: 8,
    alignItems: 'center',
  },
  colNumber: { width: '5%', textAlign: 'center' },
  colToken: { width: '15%', paddingLeft: 10 },
  colName: { width: '35%', paddingLeft: 10 },
  colMeals: { width: '15%', textAlign: 'center' },
  colBill: { width: '15%', textAlign: 'right', paddingRight: 10 },
  colStatus: { width: '15%', textAlign: 'center' },
  
  textHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  textRow: {
    fontSize: 10,
    color: '#334155',
  },
  textToken: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A3A2A',
  },
  textPaid: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  textUnpaid: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7F6F2',
    padding: 12,
    borderRadius: 8,
  },
  totalText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A3A2A',
  }
});

export const MonthlyBillSummary = ({ data, monthStr }: MonthlyBillSummaryProps) => {
  const totalStudents = data.length;
  const totalMeals = data.reduce((sum, row) => sum + row.meals_consumed, 0);
  const totalRevenue = data.reduce((sum, row) => sum + row.total_bill, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>HALL MEAL HUB</Text>
          <Text style={styles.headerSubtitle}>Monthly Bill Summary — {monthStr}</Text>
          <Text style={styles.headerDate}>Generated on: {new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', dateStyle: 'long' })}</Text>
        </View>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colNumber, styles.textHeader]}>#</Text>
            <Text style={[styles.colToken, styles.textHeader]}>Token Number</Text>
            <Text style={[styles.colName, styles.textHeader]}>Student Name</Text>
            <Text style={[styles.colMeals, styles.textHeader]}>Meals Consumed</Text>
            <Text style={[styles.colBill, styles.textHeader]}>Total Bill (Tk.)</Text>
            <Text style={[styles.colStatus, styles.textHeader]}>Status</Text>
          </View>

          {/* Table Rows */}
          {data.map((row, index) => {
            const isEven = index % 2 !== 0; // 0-indexed, so 1,3,5 are 'even' rows in visual terms
            return (
              <View key={index} style={[styles.tableRow, isEven ? { backgroundColor: '#F7F6F2' } : {}]}>
                <Text style={[styles.colNumber, styles.textRow]}>{index + 1}</Text>
                <Text style={[styles.colToken, styles.textToken]}>{row.token_number}</Text>
                <Text style={[styles.colName, styles.textRow]}>{row.name}</Text>
                <Text style={[styles.colMeals, styles.textRow]}>{row.meals_consumed}</Text>
                <Text style={[styles.colBill, styles.textRow, { fontWeight: 'bold' }]}>{row.total_bill}</Text>
                <Text style={[styles.colStatus, row.payment_status === 'paid' ? styles.textPaid : styles.textUnpaid]}>
                  {row.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer Totals */}
        <View style={styles.footer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalText}>Total Students: {totalStudents}</Text>
            <Text style={styles.totalText}>Total Meals: {totalMeals}</Text>
            <Text style={styles.totalText}>Total Revenue: Tk. {totalRevenue}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
