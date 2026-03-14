import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: codes, error } = await supabaseAdmin
      .from("invite_codes")
      .select(`
        id,
        code,
        is_used,
        expires_at,
        created_at,
        used_by
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch invite codes:", error);
      return NextResponse.json(
        { message: "Failed to fetch invite codes" },
        { status: 500 }
      );
    }

    // Fetch user names for used codes
    const usedByIds = codes
      ?.filter((c) => c.used_by)
      .map((c) => c.used_by) || [];

    let userMap: Record<string, string> = {};
    if (usedByIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, name")
        .in("id", usedByIds);

      if (users) {
        userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
      }
    }

    const now = new Date();
    const enrichedCodes = codes?.map((code) => {
      let status: "available" | "used" | "expired";
      if (code.is_used) {
        status = "used";
      } else if (new Date(code.expires_at) < now) {
        status = "expired";
      } else {
        status = "available";
      }

      return {
        ...code,
        status,
        used_by_name: code.used_by ? (userMap[code.used_by] || "Unknown") : null,
      };
    }) || [];

    // Sort: available first, then used, then expired
    const sortOrder = { available: 0, used: 1, expired: 2 };
    enrichedCodes.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);

    // Compute stats
    const stats = {
      total: enrichedCodes.length,
      available: enrichedCodes.filter((c) => c.status === "available").length,
      used: enrichedCodes.filter((c) => c.status === "used").length,
      expired: enrichedCodes.filter((c) => c.status === "expired").length,
    };

    return NextResponse.json({ codes: enrichedCodes, stats });
  } catch (error) {
    console.error("Invite codes error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
