import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface MealRow {
  date: string;
  meal_slot: string;
  items: string;
  price: number;
}

interface StudentMonthlyBillProps {
  studentName: string;
  tokenNumber: string;
  monthStr: string;
  meals: MealRow[];
  totalCost: number;
  isPaid: boolean;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A3A2A' },
  subtitle: { fontSize: 12, color: '#666666', marginTop: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E4E2DA', marginVertical: 16 },
  studentBox: { backgroundColor: '#F0EFE9', padding: 14, borderRadius: 5, marginBottom: 16, borderLeft: '4 solid #1A3A2A' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#1A3A2A' },
  studentToken: { fontSize: 10, color: '#666666', marginTop: 3 },
  table: { flexDirection: 'column', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#E4E2DA' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1A3A2A' },
  tableRow: { flexDirection: 'row' },
  cell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#E4E2DA', padding: 7 },
  colDate: { width: '18%' },
  colSlot: { width: '18%' },
  colItems: { width: '44%' },
  colPrice: { width: '20%' },
  headerText: { fontSize: 9, fontWeight: 'bold', color: '#ffffff' },
  cellText: { fontSize: 9, color: '#1C1C1A' },
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBox: { backgroundColor: '#EAF2EC', padding: 12, borderRadius: 5 },
  totalLabel: { fontSize: 10, color: '#666666' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#1A3A2A', marginTop: 2 },
  statusBadge: { fontSize: 10, fontWeight: 'bold', padding: 6, borderRadius: 4 },
  paidBadge: { color: '#166534', backgroundColor: '#DCFCE7' },
  unpaidBadge: { color: '#92400E', backgroundColor: '#FEF3C7' },
  generatedAt: { fontSize: 8, color: '#999999', marginTop: 20, textAlign: 'center' },
});

export const StudentMonthlyBill = ({
  studentName, tokenNumber, monthStr, meals, totalCost, isPaid
}: StudentMonthlyBillProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>ONLINE HALL MEAL MANAGER</Text>
        <Text style={styles.subtitle}>Personal Monthly Bill — {monthStr}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.studentBox}>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.studentToken}>Token: {tokenNumber}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={[styles.cell, styles.colDate]}><Text style={styles.headerText}>Date</Text></View>
          <View style={[styles.cell, styles.colSlot]}><Text style={styles.headerText}>Meal</Text></View>
          <View style={[styles.cell, styles.colItems]}><Text style={styles.headerText}>Items</Text></View>
          <View style={[styles.cell, styles.colPrice]}><Text style={styles.headerText}>Price (Tk.)</Text></View>
        </View>
        {meals.map((m, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={[styles.cell, styles.colDate]}><Text style={styles.cellText}>{m.date}</Text></View>
            <View style={[styles.cell, styles.colSlot]}><Text style={styles.cellText}>{m.meal_slot}</Text></View>
            <View style={[styles.cell, styles.colItems]}><Text style={styles.cellText}>{m.items}</Text></View>
            <View style={[styles.cell, styles.colPrice]}><Text style={styles.cellText}>{m.price}</Text></View>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalAmount}>Tk. {totalCost.toFixed(2)}</Text>
        </View>
        <Text style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
          {isPaid ? 'PAID' : 'UNPAID'}
        </Text>
      </View>
      <Text style={styles.generatedAt}>
        Generated on {new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', dateStyle: 'long' })}
      </Text>
    </Page>
  </Document>
);
