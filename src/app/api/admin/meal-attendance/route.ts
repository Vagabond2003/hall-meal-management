import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam || new Date().toISOString().split("T")[0];

    // 1. Fetch meal selections joined with users and weekly_menus
    // Using Supabase service role client to bypass RLS
    const { data: selections, error } = await supabaseAdmin
      .from("meal_selections")
      .select(`
        id,
        users!inner (
          id,
          name,
          token_number,
          role,
          is_active
        ),
        weekly_menus!inner (
          meal_slot,
          items
        )
      `)
      .eq("date", targetDate)
      .eq("is_selected", true);

    if (error) {
      console.error("Error fetching meal attendance:", error);
      return new NextResponse("Error fetching attendance data", { status: 500 });
    }

    // 2. Filter for active students
    // We do it in JS to avoid complex Supabase syntax for joined filters,
    // though !inner combined with eq('users.role', 'student') usually works.
    const validSelections = (selections || []).filter((sel: any) => {
      const user = Array.isArray(sel.users) ? sel.users[0] : sel.users;
      return user?.role === "student" && user?.is_active === true;
    });

    // 3. Group by meal slot
    const groupedSlots: Record<string, any> = {};

    for (const sel of validSelections) {
      const menu = Array.isArray(sel.weekly_menus) ? sel.weekly_menus[0] : sel.weekly_menus;
      const user = Array.isArray(sel.users) ? sel.users[0] : sel.users;
      
      const slotName = menu?.meal_slot || "Unknown";
      const mealName = menu?.items || "No Items";
      const student = {
        id: user?.id,
        name: user?.name,
        token_number: user?.token_number,
      };

      // Create a unique key for the slot + meal
      // In case the same slot has different meals, though usually it's one meal per slot per day
      const key = `${slotName}_${mealName}`;

      if (!groupedSlots[key]) {
        groupedSlots[key] = {
          slot_name: slotName,
          meal_name: mealName,
          total_count: 0,
          students: [],
        };
      }

      groupedSlots[key].students.push(student);
      groupedSlots[key].total_count += 1;
    }

    // Sort the students alphabetically by name in each slot
    const slots = Object.values(groupedSlots).map((slot: any) => {
      slot.students.sort((a: any, b: any) => a.name.localeCompare(b.name));
      return slot;
    });

    // Sort slots (e.g. Breakfast -> Lunch -> Dinner). We'll assume a typical order.
    const slotOrder = ["Breakfast", "Lunch", "Dinner"];
    slots.sort((a, b) => {
      const idxA = slotOrder.indexOf(a.slot_name);
      const idxB = slotOrder.indexOf(b.slot_name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.slot_name.localeCompare(b.slot_name);
    });

    return NextResponse.json({
      date: targetDate,
      slots: slots,
    });
  } catch (error) {
    console.error("Exception in meal-attendance route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
