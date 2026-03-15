import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get latest 10 feedback entries with student name and meal info
  const { data: feedbackData, error } = await supabaseAdmin
    .from('meal_feedback')
    .select('id, rating, comment, created_at, student_id, weekly_menu_id, date')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!feedbackData || feedbackData.length === 0) {
    return NextResponse.json({ notifications: [] })
  }

  // Fetch student names separately
  const studentIds = [...new Set(feedbackData.map(f => f.student_id))]
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name, token_number')
    .in('id', studentIds)

  // Fetch menu names separately
  const menuIds = [...new Set(feedbackData.map(f => f.weekly_menu_id))]
  const { data: menus } = await supabaseAdmin
    .from('weekly_menus')
    .select('id, meal_slot')
    .in('id', menuIds)

  const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]))
  const menuMap = Object.fromEntries((menus ?? []).map(m => [m.id, m]))

  const notifications = feedbackData.map(f => ({
    id: f.id,
    student_name: userMap[f.student_id]?.name ?? 'Unknown',
    token_number: userMap[f.student_id]?.token_number ?? '',
    meal_slot: menuMap[f.weekly_menu_id]?.meal_slot ?? 'Meal',
    date: f.date,
    rating: f.rating,
    comment: f.comment,
    created_at: f.created_at,
  }))

  return NextResponse.json({ notifications })
}
