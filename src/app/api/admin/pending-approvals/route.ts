import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { count, error } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")
      .eq("is_approved", false);

    if (error) {
      console.error("Error fetching pending approvals count:", error);
      return new NextResponse("Error fetching count", { status: 500 });
    }

    const response = NextResponse.json({ pendingCount: count ?? 0 });
    response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return response;
  } catch (error) {
    console.error("Exception in pending-approvals route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
