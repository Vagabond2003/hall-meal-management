"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Printer, Calendar as CalendarIcon, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Student {
  id: string;
  name: string;
  token_number: string;
}

interface Slot {
  slot_name: string;
  meal_name: string;
  total_count: number;
  students: Student[];
}

interface AttendanceData {
  date: string;
  slots: Slot[];
}

export default function MealAttendancePage() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/meal-attendance?date=${date}`);
        if (!res.ok) {
          throw new Error("Failed to fetch attendance data");
        }
        const result: AttendanceData = await res.json();
        setData(result);
      } catch (err: any) {
        console.error(err);
        setError("Could not load attendance data for the selected date.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [date]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Adjust these selectors if your actual sidebar/topbar have different classes or IDs */
          nav, header, .sidebar, .topbar {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-hide {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
        }
      `}} />
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-bold text-[#1A3A2A]">Daily Meal Attendance</h1>
            <p className="text-slate-500">View students who have selected meals for a specific date.</p>
          </div>
          
          <div className="flex items-center gap-3 print-hide">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 h-10 w-[180px]"
              />
            </div>
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="border-[#1A3A2A] text-[#1A3A2A] hover:bg-[#1A3A2A] hover:text-[#C4873A]"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print / PDF
            </Button>
          </div>
        </div>

        {/* Print Header Visible Only When Printing */}
        <div className="hidden print:block mb-8 text-center border-b pb-4">
          <h2 className="text-2xl font-bold">Hall Meal Attendance</h2>
          <p className="text-lg">Date: {format(new Date(date), "MMMM d, yyyy")}</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Loader2 className="w-10 h-10 text-[#1A3A2A] animate-spin mb-4" />
            <p className="text-slate-500">Loading attendance records...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
            {error}
          </div>
        ) : !data || data.slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-1">No Meal Data</h3>
            <p className="text-slate-500">No meal selections found for this date.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {data.slots.map((slot, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden break-inside-avoid">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-[#1A3A2A] flex items-center gap-2">
                      {slot.slot_name}
                      <span className="text-sm font-normal text-slate-500">
                        • {slot.meal_name}
                      </span>
                    </h2>
                  </div>
                  <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 border border-amber-200">
                    <Users className="w-4 h-4" />
                    {slot.total_count} {slot.total_count === 1 ? "student" : "students"}
                  </div>
                </div>

                <div className="p-0 overflow-x-auto">
                  {slot.students.length > 0 ? (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white border-b border-slate-100 text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold w-32">Token Number</th>
                          <th className="px-6 py-3 font-semibold">Student Name</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {slot.students.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3 font-mono font-medium text-slate-700">
                              {student.token_number}
                            </td>
                            <td className="px-6 py-3 text-slate-900 font-medium">
                              {student.name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic">
                      No students selected this meal
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
