import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  if (!month || !year) {
    return NextResponse.json({ error: 'month and year required' }, { status: 400 })
  }

  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`

  // Fetch selections with weekly_menus joined
  const { data: selections, error } = await supabaseAdmin
    .from('meal_selections')
    .select('date, price, weekly_menu_id, weekly_menus(meal_slot, items)')
    .eq('student_id', session.user.id)
    .eq('is_selected', true)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const meals = (selections ?? []).map((s: any) => ({
    date: s.date,
    meal_slot: s.weekly_menus?.meal_slot ?? '—',
    items: s.weekly_menus?.items ?? '—',
    price: Number(s.price ?? s.weekly_menus?.price ?? 0),
  }))

  // Fetch student name and token
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('name, token_number')
    .eq('id', session.user.id)
    .single()

  return NextResponse.json({
    studentName: user?.name ?? '',
    tokenNumber: user?.token_number ?? '',
    meals,
    totalCost: meals.reduce((s, m) => s + m.price, 0),
  })
}
