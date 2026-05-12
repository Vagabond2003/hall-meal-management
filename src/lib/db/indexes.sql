-- Run these in Supabase SQL Editor for production performance.

CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_meal_selections_student_date ON meal_selections(student_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_selections_date_selected ON meal_selections(date, is_selected);
CREATE INDEX IF NOT EXISTS idx_monthly_billing_student_month_year ON monthly_billing(student_id, month, year);
CREATE INDEX IF NOT EXISTS idx_weekly_menus_week_active ON weekly_menus(week_start_date, is_active);
CREATE INDEX IF NOT EXISTS idx_login_activity_user_created ON login_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
