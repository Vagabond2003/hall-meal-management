import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = new URL(req.url).searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'Missing date' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Step 1: Get all active meal slots ordered by display_order
  const { data: slots, error: slotsError } = await supabase
    .from('meal_slots')
    .select('id, name, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (slotsError) {
    return NextResponse.json({ error: slotsError.message }, { status: 500 })
  }

  // Step 2: Get today's selections for this student, 
  //         join weekly_menus to get the meal_slot name string.
  //         NOTE: Do NOT join meals table — FK issue. 
  //         NOTE: meal_slot is a TEXT column on weekly_menus, not an id.
  const { data: selections, error: selError } = await supabase
    .from('meal_selections')
    .select('weekly_menu_id, weekly_menus(meal_slot)')
    .eq('student_id', session.user.id)
    .eq('date', date)
    .eq('is_selected', true)

  if (selError) {
    return NextResponse.json({ error: selError.message }, { status: 500 })
  }

  // Step 3: Build a Set of active slot names from the joined data
  //         weekly_menus.meal_slot is a string like "Breakfast"
  const activeSlotNames = new Set(
    (selections ?? [])
      .map((s: any) => s.weekly_menus?.meal_slot)
      .filter(Boolean)
  )

  // Step 4: Map slots — match by name string comparison
  const result = (slots ?? []).map((slot) => ({
    id: slot.id,
    name: slot.name,
    isActive: activeSlotNames.has(slot.name),
  }))

  return NextResponse.json({ slots: result })
}
