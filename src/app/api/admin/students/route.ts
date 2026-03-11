import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "All";
    const query = searchParams.get("q") || "";

    let dbQuery = supabaseAdmin
      .from("users")
      .select("id, name, email, rna_number, is_approved, is_active, meal_selection_enabled, created_at")
      .eq("role", "student");

    // Apply Filter
    if (filter === "Pending") {
      dbQuery = dbQuery.eq("is_approved", false);
    } else if (filter === "Active") {
      dbQuery = dbQuery.eq("is_approved", true).eq("is_active", true);
    } else if (filter === "Deactivated") {
      dbQuery = dbQuery.eq("is_active", false);
    }

    // Apply Search
    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,rna_number.ilike.%${query}%`);
    }

    dbQuery = dbQuery.order("created_at", { ascending: false });

    const { data: students, error } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({ students: students || [] });

  } catch (error) {
    console.error("Fetch students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
