import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: student, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, token_number, is_approved, is_active, meal_selection_enabled, created_at")
      .eq("id", id)
      .eq("role", "student")
      .single();

    if (error) throw error;

    return NextResponse.json({ student });
  } catch (error) {
    console.error("Fetch student details error:", error);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const allowedKeys = ['name', 'token_number', 'is_approved', 'is_active', 'meal_selection_enabled'];
    const updatePayload: Record<string, any> = {};

    Object.keys(body).forEach(key => {
      if (allowedKeys.includes(key)) {
        updatePayload[key] = body[key];
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .eq("role", "student")
      .select("id, name, email, token_number, is_approved, is_active, meal_selection_enabled, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Student updated successfully", student: data });
  } catch (error) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "student");

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { error: "Cannot delete student because they have historical meal or billing records. Please deactivate them instead." },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete student" }, { status: 500 });
  }
}
