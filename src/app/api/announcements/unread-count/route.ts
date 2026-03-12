import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/announcements/unread-count
// Student only: Returns the count of unread announcements matching the current user's interactions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Unread count is defined as total active announcements MINUS the announcements 
    // the user has already marked as read.
    const { count: totalAnnouncements, error: totalError } = await supabaseAdmin
      .from("announcements")
      .select("*", { head: true, count: "exact" });

    if (totalError) throw totalError;

    const { count: readAnnouncements, error: readError } = await supabaseAdmin
      .from("announcement_interactions")
      .select("*", { head: true, count: "exact" })
      .eq("student_id", session.user.id)
      .eq("is_read", true);

    if (readError) throw readError;

    const unreadCount = Math.max(0, (totalAnnouncements || 0) - (readAnnouncements || 0));

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("GET /api/announcements/unread-count error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
