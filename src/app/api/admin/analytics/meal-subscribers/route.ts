import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMealSubscribers } from "@/lib/analytics/getMealSubscribers";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  if (!monthParam || !yearParam) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  const targetMonth = parseInt(monthParam, 10);
  const targetYear = parseInt(yearParam, 10);

  if (
    isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12 ||
    isNaN(targetYear) || targetYear < 2020 || targetYear > 2100
  ) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  try {
    const data = await getMealSubscribers(targetMonth, targetYear);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch meal subscribers" },
      { status: 500 }
    );
  }
}
