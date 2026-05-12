"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldBan, 
  Power, 
  FileText, 
  Loader2,
  CalendarDays,
  CreditCard,
  Ban,
  Utensils,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit
} from "lucide-react";
import { addDays, startOfDay } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRoomDisplay } from "@/lib/utils";
import { parseOptionalRoomNumber } from "@/lib/roomNumber";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  name: string;
  email: string;
  token_number: string;
  room_number: string | null;
  is_approved: boolean;
  is_active: boolean;
  meal_selection_enabled: boolean;
  created_at: string;
}

interface Selection {
  id: string;
  date: string;
  meal_name: string;
  items: string;
  cost: number;
}

interface Billing {
  id: string;
  month: number;
  year: number;
  total_cost: number;
  is_paid: boolean;
}

interface StudentDetailClientProps {
  initialStudent: Student;
}

type TabType = 'selections' | 'history' | 'billing' | 'report' | 'edit_selections';

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, backgroundColor: '#1A3A2A', padding: 20, borderRadius: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 12, color: '#A3B8AD', marginTop: 5 },
  headerDate: { fontSize: 10, color: '#A3B8AD' },
  studentInfo: { marginBottom: 20, backgroundColor: '#F0EFE9', padding: 15, borderRadius: 5, borderLeft: '4 solid #2E7D52' },
  infoLabel: { fontSize: 10, color: '#6B6B63', marginBottom: 3 },
  infoValue: { fontSize: 14, color: '#1C1C1A', fontWeight: 'bold' },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#EAF2EC', padding: 15, borderRadius: 5 },
  summaryLabel: { fontSize: 10, color: '#2E7D52', marginBottom: 3 },
  summaryValue: { fontSize: 16, color: '#1A3A2A', fontWeight: 'bold' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#E4E2DA', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#E4E2DA', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#1A3A2A' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#E4E2DA', borderLeftWidth: 0, borderTopWidth: 0 },
  tableCellHeader: { margin: 5, fontSize: 10, fontWeight: 'bold', color: 'white' },
  tableCell: { margin: 5, fontSize: 10, color: '#1C1C1A' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 10, color: '#AEADA5' }
});

const MonthlyReportPDF = ({ student, selections, month, year, billingRecord }: { student: Student, selections: Selection[], month: number, year: number, billingRecord?: Billing }) => {
  const totalCost = selections.reduce((sum, s) => sum + Number(s.cost), 0);
  const monthName = MONTH_NAMES[month - 1];
  const joinedYear = new Date(student.created_at).getFullYear();
  const formatRna = (rna: string) => rna?.toUpperCase().startsWith('Token') ? rna : `Token-${joinedYear}-${rna}`;
  const rnaDisplay = formatRna(student.token_number);
  
  // If no record exists yet, it's unpaid by definition
  const paymentStatus = billingRecord ? (billingRecord.is_paid ? 'Paid' : 'Unpaid') : 'Unpaid';

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.title}>Online Hall Meal Management System</Text>
            <Text style={pdfStyles.subtitle}>Monthly Meal Statement</Text>
          </View>
          <Text style={pdfStyles.headerDate}>{format(new Date(), "MMM d, yyyy")}</Text>
        </View>

        <View style={pdfStyles.studentInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={pdfStyles.infoLabel}>STUDENT NAME</Text>
              <Text style={pdfStyles.infoValue}>{student.name}</Text>
            </View>
            <View>
              <Text style={pdfStyles.infoLabel}>Token NUMBER</Text>
              <Text style={pdfStyles.infoValue}>{rnaDisplay}</Text>
            </View>
            <View>
              <Text style={pdfStyles.infoLabel}>BILLING PERIOD</Text>
              <Text style={pdfStyles.infoValue}>{monthName} {year}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.summaryBox}>
          <View>
            <Text style={pdfStyles.summaryLabel}>TOTAL MEALS</Text>
            <Text style={pdfStyles.summaryValue}>{selections.length}</Text>
          </View>
          <View>
             <Text style={pdfStyles.summaryLabel}>TOTAL COST</Text>
             <Text style={pdfStyles.summaryValue}>BDT {totalCost}</Text>
          </View>
          <View>
             <Text style={pdfStyles.summaryLabel}>PAYMENT STATUS</Text>
             <Text style={pdfStyles.summaryValue}>{paymentStatus}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableCellHeader}>Date</Text></View>
            <View style={pdfStyles.tableColHeader}><Text style={pdfStyles.tableCellHeader}>Meal Type</Text></View>
            <View style={{...pdfStyles.tableColHeader, width: '35%'}}><Text style={pdfStyles.tableCellHeader}>Items</Text></View>
            <View style={{...pdfStyles.tableColHeader, width: '15%'}}><Text style={pdfStyles.tableCellHeader}>Cost</Text></View>
          </View>
          {selections.map(s => (
            <View style={pdfStyles.tableRow} key={s.id}>
              <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{format(new Date(s.date), "MMM d, yyyy")}</Text></View>
              <View style={pdfStyles.tableCol}><Text style={pdfStyles.tableCell}>{s.meal_name}</Text></View>
              <View style={{...pdfStyles.tableCol, width: '35%'}}><Text style={pdfStyles.tableCell}>{s.items || '-'}</Text></View>
              <View style={{...pdfStyles.tableCol, width: '15%'}}><Text style={pdfStyles.tableCell}>BDT {s.cost}</Text></View>
            </View>
          ))}
          <View style={pdfStyles.tableRow}>
            <Text style={{ margin: 5, fontSize: 12, fontWeight: 'bold', color: '#1A3A2A', width: '85%', textAlign: 'right', paddingRight: 10 }}>Total Amount:</Text>
            <View style={{...pdfStyles.tableCol, width: '15%', backgroundColor: '#2E7D52'}}><Text style={{ margin: 5, fontSize: 12, fontWeight: 'bold', color: 'white' }}>BDT {totalCost}</Text></View>
          </View>
        </View>

        <Text style={pdfStyles.footer} fixed>Generated by Online Hall Meal Management System — Confidential</Text>
      </Page>
    </Document>
  );
};


export default function StudentDetailClient({ initialStudent }: StudentDetailClientProps) {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [roomInput, setRoomInput] = useState(initialStudent.room_number ?? "");
  const [savingRoom, setSavingRoom] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  
  const [selections, setSelections] = useState<Selection[]>([]);
  const [billing, setBilling] = useState<Billing[]>([]);
  const [todaySelections, setTodaySelections] = useState<Selection[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  // Filters for History Tab
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Edit Selections State
  const [editWeekOffset, setEditWeekOffset] = useState(0);
  const [editMenus, setEditMenus] = useState<{
    id: string; date: string; meal_slot: string; 
    items: string; price: number
  }[]>([]);
  const [editSelectedIds, setEditSelectedIds] = useState<Set<string>>(new Set());
  const [editSlots, setEditSlots] = useState<{
    id: string; name: string; display_order: number
  }[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [togglingCell, setTogglingCell] = useState<string | null>(null);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const fetchEditSelections = async (offset: number) => {
    setEditLoading(true);
    try {
      const base = addDays(startOfDay(new Date()), offset * 7);
      const startDate = fmt(base);
      const endDate = fmt(addDays(base, 6));
      const res = await fetch(
        `/api/admin/students/${student.id}/meal-selections?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEditMenus(data.menus ?? []);
      setEditSelectedIds(new Set(data.selectedIds ?? []));
      setEditSlots(data.slots ?? []);
    } catch {
      toast.error("Failed to load meal selections");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'edit_selections') {
      fetchEditSelections(editWeekOffset);
    }
  }, [activeTab, editWeekOffset]);

  const handleEditToggle = async (menu: { id: string; date: string; price: number }) => {
    if (togglingCell === menu.id) return;
    const isCurrentlySelected = editSelectedIds.has(menu.id);
    setTogglingCell(menu.id);
    
    // Optimistic update
    setEditSelectedIds(prev => {
      const next = new Set(prev);
      isCurrentlySelected ? next.delete(menu.id) : next.add(menu.id);
      return next;
    });

    try {
      const res = await fetch(
        `/api/admin/students/${student.id}/meal-selections`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekly_menu_id: menu.id,
            date: menu.date,
            is_selected: !isCurrentlySelected,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      toast.success(
        !isCurrentlySelected
          ? "Meal selected for student"
          : "Meal deselected for student"
      );
    } catch {
      // Revert
      setEditSelectedIds(prev => {
        const next = new Set(prev);
        isCurrentlySelected ? next.add(menu.id) : next.delete(menu.id);
        return next;
      });
      toast.error("Failed to update selection");
    } finally {
      setTogglingCell(null);
    }
  };

  useEffect(() => {
    setRoomInput(student.room_number ?? "");
  }, [student.room_number]);

  const fetchDetails = useCallback(async () => {
    try {
      setLoadingContext(true);
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await fetch(`/api/admin/students/${student.id}/details?month=${selectedMonth}&year=${selectedYear}&date=${dateStr}`);
      if (!res.ok) throw new Error("Failed to load details");
      const data = await res.json();
      setSelections(data.selections);
      setBilling(data.billing);
      setTodaySelections(data.todaySelections || []);
    } catch (err) {
      toast.error("Could not fetch student details");
    } finally {
      setLoadingContext(false);
    }
  }, [student.id, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStatusUpdate = async (action: string, value?: boolean) => {
    try {
      const res = await fetch(`/api/admin/students/${student.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value })
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      const { user } = await res.json();
      // user might be undefined if rejected/deleted
      if (action === 'reject') {
        window.location.href = '/admin/students';
      } else if (user) {
        setStudent(user);
        toast.success("Student updated successfully");
      }
    } catch {
      toast.error("Status update failed");
    }
  };

  const handleBillingToggle = async (billingId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/billing/${billingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_paid: !currentStatus })
      });
      if (!res.ok) throw new Error("Failed to update billing");
      
      toast.success("Billing status updated");
      setBilling(prev => prev.map(b => b.id === billingId ? { ...b, is_paid: !currentStatus } : b));
    } catch {
      toast.error("Failed to update billing");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete student");
      }
      toast.success("Student account deleted");
      router.push("/admin/students");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveRoom = async () => {
    const parsed = parseOptionalRoomNumber(roomInput);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    try {
      setSavingRoom(true);
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_number: roomInput.trim() === "" ? null : roomInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update room");
      setStudent(data.student);
      toast.success("Room number updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update room");
    } finally {
      setSavingRoom(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header (Back button + Title) */}
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <Link href="/admin/students" className="p-2 rounded-full hover:bg-slate-100 transition-colors dark:hover:bg-[#182218]">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 dark:text-white">Student Profile</h1>
        </div>
      </motion.div>

      {/* Top Profile Card */}
      <motion.div 
        className="bg-white dark:bg-[#182218] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#2A3A2B] flex flex-col md:flex-row justify-between gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" as const }}
      >
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-heading font-bold shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 flex items-center gap-3">
              {student.name}
              {!student.is_approved ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>
              ) : student.is_active ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF2EC] text-[#2E7D52] border border-green-200 dark:bg-green-900/30 dark:text-green-400">Active</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">Deactivated</span>
              )}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5"><strong className="text-slate-700 dark:text-slate-300">Token:</strong> #{student.token_number}</span>
              <span className="flex items-center gap-1.5"><strong className="text-slate-700 dark:text-slate-300">Room:</strong> {formatRoomDisplay(student.room_number)}</span>
              <span className="flex items-center gap-1.5"><strong className="text-slate-700 dark:text-slate-300">Email:</strong> {student.email}</span>
              <span className="flex items-center gap-1.5"><strong className="text-slate-700 dark:text-slate-300">Joined:</strong> <span suppressHydrationWarning>{format(new Date(student.created_at), "MMM d, yyyy")}</span></span>
            </div>

            <div className="mt-4 w-full max-w-md">
              <label htmlFor="admin-student-room" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Assign or edit room number
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  id="admin-student-room"
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  maxLength={20}
                  placeholder="e.g. 201-A"
                  className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-slate-200 dark:border-[#2A3A2B] rounded-lg bg-white dark:bg-[#182218] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveRoom();
                  }}
                  disabled={savingRoom}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {savingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save room
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Leave empty and save to clear. Letters, numbers, spaces, hyphens only (1–20 characters).</p>
            </div>
            
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Meal Selection:</span>
              <button
                onClick={() => handleStatusUpdate('toggle_meals', !student.meal_selection_enabled)}
                disabled={!student.is_approved}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${!student.is_approved ? 'opacity-50 cursor-not-allowed' : ''} ${student.meal_selection_enabled ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${student.meal_selection_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 md:min-w-[160px]">
          {!student.is_approved && (
            <>
              <button onClick={() => handleStatusUpdate('approve')} className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium text-sm text-center">
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => handleStatusUpdate('reject')} className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition font-medium text-sm text-center dark:border-red-900/50 dark:hover:bg-red-900/20">
                <Ban className="h-4 w-4" /> Reject
              </button>
            </>
          )}
          {student.is_approved && student.is_active && (
            <button onClick={() => handleStatusUpdate('deactivate')} className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium text-sm text-center dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/30">
              <ShieldBan className="h-4 w-4" /> Deactivate
            </button>
          )}
          {student.is_approved && !student.is_active && (
            <button onClick={() => handleStatusUpdate('activate')} className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition font-medium text-sm text-center border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">
              <Power className="h-4 w-4" /> Reactivate
            </button>
          )}

          <button 
            onClick={() => setShowDeleteDialog(true)} 
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition font-medium text-sm text-center dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <Trash2 className="h-4 w-4" /> Delete Account
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        className="bg-white dark:bg-[#182218] rounded-2xl shadow-sm border border-slate-100 dark:border-[#2A3A2B] overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" as const }}
      >
        <div className="flex border-b border-slate-100 dark:border-[#2A3A2B] overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('selections')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'selections' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <Utensils className="h-4 w-4" /> Current Selections
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <CalendarDays className="h-4 w-4" /> Meal History
          </button>
          <button onClick={() => setActiveTab('billing')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'billing' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <CreditCard className="h-4 w-4" /> Billing Status
          </button>
          <button onClick={() => setActiveTab('report')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'report' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <FileText className="h-4 w-4" /> PDF Report
          </button>
          <button onClick={() => setActiveTab('edit_selections')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'edit_selections' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <Edit className="h-4 w-4" /> Edit Selections
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'selections' && (
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Today's Meals</h3>
              {loadingContext ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => <LoadingSkeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : todaySelections.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {todaySelections.map(s => (
                    <div key={s.id} className="border border-slate-200 dark:border-[#2A3A2B] rounded-xl p-4 flex flex-col justify-between bg-white dark:bg-[#182218] hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Utensils className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{s.meal_name}</p>
                          <p className="text-xl font-bold text-primary dark:text-white mt-0.5">৳{s.cost}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{s.items || 'No desc'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 dark:bg-[#1F2B20]/50 dark:border-[#2A3A2B]">
                  No active selections for today.
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">Monthly Selections</h3>
                <div className="flex gap-2">
                  <select 
                    suppressHydrationWarning
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm dark:bg-[#1F2B20] dark:border-[#2A3A2B] focus:ring-primary focus:border-primary outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                    ))}
                  </select>
                  <select 
                    suppressHydrationWarning
                    value={selectedYear} 
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm dark:bg-[#1F2B20] dark:border-[#2A3A2B] focus:ring-primary focus:border-primary outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingContext ? (
                <div className="space-y-3">
                  <LoadingSkeleton className="h-12 w-full rounded-t-xl" />
                  {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : selections.length > 0 ? (
                <div className="border border-slate-100 dark:border-[#2A3A2B] rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2A3A2B]">
                    <thead className="bg-[#F0EFE9] dark:bg-[#1F2B20]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Meal</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A2B]">
                      {selections.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#1F2B20]">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{format(new Date(s.date), "MMM d, yyyy")}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{s.meal_name}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 text-right">৳{s.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 dark:bg-[#1F2B20]/50 dark:border-[#2A3A2B]">
                  No meals recorded for this month.
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Billing History</h3>
              {loadingContext ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => <LoadingSkeleton key={i} className="h-[120px] w-full" />)}
                </div>
              ) : billing.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {billing.map(record => (
                    <div key={record.id} className="border border-slate-200 dark:border-[#2A3A2B] rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {MONTH_NAMES[record.month - 1]} {record.year}
                          </p>
                          <p className="text-2xl font-bold mt-1 text-primary dark:text-white">৳{record.total_cost}</p>
                        </div>
                        {record.is_paid ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Paid</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Unpaid</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleBillingToggle(record.id, record.is_paid)}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                          record.is_paid 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {record.is_paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 dark:bg-[#1F2B20]/50 dark:border-[#2A3A2B]">
                  No billing records generated yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-6">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">Generate Statement (PDF)</h3>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg items-end">
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Month</label>
                  <select 
                    suppressHydrationWarning
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm dark:bg-[#1F2B20] dark:border-[#2A3A2B] focus:ring-primary focus:border-primary outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Year</label>
                  <select 
                    suppressHydrationWarning
                    value={selectedYear} 
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm dark:bg-[#1F2B20] dark:border-[#2A3A2B] focus:ring-primary focus:border-primary outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {typeof window !== 'undefined' && selections.length > 0 && (
                  <PDFDownloadLink
                    document={<MonthlyReportPDF student={student} selections={selections} month={selectedMonth} year={selectedYear} billingRecord={billing.find(b => b.month === selectedMonth && b.year === selectedYear)} />}
                    fileName={`Statement_${student.name.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.pdf`}
                    className="w-full sm:w-auto shrink-0 py-2.5 flex items-center justify-center px-4 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors font-medium text-sm"
                  >
                    {({ loading }: { loading: boolean }) => loading ? 'Preparing PDF...' : 'Download Statement'}
                  </PDFDownloadLink>
                )}
              </div>

              {!loadingContext && selections.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex gap-3 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400">
                  <Ban className="h-5 w-5 shrink-0" />
                  <p>Cannot generate report for {MONTH_NAMES[selectedMonth - 1]} because there are no meal records.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'edit_selections' && (
            <div className="space-y-4">
              {/* Week navigation */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1F2B20] rounded-xl px-4 py-3 border border-slate-100 dark:border-[#2A3A2B]">
                <button
                  onClick={() => setEditWeekOffset(prev => prev - 1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous week
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {format(addDays(startOfDay(new Date()), editWeekOffset * 7), "MMM d")} –{" "}
                    {format(addDays(startOfDay(new Date()), editWeekOffset * 7 + 6), "MMM d, yyyy")}
                  </span>
                  {editWeekOffset !== 0 && (
                    <button
                      onClick={() => setEditWeekOffset(0)}
                      className="text-xs text-primary hover:underline mt-0.5"
                    >
                      Back to current week
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setEditWeekOffset(prev => prev + 1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                >
                  Next week <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Warning banner */}
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                <Edit className="w-4 h-4 shrink-0" />
                <span>Admin override — deadline and meal restrictions are bypassed for this student.</span>
              </div>

              {/* Meal table */}
              {editLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-[#1F2B20] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-[#2A3A2B] rounded-xl overflow-hidden overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-[#1A3A2A]">
                        <th className="py-3 px-4 text-[#C4873A] text-xs font-medium uppercase tracking-wider border-r border-[#153022] w-[130px]">
                          Day
                        </th>
                        {editSlots.map(slot => (
                          <th key={slot.id} className="py-3 px-4 text-[#C4873A] text-xs font-medium uppercase tracking-wider border-r border-[#153022] last:border-r-0 min-w-[160px]">
                            {slot.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2A3A2B]">
                      {Array.from({ length: 7 }, (_, i) => {
                        const dayDate = addDays(
                          startOfDay(new Date()),
                          editWeekOffset * 7 + i
                        );
                        const dateStr = fmt(dayDate);
                        const isToday = fmt(startOfDay(new Date())) === dateStr;

                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#1F2B20]">
                            <td className="py-3 px-4 border-r border-slate-100 dark:border-[#2A3A2B] align-top">
                              <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                                {format(dayDate, "EEEE")}
                                {isToday && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold">
                                    Today
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {format(dayDate, "MMM d")}
                              </div>
                            </td>
                            {editSlots.map(slot => {
                              const menu = editMenus.find(
                                m => m.date === dateStr && m.meal_slot === slot.name
                              );
                              if (!menu) {
                                return (
                                  <td key={slot.id} className="py-3 px-4 border-r border-slate-100 dark:border-[#2A3A2B] last:border-r-0 text-center align-middle">
                                    <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                                  </td>
                                );
                              }
                              const selected = editSelectedIds.has(menu.id);
                              const isToggling = togglingCell === menu.id;

                              return (
                                <td
                                  key={slot.id}
                                  className={`py-3 px-4 border-r border-slate-100 dark:border-[#2A3A2B] last:border-r-0 align-top transition-colors ${
                                    selected ? 'bg-green-50 dark:bg-green-900/10' : ''
                                  }`}
                                >
                                  <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                    {menu.items}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                      ৳{menu.price}
                                    </span>
                                    <button
                                      onClick={() => handleEditToggle(menu)}
                                      disabled={isToggling}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                        selected ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                          selected ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-[#182218] border-slate-100 dark:border-[#2A3A2B] rounded-2xl animate-in zoom-in-95 fade-in duration-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl text-slate-900 dark:text-white">Delete Student Account</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-200">{student.name}</span>'s account? 
              This action cannot be undone. Their meal history and billing records will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-slate-100 text-slate-900 dark:bg-[#2A3A2B] dark:text-white border-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-6 h-11">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 border-0 rounded-xl px-6 h-11 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
