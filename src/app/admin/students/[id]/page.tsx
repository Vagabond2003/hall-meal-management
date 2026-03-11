import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import StudentDetailClient from "./StudentDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  // Fetch the student profile
  const { data: student, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, rna_number, is_approved, is_active, meal_selection_enabled, created_at")
    .eq("id", id)
    .eq("role", "student")
    .single();

  if (error || !student) {
    notFound();
  }

  // We could fetch their historical data here, or do it on the client component
  // Since it's tabbed, client component fetching is cleaner and faster for initial load
  
  return (
    <div className="mx-auto max-w-7xl">
      <StudentDetailClient initialStudent={student} />
    </div>
  );
}
