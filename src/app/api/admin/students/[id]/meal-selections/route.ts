import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateMonthlyBill } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 })
  }

  // Fetch menus for date range
  const { data: menus, error: menuError } = await supabaseAdmin
    .from('weekly_menus')
    .select('id, meal_slot, items, price, week_start_date, day_of_week')
    .eq('is_active', true)
    .order('week_start_date', { ascending: true })

  if (menuError) {
    return NextResponse.json({ error: menuError.message }, { status: 500 })
  }

  // Calculate actual date for each menu entry
  const menusWithDates = (menus ?? []).map(m => {
    const weekStart = new Date(m.week_start_date)
    const mealDate = new Date(weekStart)
    mealDate.setDate(weekStart.getDate() + m.day_of_week)
    const dateStr = mealDate.toISOString().split('T')[0]
    return { ...m, date: dateStr }
  }).filter(m => m.date >= startDate && m.date <= endDate)

  // Fetch student's selections for date range
  const { data: selections } = await supabaseAdmin
    .from('meal_selections')
    .select('weekly_menu_id')
    .eq('student_id', id)
    .eq('is_selected', true)
    .gte('date', startDate)
    .lte('date', endDate)

  const selectedIds = new Set((selections ?? []).map(s => s.weekly_menu_id))

  // Fetch meal slots for ordering
  const { data: slots } = await supabaseAdmin
    .from('meal_slots')
    .select('id, name, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return NextResponse.json({
    menus: menusWithDates,
    selectedIds: [...selectedIds],
    slots: slots ?? [],
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { weekly_menu_id, date, is_selected } = await req.json()

  if (!weekly_menu_id || !date) {
    return NextResponse.json({ error: 'weekly_menu_id and date required' }, { status: 400 })
  }

  // Get price from weekly_menus
  const { data: menu } = await supabaseAdmin
    .from('weekly_menus')
    .select('price')
    .eq('id', weekly_menu_id)
    .single()

  const price = Number(menu?.price ?? 0)

  // Check if selection exists
  const { data: existing } = await supabaseAdmin
    .from('meal_selections')
    .select('id')
    .eq('student_id', id)
    .eq('weekly_menu_id', weekly_menu_id)
    .eq('date', date)
    .maybeSingle()

  if (existing?.id) {
    await supabaseAdmin
      .from('meal_selections')
      .update({ is_selected, price })
      .eq('id', existing.id)
  } else {
    await supabaseAdmin
      .from('meal_selections')
      .insert({ student_id: id, weekly_menu_id, date, is_selected, price, meal_id: null })
  }

  // Recalculate billing
  try {
    const [yearStr, monthStr] = date.split('-')
    await calculateMonthlyBill(id, Number(monthStr), Number(yearStr))
  } catch {}

  return NextResponse.json({ success: true })
}
