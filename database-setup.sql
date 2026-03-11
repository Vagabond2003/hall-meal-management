-- Online Hall Meal Management System
-- Base SQL Schema Definition
-- Run this directly in the Supabase SQL Editor

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student',
    rna_number TEXT UNIQUE, -- nullable, only for students
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    meal_selection_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Meals Table
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('regular', 'special')) DEFAULT 'regular',
    date DATE, -- null for regular meals
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MealSelections Table
CREATE TABLE meal_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_selected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, meal_id, date)
);

-- 4. MonthlyBilling Table
CREATE TABLE monthly_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    year INTEGER,
    total_cost NUMERIC(10,2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, month, year)
);

-- 5. Settings Table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_selection_deadline TIME DEFAULT '22:00:00',
    admin_secret_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insert Default Settings
INSERT INTO settings (admin_secret_code) VALUES ('HallAdmin2024!');

-- Optional: Create basic Row Level Security (RLS) policies 
-- (Kept open for now since we are relying on API routes and NextAuth for security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to all tables:
CREATE POLICY "Service Role Full Access Users" ON users FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Meals" ON meals FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Selections" ON meal_selections FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Billing" ON monthly_billing FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Settings" ON settings FOR ALL USING (true);
