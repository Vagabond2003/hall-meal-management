import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: meals, error } = await supabaseAdmin
      .from("meals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ meals: meals || [] });
  } catch (error) {
    console.error("Fetch meals error:", error);
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, meal_type, date, is_active } = body;

    if (!name || !price || !meal_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert new meal
    const { data, error } = await supabaseAdmin
      .from("meals")
      .insert([{
        name,
        description,
        price,
        meal_type,
        date: meal_type === 'special' ? date : null,
        is_active: is_active ?? true
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Meal created successfully", meal: data });
  } catch (error) {
    console.error("Create meal error:", error);
    return NextResponse.json({ error: "Failed to create meal" }, { status: 500 });
  }
}
