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
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#000000',
    fontSize: 14,
    marginBottom: 4,
  },
  headerDate: {
    color: '#666666',
    fontSize: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 20,
  },
  table: {
    width: 'auto',
    flexDirection: 'column',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#000000',
  },
  tableHeader: {
    flexDirection: 'row',
  },
  tableRow: {
    flexDirection: 'row',
  },
  cellContainer: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    padding: 6,
    display: 'flex',
    justifyContent: 'center',
  },
  
  colNumber: { width: '5%' },
  colToken: { width: '15%' },
  colName: { width: '35%' },
  colMeals: { width: '15%' },
  colBill: { width: '15%' },
  colStatus: { width: '15%' },
  
  textHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'left',
  },
  textRow: {
    fontSize: 10,
    color: '#000000',
    textAlign: 'left',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  totalText: {
    fontSize: 11,
    color: '#000000',
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
        <View style={styles.divider} />

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.cellContainer, styles.colNumber]}><Text style={styles.textHeader}>#</Text></View>
            <View style={[styles.cellContainer, styles.colToken]}><Text style={styles.textHeader}>Token Number</Text></View>
            <View style={[styles.cellContainer, styles.colName]}><Text style={styles.textHeader}>Student Name</Text></View>
            <View style={[styles.cellContainer, styles.colMeals]}><Text style={styles.textHeader}>Meals Consumed</Text></View>
            <View style={[styles.cellContainer, styles.colBill]}><Text style={styles.textHeader}>Total Bill (Tk.)</Text></View>
            <View style={[styles.cellContainer, styles.colStatus]}><Text style={styles.textHeader}>Status</Text></View>
          </View>

          {/* Table Rows */}
          {data.map((row, index) => {
            return (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.cellContainer, styles.colNumber]}><Text style={styles.textRow}>{index + 1}</Text></View>
                <View style={[styles.cellContainer, styles.colToken]}><Text style={styles.textRow}>{row.token_number}</Text></View>
                <View style={[styles.cellContainer, styles.colName]}><Text style={styles.textRow}>{row.name}</Text></View>
                <View style={[styles.cellContainer, styles.colMeals]}><Text style={styles.textRow}>{row.meals_consumed}</Text></View>
                <View style={[styles.cellContainer, styles.colBill]}><Text style={styles.textRow}>{row.total_bill}</Text></View>
                <View style={[styles.cellContainer, styles.colStatus]}>
                  <Text style={[styles.textRow, row.payment_status === 'paid' ? { fontWeight: 'bold' } : {}]}>
                    {row.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer Totals */}
        <View style={styles.footer}>
          <Text style={styles.totalText}>Total Students: {totalStudents}</Text>
          <Text style={styles.totalText}>Total Meals: {totalMeals}</Text>
          <Text style={styles.totalText}>Total Revenue: Tk. {totalRevenue}</Text>
        </View>
      </Page>
    </Document>
  );
};
