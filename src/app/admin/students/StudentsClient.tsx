"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, MoreVertical, Eye, Power, CheckCircle, ShieldBan, Filter, Ban, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  name: string;
  email: string;
  rna_number: string;
  is_approved: boolean;
  is_active: boolean;
  meal_selection_enabled: boolean;
  created_at: string;
}

type FilterType = "All" | "Pending" | "Active" | "Deactivated";

export default function StudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  // Custom simple debounce implementation inline to avoid creating extra files if not needed
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/students?q=${debouncedSearchTerm}&filter=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStudents(data.students);
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStatusUpdate = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/students/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      toast.success("Student updated successfully");
      fetchStudents();
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleMealToggle = async (id: string, currentStatus: boolean) => {
    // Requires a new action in the API route, let's update it later if missing
    try {
      const res = await fetch(`/api/admin/students/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // if true, disable it. if false, enable it.
        body: JSON.stringify({ action: 'toggle_meals', value: !currentStatus })
      });
      if (!res.ok) throw new Error("Failed to toggle meal status");
      
      toast.success("Meal selection status updated");
      setStudents(prev => prev.map(s => 
        s.id === id ? { ...s, meal_selection_enabled: !currentStatus } : s
      ));
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete student");
      }
      
      toast.success("Student account deleted");
      setStudents(prev => prev.filter(s => s.id !== id));
      setStudentToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "An error occurred during deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <motion.div 
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <div>
          <h1 className="text-3xl font-heading font-semibold text-slate-900 dark:text-white">Student Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review, approve, and manage all student accounts.</p>
        </div>
      </motion.div>

      {/* Toolbar: Search and Filter */}
      <motion.div 
        className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" as const }}
      >
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white dark:bg-[#182218] dark:border-[#2A3A2B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
            placeholder="Search by name, email, or RNA number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-white dark:bg-[#182218] p-1 rounded-xl shadow-sm border border-slate-100 dark:border-[#2A3A2B] self-start sm:self-auto shrink-0 overflow-x-auto">
          {(["All", "Pending", "Active", "Deactivated"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === f 
                  ? "bg-slate-100 text-slate-900 dark:bg-[#2A3A2B] dark:text-white" 
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Table */}
      <motion.div 
        className="bg-white dark:bg-[#182218] shadow-sm rounded-2xl border border-slate-100 dark:border-[#2A3A2B] overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" as const }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-[#2A3A2B]">
            <thead className="bg-[#F0EFE9] dark:bg-[#1F2B20]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">RNA Number</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">Student Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">Status</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">Meals</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 dark:bg-[#182218] dark:divide-[#2A3A2B]">
              <AnimatePresence mode="wait">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-slate-100 dark:border-[#2A3A2B]">
                      <td colSpan={5} className="px-6 py-4">
                        <LoadingSkeleton className="h-10 w-full" />
                      </td>
                    </motion.tr>
                  ))
                ) : students.length > 0 ? (
                  students.map((student, i) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.25, delay: i * 0.08 }}
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors dark:border-[#2A3A2B] dark:hover:bg-[#1F2B20] cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-slate-500 font-medium dark:text-slate-400">
                          #{student.rna_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{student.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!student.is_approved ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50">
                            Pending
                          </span>
                        ) : student.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EAF2EC] text-[#2E7D52] border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleMealToggle(student.id, student.meal_selection_enabled)}
                          disabled={!student.is_approved}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            !student.is_approved ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            student.meal_selection_enabled ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                          role="switch"
                          aria-checked={student.meal_selection_enabled}
                        >
                          <span className="sr-only">Toggle meal selection</span>
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              student.meal_selection_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {!student.is_approved && (
                            <button 
                              onClick={() => handleStatusUpdate(student.id, 'approve')}
                              className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded-lg transition-colors tooltip tooltip-left"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {student.is_approved && student.is_active && (
                            <button 
                              onClick={() => handleStatusUpdate(student.id, 'deactivate')}
                              className="text-amber-600 hover:text-amber-900 bg-amber-50 p-1.5 rounded-lg transition-colors tooltip tooltip-left"
                              title="Deactivate"
                            >
                              <ShieldBan className="h-4 w-4" />
                            </button>
                          )}
                          {student.is_approved && !student.is_active && (
                            <button 
                              onClick={() => handleStatusUpdate(student.id, 'activate')}
                              className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded-lg transition-colors tooltip tooltip-left"
                              title="Reactivate"
                            >
                              <Power className="h-4 w-4" />
                            </button>
                          )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentToDelete(student);
                              }}
                              className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-900/30"
                              title="Delete Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <Link 
                              href={`/admin/students/${student.id}`} 
                              className="text-slate-500 hover:text-primary bg-slate-50 p-1.5 rounded-lg transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:text-primary"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">No students found</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {searchTerm ? "No students match your search criteria." : "There are currently no students in this list."}
                      </p>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent className="bg-white dark:bg-[#182218] border-slate-100 dark:border-[#2A3A2B] rounded-2xl animate-in zoom-in-95 fade-in duration-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl text-slate-900 dark:text-white">Delete Student Account</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-200">{studentToDelete?.name}</span>'s account? 
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
                if (studentToDelete) handleDeleteStudent(studentToDelete.id);
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
