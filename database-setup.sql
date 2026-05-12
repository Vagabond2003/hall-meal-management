-- Online Hall Meal Management System
-- Complete SQL Schema Definition
-- Run this directly in the Supabase SQL Editor
-- NOTE: This schema was extracted from the live Supabase project to match the backend exactly.

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- 1.1 Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student',
    token_number TEXT UNIQUE,
    room_number VARCHAR(20),
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    meal_selection_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rna_number VARCHAR,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_by_admin UUID REFERENCES users(id),
    last_login_at TIMESTAMPTZ
);

-- 1.2 Meals Table
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('regular', 'special')) DEFAULT 'regular',
    date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Monthly Billing Table
CREATE TABLE monthly_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    year INTEGER,
    total_cost NUMERIC DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, month, year)
);

-- 1.5 Settings Table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_selection_deadline TIME DEFAULT '22:00:00',
    admin_secret_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. WEEKLY MENU & MEAL SLOTS
-- =====================================================

-- 2.1 Weekly Menus Table
CREATE TABLE weekly_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL,
    meal_slot TEXT NOT NULL,
    items TEXT NOT NULL,
    price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (week_start_date, day_of_week, meal_slot)
);

-- 2.2 Meal Slots Table
CREATE TABLE meal_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Meal Selections Table (placed after weekly_menus to resolve FK order)
CREATE TABLE meal_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_selected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    price NUMERIC DEFAULT 0,
    weekly_menu_id UUID,
    UNIQUE (student_id, meal_id, date)
);

ALTER TABLE meal_selections ADD CONSTRAINT meal_selections_weekly_menu_id_fkey FOREIGN KEY (weekly_menu_id) REFERENCES weekly_menus(id);

-- =====================================================
-- 3. AUTH & SECURITY TABLES
-- =====================================================

-- 3.1 Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    invite_code TEXT,
    signup_mode TEXT DEFAULT 'student' NOT NULL
);

-- 3.3 Invite Codes
CREATE TABLE invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id),
    used_by UUID UNIQUE REFERENCES users(id),
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ANNOUNCEMENTS
-- =====================================================

-- 4.1 Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('normal', 'important', 'urgent')) DEFAULT 'normal',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Announcement Interactions
CREATE TABLE announcement_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES announcements(id),
    student_id UUID REFERENCES users(id),
    is_read BOOLEAN DEFAULT FALSE,
    is_liked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (announcement_id, student_id)
);

-- =====================================================
-- 5. MEAL FEEDBACK
-- =====================================================

-- 5.1 Meal Feedback
CREATE TABLE meal_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) NOT NULL,
    weekly_menu_id UUID REFERENCES weekly_menus(id) NOT NULL,
    date DATE NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, weekly_menu_id, date)
);

-- 5.2 Meal Feedback Replies
CREATE TABLE meal_feedback_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES meal_feedback(id) NOT NULL,
    admin_id UUID REFERENCES users(id) NOT NULL,
    reply TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. AUDIT & ACTIVITY LOGS
-- =====================================================

-- 6.1 Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR DEFAULT 'success'
);

-- 6.2 Admin Actions
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 Password Change Logs
CREATE TABLE password_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    changed_by_admin_id UUID REFERENCES users(id),
    method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.4 Login Activity
CREATE TABLE login_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    success BOOLEAN NOT NULL,
    ip INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.5 User Activity Logs
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    action VARCHAR NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.6 Impersonation Tokens
CREATE TABLE impersonation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) NOT NULL,
    student_id UUID REFERENCES users(id) NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES
-- =====================================================

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_impersonation_token ON impersonation_tokens(token);
CREATE INDEX idx_login_activity_user ON login_activity(user_id);
CREATE INDEX idx_meal_feedback_menu_date ON meal_feedback(weekly_menu_id, date);
CREATE INDEX idx_meal_feedback_student ON meal_feedback(student_id);
CREATE INDEX idx_meal_feedback_replies_feedback ON meal_feedback_replies(feedback_id);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_user_id);
CREATE INDEX idx_password_logs_user ON password_change_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id DESC);
CREATE INDEX idx_weekly_menus_week_start ON weekly_menus(week_start_date);

-- Unique partial index for token_number (only when not null)
CREATE UNIQUE INDEX users_token_number_idx ON users(token_number) WHERE token_number IS NOT NULL;

-- Unique partial index for meal_selections with weekly_menu_id
CREATE UNIQUE INDEX meal_selections_student_weekly_date_unique ON meal_selections(student_id, weekly_menu_id, date) WHERE weekly_menu_id IS NOT NULL AND student_id IS NOT NULL;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_feedback_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_tokens ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access Policies
CREATE POLICY "Service Role Full Access Users" ON users FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Meals" ON meals FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Selections" ON meal_selections FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Billing" ON monthly_billing FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Settings" ON settings FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Password Reset Tokens" ON password_reset_tokens FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Weekly Menus" ON weekly_menus FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Announcements" ON announcements FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Announcement Interactions" ON announcement_interactions FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Email Verification Tokens" ON email_verification_tokens FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Invite Codes" ON invite_codes FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Meal Slots" ON meal_slots FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Meal Feedback" ON meal_feedback FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Meal Feedback Replies" ON meal_feedback_replies FOR ALL USING (true);
CREATE POLICY "Service Role Full Access User Activity Logs" ON user_activity_logs FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Audit Logs" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Admin Actions" ON admin_actions FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Password Change Logs" ON password_change_logs FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Login Activity" ON login_activity FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Impersonation Tokens" ON impersonation_tokens FOR ALL USING (true);

-- =====================================================
-- 9. DEFAULT DATA
-- =====================================================

INSERT INTO settings (admin_secret_code) VALUES ('HallAdmin2024!');

-- =====================================================
-- 10. ADDITIVE MIGRATIONS (safe to re-run on existing DBs)
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS room_number VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_room ON users(room_number);
