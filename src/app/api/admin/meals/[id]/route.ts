import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

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
    
    // We can update various fields like is_active, name, price, etc.
    // For simplicity, we just pass the body directly to update, 
    // but in a real app we'd validate the keys.
    const allowedKeys = ['name', 'description', 'price', 'meal_type', 'date', 'is_active'];
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
      .from("meals")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Meal updated successfully", meal: data });
  } catch (error) {
    console.error("Update meal error:", error);
    return NextResponse.json({ error: "Failed to update meal" }, { status: 500 });
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

    // Usually you don't delete meals if they have selections tied to them due to foreign key constraints.
    // We should either soft-delete (is_active = false) or actually delete if it's safe.
    // The spec says "Delete meal" so we will attempt a hard delete. If it fails due to FK, we catch it.
    
    const { error } = await supabaseAdmin
      .from("meals")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json(
          { error: "Cannot delete meal because it has historical selections. Please deactivate it instead." }, 
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: "Meal deleted successfully" });
  } catch (error: any) {
    console.error("Delete meal error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete meal" }, { status: 500 });
  }
}
