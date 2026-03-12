import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/announcements
// Admin: returns all announcements with aggregated interaction counts.
// Student: returns all announcements with current student's interaction state.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    // Fetch all announcements, descending order by creation date
    const { data: announcements, error: annError } = await supabaseAdmin
      .from("announcements")
      .select(`
        id, 
        title, 
        body, 
        priority, 
        created_at,
        created_by,
        users:created_by (name)
      `)
      .order("created_at", { ascending: false });

    if (annError) {
      throw annError;
    }

    if (role === "admin") {
      // Admins need aggregated read count and like count per announcement
      const { data: statsData, error: statsError } = await supabaseAdmin
        .from("announcement_interactions")
        .select("announcement_id, is_read, is_liked");

      if (statsError) throw statsError;

      const processedAnnouncements = announcements?.map((ann) => {
        const reactions = statsData?.filter(s => s.announcement_id === ann.id) || [];
        return {
          ...ann,
          read_count: reactions.filter(r => r.is_read).length,
          like_count: reactions.filter(r => r.is_liked).length,
        };
      });

      return NextResponse.json({ announcements: processedAnnouncements });
    } 
    
    // Students need their personal read/like states
    else if (role === "student") {
      const { data: userInteractions, error: interactionError } = await supabaseAdmin
        .from("announcement_interactions")
        .select("announcement_id, is_read, is_liked")
        .eq("student_id", userId);

      if (interactionError) throw interactionError;

      // Also get the total like count for the UI (so students can see how many others liked it)
      // Note: Getting full counts for each is possible, but the prompt just requested
      // their own like states. However, the design mentions "shows like count", so we'll 
      // grab the global like count per announcement too.
      const { data: allLikes, error: allLikesError } = await supabaseAdmin
        .from("announcement_interactions")
        .select("announcement_id")
        .eq("is_liked", true);

      if (allLikesError) throw allLikesError;

      const interactionMap = new Map(
        userInteractions?.map(interaction => [
          interaction.announcement_id, 
          interaction
        ]) || []
      );

      const likeCountMap = new Map<string, number>();
      allLikes?.forEach(r => {
        likeCountMap.set(r.announcement_id, (likeCountMap.get(r.announcement_id) || 0) + 1);
      });

      const processedAnnouncements = announcements?.map((ann) => {
        const myInt = interactionMap.get(ann.id);
        return {
          ...ann,
          is_read: myInt?.is_read || false,
          is_liked: myInt?.is_liked || false,
          like_count: likeCountMap.get(ann.id) || 0
        };
      });

      return NextResponse.json({ announcements: processedAnnouncements });
    }

    return NextResponse.json({ error: "Forbidden role" }, { status: 403 });

  } catch (error) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/announcements
// Admin only: create a new announcement
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: announcementBody, priority } = body;

    if (!title || !announcementBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: announcement, error } = await supabaseAdmin
      .from("announcements")
      .insert({
        title,
        body: announcementBody,
        priority: priority || "normal",
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
