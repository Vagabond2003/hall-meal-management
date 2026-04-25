# 🍽️ Online Hall Meal Management System

Built by **Nafiz Mahmud Rimon** (Department of CSE, Level 2, Term 1, ID: 0802420205101094) and **Anika Akter** (Department of CSE, Level 2, Term 2, ID: 0802420105101072).

A modern, full-stack web application for managing university hall meals. Students can select/deselect daily meals, view their meal history and billing. Admins can manage meals, approve students, generate PDF reports, and track billing.

Built with **Next.js 16**, **Supabase**, **NextAuth**, **Framer Motion**, and **Tailwind CSS v4**.

---

## ✨ Features

- **Student Portal** — Dashboard, meal selection toggle cards, meal history, monthly billing view
- **Admin Portal** — Dashboard with stats, student management (approve/suspend), meal CRUD, PDF report generation, settings
- **Authentication** — Email/password login & registration with role-based access (student / admin)
- **Meal Carry-Over** — Automatic daily carry-over of meal selections via Vercel Cron
- **Monthly Billing** — Auto-calculated billing per student, recalculated on every selection change
- **Month Reset** — Automated monthly reset of meal selections on the 1st of each month
- **PDF Reports** — Professional, downloadable monthly meal reports per student
- **Animations** — Page transitions, staggered lists, count-up stats, spring-physics toggles, shimmer skeletons

---

## 🛠️ Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Framework     | Next.js 16 (App Router)             |
| Database      | Supabase (PostgreSQL)               |
| Auth          | NextAuth.js v4                      |
| Styling       | Tailwind CSS v4, CSS Variables      |
| Animations    | Framer Motion                       |
| PDF           | @react-pdf/renderer                 |
| Icons         | Lucide React                        |
| Toasts        | Sonner                              |
| Fonts         | Playfair Display, DM Sans           |

---

## 📋 Prerequisites

- **Node.js** 18+ and **npm**
- A free **Supabase** account ([supabase.com](https://supabase.com))
- A **Vercel** account for deployment ([vercel.com](https://vercel.com))

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd online-hall-meal-management
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once your project is ready, go to **SQL Editor** in the Supabase dashboard.
3. Copy the entire contents of the `database-setup.sql` file from this project and paste it into the SQL Editor.
4. Click **Run** to execute. This creates all 6 required tables:
   - `users` — stores students and admins
   - `meals` — stores all regular and special meals
   - `meal_selections` — tracks which meals each student selected per day
   - `monthly_billing` — monthly cost summaries per student
   - `settings` — global settings (meal selection deadline, admin secret code)
   - `invite_codes` — stores registration invite codes
5. The SQL also inserts default settings with the admin secret code: `HallAdmin2024!`

#### Full SQL Schema

```sql
-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student',
    token_number TEXT UNIQUE,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    meal_selection_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR DEFAULT 'light',
    notification_preferences JSONB DEFAULT '{}',
    last_password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Meals Table
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    meal_type TEXT CHECK (meal_type IN ('regular', 'special')) DEFAULT 'regular',
    date DATE,
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

-- 6. InviteCodes Table
CREATE TABLE invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Default Settings
INSERT INTO settings (admin_secret_code) VALUES ('HallAdmin2024!');

-- 8. Enable RLS & Service Role Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access Users" ON users FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Meals" ON meals FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Selections" ON meal_selections FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Billing" ON monthly_billing FOR ALL USING (true);
CREATE POLICY "Service Role Full Access Settings" ON settings FOR ALL USING (true);
CREATE POLICY "Service Role Full Access InviteCodes" ON invite_codes FOR ALL USING (true);
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase — get these from your Supabase project dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth — generate a random string for the secret
NEXTAUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=http://localhost:3000

# Cron Secret — generate a random string to secure cron endpoints
CRON_SECRET=your-cron-secret-string

# Email (Optional — for password resets & notifications)
RESEND_API_KEY=your-resend-key
BREVO_SMTP_USER=your-brevo-user
BREVO_SMTP_PASS=your-brevo-pass
```

| Variable                       | Description                                                                 |
|--------------------------------|-----------------------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | Your Supabase project URL (found in Settings → API)                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Your Supabase anonymous (public) key                                       |
| `SUPABASE_SERVICE_ROLE_KEY`    | Your Supabase service role key (secret, server-side only)                  |
| `NEXTAUTH_SECRET`              | A random string used to encrypt sessions (run `openssl rand -hex 16`)      |
| `NEXTAUTH_URL`                 | The base URL of your app (`http://localhost:3000` for dev)                  |
| `CRON_SECRET`                  | A random string to authenticate cron job requests                          |
| `RESEND_API_KEY`               | API Key for Resend (used for modern email delivery)                        |
| `BREVO_SMTP_USER`              | SMTP username for Brevo (alternative email delivery)                       |
| `BREVO_SMTP_PASS`              | SMTP password/API key for Brevo                                            |

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Your First Admin Account

1. Go to the **Sign Up** page at `/signup`.
2. Fill in your details and use the Admin Secret Code: `HallAdmin2024!`
3. Your admin account will be created and automatically approved.
4. You can now log in and start managing the system.

---

## 📐 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & Signup pages
│   ├── admin/            # Admin dashboard, students, meals, settings
│   ├── student/          # Student dashboard, meal selection, history, billing
│   ├── api/              # All API routes
│   │   ├── auth/         # NextAuth & registration
│   │   ├── admin/        # Admin-only endpoints
│   │   ├── student/      # Student-only endpoints
│   │   └── cron/         # Cron job endpoints
│   ├── layout.tsx        # Root layout with providers
│   └── template.tsx      # Global page transition animation
├── components/
│   ├── layout/           # Sidebar, Topbar
│   ├── shared/           # StatCard, MealToggleCard, LoadingSkeleton, etc.
│   ├── pdf/              # PDF report components
│   └── ui/               # shadcn/ui components
└── lib/
    ├── auth.ts           # NextAuth config & role middleware
    ├── supabase.ts       # Supabase client instances
    ├── billing.ts        # Monthly billing calculation
    └── utils.ts          # Utility functions
```

---

## 🕐 Cron Jobs

Configured in `vercel.json` for Vercel deployment:

| Cron Job          | Schedule          | Description                                                  |
|-------------------|-------------------|--------------------------------------------------------------|
| meal-carryover    | `58 23 * * *`     | Every night at 11:58 PM — carries today's active meal selections to tomorrow |
| month-reset       | `0 0 1 * *`       | Midnight on the 1st of every month — resets all selections and creates fresh billing records |

Both cron endpoints are protected with `CRON_SECRET` via the `Authorization: Bearer <CRON_SECRET>` header.

---

## 🌐 Deploy to Vercel

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add all 6 variables from your `.env.local` file.
   - **Important**: Change `NEXTAUTH_URL` to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).
5. Click **Deploy**.
6. Once deployed, the cron jobs defined in `vercel.json` will automatically activate (requires Vercel Pro plan for cron jobs).

---

## 🔐 Default Credentials

| Role    | How to Create                                                           |
|---------|-------------------------------------------------------------------------|
| Admin   | Sign up at `/signup` with the Admin Secret Code: `HallAdmin2024!`       |
| Student | Sign up at `/signup` with a valid invite code (generated by admin)         |

> **Note**: Student accounts require admin approval before they can log in. Admins can generate invite codes from the Admin Dashboard → Invite Codes → "Generate 400 Codes".

---

## 🐛 Troubleshooting

### Login shows "successful" but redirects back to login
- Check that your Supabase `users` table column is named `token_number` (not `rna_number`)
- Verify `NEXTAUTH_URL` matches your exact domain with `https://` and no trailing slash
- Ensure `NEXTAUTH_SECRET` is set and consistent between local and production
- Check browser DevTools → Application → Cookies for `next-auth.session-token` after login

### Invite code modal doesn't appear when clicking "Generate"
- The modal must render outside parent containers using `createPortal` from `react-dom`
- Ensure no parent element has `overflow: hidden`, `transform`, or `filter` CSS that clips fixed children

### Build fails with "All declarations of 'id' must have identical modifiers"
- You have duplicate `declare module "next-auth"` blocks in multiple files
- Consolidate all NextAuth type extensions into a single file: `src/types/next-auth.d.ts`

### TypeScript errors about `rna_number`
- Search and replace all `rna_number` references with `token_number` across the codebase
- The database column, type definitions, and API queries must all match

### Cron jobs not running
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check Vercel Dashboard → Cron Jobs for schedule configuration
- Ensure your Vercel plan supports cron jobs (Pro plan required)

### "Failed to compile" after pulling from GitHub
- Run `rm -rf .next node_modules package-lock.json && npm install`
- Ensure only one `package-lock.json` exists in the project root

---

## 📄 License

This project is for educational purposes. Built for university hall meal management.
