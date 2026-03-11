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
    const { action, value } = body;

    if (!action || !['approve', 'reject', 'deactivate', 'activate', 'toggle_meals'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let updatePayload: Record<string, any> = {};

    switch (action) {
      case 'approve':
        updatePayload = { is_approved: true };
        break;
      case 'reject':
        const { error: deleteError } = await supabaseAdmin
          .from("users")
          .delete()
          .eq("id", id);
        
        if (deleteError) throw deleteError;
        
        return NextResponse.json({ message: "Student rejected and removed" });
      case 'deactivate':
        updatePayload = { is_active: false };
        break;
      case 'activate':
        updatePayload = { is_active: true };
        break;
      case 'toggle_meals':
        updatePayload = { meal_selection_enabled: value };
        break;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ message: "Student status updated", user: data });
    }

    return NextResponse.json({ error: "No changes made" }, { status: 400 });

  } catch (error) {
    console.error("Student status update error:", error);
    return NextResponse.json(
      { error: "Failed to update student status" },
      { status: 500 }
    );
  }
}
