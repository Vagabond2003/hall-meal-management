import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { from_date, action } = await req.json()

  if (!from_date || !action || !["on", "off"].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const studentId = session.user.id

  if (action === "off") {
    // Delete all selections for this student from from_date onwards
    const { error } = await supabase
      .from('meal_selections')
      .delete()
      .eq('student_id', studentId)
      .gte('date', from_date)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: "off" })
  }

  if (action === "on") {
    // Find all weekly_menu entries from from_date onwards that are active
    // These are the available meals the student can be opted into
    
    // Ensure we start checking from the beginning of the week that the from_date falls into
    // Because week_start_date is Sunday, and from_date could be Wednesday.
    const fromDateObj = new Date(from_date);
    const dayOfWeek = fromDateObj.getDay(); 
    const weekStartObj = new Date(fromDateObj);
    weekStartObj.setDate(fromDateObj.getDate() - dayOfWeek);
    const weekStartStr = weekStartObj.toISOString().split('T')[0];

    const { data: availableMenus, error: menuError } = await supabase
      .from('weekly_menus')
      .select('id, price')
      .eq('is_active', true)
      .gte('week_start_date', weekStartStr)

    if (menuError) {
      return NextResponse.json({ error: menuError.message }, { status: 500 })
    }

    if (!availableMenus || availableMenus.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 })
    }

    // Find which menus already have a selection for this student
    const { data: existingSelections, error: selError } = await supabase
      .from('meal_selections')
      .select('weekly_menu_id')
      .eq('student_id', studentId)
      .in('weekly_menu_id', availableMenus.map(m => m.id))

    if (selError) {
      return NextResponse.json({ error: selError.message }, { status: 500 })
    }

    const existingIds = new Set(
      (existingSelections ?? []).map((s: any) => s.weekly_menu_id)
    )

    // Only insert for menus that don't already have a selection
    // We also need the date for each menu entry
    const { data: fullMenus, error: fullMenuError } = await supabase
      .from('weekly_menus')
      .select('id, price, week_start_date, day_of_week')
      .eq('is_active', true)
      .gte('week_start_date', weekStartStr)

    if (fullMenuError) {
      return NextResponse.json({ error: fullMenuError.message }, { status: 500 })
    }

    // Calculate the actual date for each menu entry
    // day_of_week: 0=Sun,1=Mon,...,6=Sat (confirm this matches your data)
    // week_start_date is the Sunday of that week
    const toInsert = (fullMenus ?? [])
      .filter(m => !existingIds.has(m.id))
      .map(m => {
        const weekStart = new Date(m.week_start_date)
        const mealDate = new Date(weekStart)
        mealDate.setDate(weekStart.getDate() + m.day_of_week)
        const dateStr = mealDate.toISOString().split('T')[0]
        return {
          student_id: studentId,
          weekly_menu_id: m.id,
          meal_id: null,
          date: dateStr,
          is_selected: true,
          price: m.price,
        }
      })
      .filter(entry => entry.date >= from_date)

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('meal_selections')
        .insert(toInsert)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, inserted: toInsert.length })
  }
}
