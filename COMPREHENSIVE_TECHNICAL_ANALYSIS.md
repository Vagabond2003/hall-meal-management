# COMPREHENSIVE TECHNICAL ANALYSIS
## Online Hall Meal Management System

**Date of Analysis:** May 11, 2026  
**Analyzed by:** GitHub Copilot  
**Last Updated:** Exhaustive detail documentation

---

## 1. PROJECT OVERVIEW

### Purpose
The **Online Hall Meal Management System** is a full-stack web application designed to manage meal distribution and billing for university hall residents. It enables students to select or deselect daily meals, view their meal history and monthly billing, while providing administrators with tools to manage meals, approve students, generate reports, and track revenue.

### End Users

#### Students
- Register via email with an invitation code
- View a weekly meal calendar
- Toggle meal selections on/off (until a daily deadline)
- View meal history by month
- Check monthly billing status and download statements

#### Admins
- Approve or reject pending student registrations
- Create and modify weekly meal menus
- Manage meal slots (Breakfast, Lunch, Dinner, etc.)
- Generate and broadcast announcements to all students
- View detailed analytics (daily participation, popular meals, revenue)
- Generate PDF reports for individual students
- Export monthly billing summaries as Excel
- Manage invite codes and deactivate students

### Core Workflows

#### Student Login to Logout
1. **Login** → Email/password verification via NextAuth.js credentials provider
2. **Dashboard** → View welcome banner, quick stats (meals this month, cost, status), announcements
3. **Meal Selection** → Navigate weekly menu or calendar view, toggle meals (if not past cutoff time)
4. **Meal History** → Filter by month/year, view detailed meal list with costs
5. **Billing** → View monthly billing records, download PDF statement
6. **Logout** → NextAuth session cleared

#### Admin Login to Logout
1. **Login** → Email/password verification (admin role check)
2. **Dashboard** → View key metrics (total students, pending approvals, active meals, revenue), pending approvals widget, recent activity feed
3. **Student Management** → Search/filter students, approve/reject pending, deactivate/reactivate, view individual profiles
4. **Weekly Menu** → Create/edit meal slots, update daily menu items and prices, copy/paste previous week's menu
5. **Meal Attendance** → View daily attendance (which students selected meals) and print/export
6. **Announcements** → Create and post announcements with priority levels
7. **Invite Codes** → Generate/manage invite codes, track usage
8. **Reports & Analytics** → View charts, generate student PDFs, export billing Excel
9. **Settings** → Manage meal selection deadline and other system settings
10. **Logout** → NextAuth session cleared

---

## 2. TECH STACK & DEPENDENCIES

### Framework & Runtime
- **Next.js** 16.1.6 (App Router, Server Components, API Routes, Middleware)
- **React** 19.2.3 (UI rendering)
- **TypeScript** 5 (type safety)
- **Node.js** 18+ (required)

### Database & Backend Services
- **Supabase PostgreSQL** (database backend)
- **Supabase Auth** (session strategy via NextAuth.js)
- **Supabase Row Level Security (RLS)** (data access control)
- **Vercel** (hosting, serverless functions, cron jobs)

### Authentication & Security
- **NextAuth.js** 4.24.13 (JWT-based session management)
- **bcryptjs** 3.0.3 (password hashing)
- **Nodemailer** 7.0.13 (email sending via SMTP)
- **Resend** 6.9.3 (email service provider)
- **Supabase** JWT tokens for API routes

### Frontend Styling & UI
- **Tailwind CSS** 4 (utility-first CSS framework)
- **Shadcn UI** 4.0.3 (pre-built accessible component library)
- **Class Variance Authority** 0.7.1 (variant generation for components)
- **Clsx** 2.1.1 (conditional className utility)
- **Tailwind Merge** 3.5.0 (resolves Tailwind class conflicts)
- **tw-animate-css** 1.4.0 (custom animations)
- **Framer Motion** 12.35.2 (complex animations, page transitions, staggered lists)
- **Lucide React** 0.577.0 (icon library)

### Data Visualization & Export
- **Recharts** 3.8.0 (charts for analytics — bar charts, line charts)
- **@react-pdf/renderer** 4.3.2 (client-side PDF generation)
- **jsPDF** 4.2.1 (PDF manipulation utility)
- **jspdf-autotable** 5.0.7 (table formatting in PDFs)
- **XLSX** 0.18.5 (Excel/CSV generation and parsing)

### Notification & State
- **Sonner** 2.0.7 (toast notification library)
- **@supabase/supabase-js** 2.99.0 (Supabase JavaScript client)

### Dev Dependencies
- **@tailwindcss/postcss** 4 (PostCSS plugin for Tailwind v4)
- **@types/bcryptjs** 2.4.6
- **@types/node** 20
- **@types/nodemailer** 7.0.11
- **@types/react** 19
- **@types/react-dom** 19
- **ESLint** 9 (linting)
- **ESLint Config Next** 16.1.6 (Next.js-specific ESLint rules)

### Build Configuration
- **next.config.ts** — Enables package import optimization for `lucide-react`, `date-fns`, `recharts`, `framer-motion`

---

## 3. DIRECTORY & FILE STRUCTURE

### Complete `src/` Tree

```
src/
├── app/
│   ├── (auth)/                          # Grouped auth routes (not prefixed in URL)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── complete-registration/
│   │       └── page.tsx
│   │
│   ├── admin/
│   │   ├── layout.tsx                  # Admin layout (sidebar, topbar)
│   │   ├── loading.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # SSR root page
│   │   │   └── AdminDashboardClient.tsx
│   │   ├── students/
│   │   │   ├── page.tsx                # Student list
│   │   │   ├── StudentsClient.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Student detail page
│   │   │       └── StudentDetailClient.tsx
│   │   ├── weekly-menu/
│   │   │   ├── page.tsx
│   │   │   └── WeeklyMenuClient.tsx
│   │   ├── meal-attendance/
│   │   │   └── page.tsx
│   │   ├── announcements/
│   │   │   └── page.tsx
│   │   ├── invite-codes/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── student/
│   │   ├── layout.tsx                  # Student layout
│   │   ├── loading.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── DashboardClient.tsx
│   │   ├── meal-selection/
│   │   │   ├── page.tsx
│   │   │   └── MealSelectionClient.tsx
│   │   ├── history/
│   │   │   └── page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   └── announcements/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth.js handler
│   │   │   ├── register/route.ts       # Student registration
│   │   │   ├── send-verification/route.ts
│   │   │   ├── verify-token/route.ts
│   │   │   ├── complete-registration/route.ts
│   │   │   ├── forgot-password/route.ts
│   │   │   └── reset-password/route.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── dashboard/route.ts      # Fetch dashboard metrics
│   │   │   ├── pending-approvals/route.ts
│   │   │   ├── students/
│   │   │   │   ├── route.ts            # GET/search students
│   │   │   │   └── [id]/route.ts       # GET/PATCH/DELETE individual
│   │   │   ├── weekly-menu/
│   │   │   │   ├── route.ts            # GET/POST menu
│   │   │   │   ├── [id]/route.ts       # Individual menu edits
│   │   │   │   └── copy/route.ts       # Copy week logic
│   │   │   ├── meal-slots/route.ts     # GET/PUT meal slots
│   │   │   ├── reports/
│   │   │   │   └── [id]/route.ts       # Fetch report data for PDF
│   │   │   ├── invite-codes/route.ts
│   │   │   ├── settings/route.ts
│   │   │   ├── analytics/route.ts      # Charts data
│   │   │   ├── billing-summary/route.ts
│   │   │   ├── feedback-reply/route.ts
│   │   │   ├── activities/route.ts
│   │   │   ├── meal-attendance/route.ts
│   │   │   └── feedback-notifications/route.ts
│   │   │
│   │   ├── student/
│   │   │   ├── selections/route.ts     # GET/POST/DELETE meal selections
│   │   │   ├── bulk-selection/route.ts # Bulk on/off
│   │   │   ├── weekly-menu/route.ts    # GET available menus
│   │   │   ├── daily-menu/route.ts     # GET today's menu
│   │   │   ├── billing/route.ts        # GET billing records
│   │   │   ├── history/route.ts        # GET meal history
│   │   │   ├── today-meals/route.ts    # GET today's selections
│   │   │   ├── feedback/route.ts       # POST/GET/DELETE feedback
│   │   │   ├── bill-pdf/route.ts       # GET data for PDF
│   │   │   ├── settings/route.ts
│   │   │   └── meals/route.ts          # Special meals
│   │   │
│   │   ├── announcements/
│   │   │   ├── route.ts                # GET (all), POST (admin only)
│   │   │   ├── [id]/route.ts           # DELETE, GET individual
│   │   │   ├── [id]/interact/route.ts  # POST read/like toggle
│   │   │   └── unread-count/route.ts
│   │   │
│   │   └── cron/
│   │       ├── meal-carryover/route.ts # Daily carry-over (11:58 PM)
│   │       ├── month-reset/route.ts    # Monthly reset (12:00 AM, 1st)
│   │       └── keep-warm/route.ts      # Prevent cold starts
│   │
│   ├── deactivated/
│   │   └── page.tsx                    # Hold page for inactive students
│   │
│   ├── pending-approval/
│   │   └── page.tsx                    # Hold page for pending students
│   │
│   ├── globals.css
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Root "/" page (role-based redirect)
│   └── template.tsx                    # Page transition wrapper
│
├── components/
│   ├── FeedbackModal.tsx               # Modal for meal feedback
│   ├── TodaysMealsCard.tsx
│   ├── providers.tsx                   # SessionProvider
│   ├── layout/
│   │   ├── AdminLayoutGuard.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── StudentLayoutGuard.tsx
│   │   ├── StudentSidebar.tsx
│   │   └── Topbar.tsx
│   ├── layouts/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── StudentLayout.tsx
│   │   ├── StudentSidebar.tsx
│   │   └── TopBar.tsx
│   ├── pdf/
│   │   ├── StudentMonthlyBill.tsx      # @react-pdf/renderer document
│   │   ├── MonthlyBillSummary.tsx
│   │   └── MonthlyReport.tsx
│   ├── shared/
│   │   ├── DataTable.tsx               # Reusable table component
│   │   ├── EmptyState.tsx              # Empty state UI
│   │   ├── LoadingSkeleton.tsx         # Shimmer skeletons
│   │   ├── MealToggleCard.tsx          # Meal selection card with switch
│   │   ├── StatCard.tsx                # Stat card (Dashboard)
│   │   └── ToastProvider.tsx           # Toast context (deprecated?)
│   ├── admin/
│   │   └── MealPDFGeneratorModal.tsx   # PDF generation modal
│   └── ui/                             # Shadcn UI primitives
│       ├── alert-dialog.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── tooltip.tsx
│       └── ... (15+ more)
│
├── lib/
│   ├── auth.ts                         # NextAuth.js config, requireAdmin(), requireStudent()
│   ├── billing.ts                      # calculateMonthlyBill() function
│   ├── supabase.ts                     # Supabase client initialization
│   ├── utils.ts                        # cn(), format12h()
│   ├── settingsCache.ts                # In-memory settings cache (60s TTL)
│   ├── exportBillingSummary.ts         # Excel export helper
│   ├── analytics/
│   │   └── (analytics utility functions)
│   ├── hooks/
│   │   └── (custom React hooks)
│   └── pdf/
│       └── (PDF-related utilities)
│
├── types/
│   └── next-auth.d.ts                  # NextAuth.js Session/User/JWT types
│
└── middleware.ts                       # Edge middleware (route protection)
```

### Root Level Files
- `package.json` — Dependencies and scripts
- `database-setup.sql` — Complete PostgreSQL schema
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration
- `tailwind.config.ts` — Tailwind CSS configuration (if present)
- `postcss.config.mjs` — PostCSS configuration
- `eslint.config.mjs` — ESLint configuration
- `vercel.json` — Vercel cron job definitions
- `playwright.config.ts` — End-to-end testing configuration
- `system_description.txt` — Internal documentation
- `features-and-tech-stack.txt` — Feature summary
- `README.md` — Project README

### App Router Routes (Full List)

#### Public Routes (No Auth Required)
- `/login` — Login page
- `/signup` — Signup (student/admin) page
- `/forgot-password` — Forgot password page
- `/reset-password` — Reset password with token
- `/complete-registration` — Email verification completion

#### Student Routes (Requires `role: 'student'`, `is_approved: true`, `is_active: true`)
- `/student/dashboard` — Main student dashboard
- `/student/meal-selection` — Weekly/calendar meal selection view
- `/student/history` — Meal history filtered by month/year
- `/student/billing` — Monthly billing records and statements
- `/student/announcements` — Announcements feed

#### Admin Routes (Requires `role: 'admin'`)
- `/admin/dashboard` — Admin dashboard with metrics
- `/admin/students` — Student list (searchable, filterable)
- `/admin/students/[id]` — Individual student profile/detail page
- `/admin/weekly-menu` — Weekly menu management interface
- `/admin/meal-attendance` — Daily meal attendance view
- `/admin/announcements` — Announcements management
- `/admin/invite-codes` — Invite code management
- `/admin/analytics` — Analytics and charts
- `/admin/settings` — System settings

#### Holding Pages
- `/deactivated` — Shown if `is_active: false`
- `/pending-approval` — Shown if `is_approved: false`

---

## 4. DATABASE SCHEMA (EXHAUSTIVE DETAIL)

### 4.1 Core Tables

#### **users**
**Purpose:** Stores all user accounts (students and admins)

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique user identifier |
| name | TEXT | NOT NULL | NO | — | User's full name |
| email | TEXT | UNIQUE NOT NULL | NO | — | Email address (lowercase before insertion) |
| password | TEXT | NOT NULL | NO | — | Bcrypt hashed password (cost 10) |
| role | TEXT | CHECK (role IN ('student', 'admin')) | NO | 'student' | User's role |
| token_number | VARCHAR | UNIQUE, Partial Index | YES | NULL | Student ID/token (only for students) |
| is_approved | BOOLEAN | NOT NULL | NO | FALSE | Whether admin approved the student |
| is_active | BOOLEAN | NOT NULL | NO | TRUE | Soft delete flag (true = active) |
| meal_selection_enabled | BOOLEAN | NOT NULL | NO | TRUE | Can this user select meals? |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Account creation timestamp |
| rna_number | VARCHAR | — | YES | NULL | Alternative identifier (currently unused) |
| must_change_password | BOOLEAN | NOT NULL | NO | FALSE | Force password change on next login |
| created_by_admin | UUID | FOREIGN KEY users(id) | YES | NULL | Which admin created this user |
| last_login_at | TIMESTAMPTZ | — | YES | NULL | Last login timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `email`
- UNIQUE PARTIAL on `token_number WHERE token_number IS NOT NULL`
- INDEX on `role`

**Foreign Keys:**
- `created_by_admin` → `users(id)` (self-referential)

**RLS:** ENABLED

---

#### **meals** 
**Purpose:** Stores meal templates (regular and special meals)

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique meal identifier |
| name | TEXT | NOT NULL | NO | — | Meal name (e.g., "Breakfast", "Lunch") |
| description | TEXT | — | YES | NULL | Optional meal description |
| price | NUMERIC(10,2) | NOT NULL | NO | — | Price in BDT |
| meal_type | TEXT | CHECK (meal_type IN ('regular', 'special')) | NO | 'regular' | Type of meal |
| date | DATE | — | YES | NULL | Specific date (for special meals) |
| is_active | BOOLEAN | NOT NULL | NO | TRUE | Whether meal is available |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |

**RLS:** ENABLED

---

#### **weekly_menus**
**Purpose:** Stores weekly meal menu items for each day and slot

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique menu item |
| week_start_date | DATE | NOT NULL | NO | — | Sunday of the week (YYYY-MM-DD) |
| day_of_week | INTEGER | CHECK (day_of_week BETWEEN 0 AND 6) | NO | — | 0=Sun, 1=Mon, ..., 6=Sat |
| meal_slot | TEXT | NOT NULL | NO | — | Slot name (e.g., "Breakfast", "Lunch") |
| items | TEXT | NOT NULL | NO | — | Comma-separated or newline-separated food items |
| price | NUMERIC(10,2) | NOT NULL | NO | — | Price in BDT for this day/slot |
| is_active | BOOLEAN | NOT NULL | NO | TRUE | Is this menu item available? |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |
| UNIQUE | — | (week_start_date, day_of_week, meal_slot) | — | — | Prevents duplicate entries |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `(week_start_date, day_of_week, meal_slot)`
- INDEX on `week_start_date`

**RLS:** ENABLED

---

#### **meal_slots**
**Purpose:** Defines available meal slots (e.g., Breakfast, Lunch, Dinner)

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique slot identifier |
| name | TEXT | UNIQUE NOT NULL | NO | — | Slot name (e.g., "Breakfast") |
| display_order | INTEGER | NOT NULL | NO | 0 | Sort order for UI display |
| is_active | BOOLEAN | NOT NULL | NO | TRUE | Is this slot available? |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `name`

**RLS:** ENABLED

---

#### **meal_selections**
**Purpose:** Records which meals each student has selected on each date

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique selection record |
| student_id | UUID | FOREIGN KEY users(id) ON DELETE CASCADE | NO | — | Student who selected |
| meal_id | UUID | FOREIGN KEY meals(id) ON DELETE CASCADE | YES | NULL | Special meal (if applicable) |
| weekly_menu_id | UUID | FOREIGN KEY weekly_menus(id) | YES | NULL | Regular weekly menu item (if applicable) |
| date | DATE | NOT NULL | NO | — | Date of selection (YYYY-MM-DD) |
| is_selected | BOOLEAN | NOT NULL | NO | TRUE | Is the meal selected (true) or deselected (false)? |
| price | NUMERIC(10,2) | NOT NULL | NO | 0 | Price at time of selection (snapshot) |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | When selection was made |
| UNIQUE | — | (student_id, meal_id, date) | — | — | One selection per meal per student per day |
| UNIQUE PARTIAL | — | (student_id, weekly_menu_id, date) WHERE weekly_menu_id IS NOT NULL | — | — | Partial index for weekly menus |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `(student_id, meal_id, date)`
- UNIQUE PARTIAL on `(student_id, weekly_menu_id, date) WHERE weekly_menu_id IS NOT NULL`

**Foreign Keys:**
- `student_id` → `users(id)` ON DELETE CASCADE
- `meal_id` → `meals(id)` ON DELETE CASCADE
- `weekly_menu_id` → `weekly_menus(id)` (no ON DELETE specified)

**RLS:** ENABLED

---

#### **monthly_billing**
**Purpose:** Aggregated monthly billing records per student

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique billing record |
| student_id | UUID | FOREIGN KEY users(id) ON DELETE CASCADE | NO | — | Student being billed |
| month | INTEGER | CHECK (month BETWEEN 1 AND 12) | NO | — | Month number (1-12) |
| year | INTEGER | NOT NULL | NO | — | Year (4-digit) |
| total_cost | NUMERIC(10,2) | NOT NULL | NO | 0 | Total cost for the month |
| is_paid | BOOLEAN | NOT NULL | NO | FALSE | Payment status |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Record creation timestamp |
| UNIQUE | — | (student_id, month, year) | — | — | One record per student per month/year |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `(student_id, month, year)`

**Foreign Keys:**
- `student_id` → `users(id)` ON DELETE CASCADE

**RLS:** ENABLED

---

#### **settings**
**Purpose:** Global system configuration

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique settings record |
| meal_selection_deadline | TIME | NOT NULL | NO | '22:00:00' | Cutoff time for meal selection (24-hour format) |
| admin_secret_code | TEXT | NOT NULL | NO | — | Secret code to create admin accounts |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |

**RLS:** ENABLED

---

### 4.2 Authentication & Security Tables

#### **password_reset_tokens**
**Purpose:** Tracks password reset requests

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique token record |
| user_id | UUID | FOREIGN KEY users(id) | YES | NULL | User resetting password |
| token | TEXT | UNIQUE NOT NULL | NO | — | UUID token sent in email |
| expires_at | TIMESTAMPTZ | NOT NULL | NO | — | Token expiration time (1 hour from creation) |
| used | BOOLEAN | NOT NULL | NO | FALSE | Has this token been used? |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |

**Foreign Keys:**
- `user_id` → `users(id)` (no cascade)

**RLS:** ENABLED

---

#### **email_verification_tokens**
**Purpose:** Tracks email verification during signup

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique token record |
| email | TEXT | NOT NULL | NO | — | Email to verify |
| token | TEXT | UNIQUE NOT NULL | NO | — | UUID token sent in email |
| expires_at | TIMESTAMPTZ | NOT NULL | NO | — | Token expiration time (1 hour from creation) |
| used | BOOLEAN | NOT NULL | NO | FALSE | Has registration been completed? |
| invite_code | TEXT | NOT NULL | NO | — | Associated invite code (foreign key concept, but TEXT for flexibility) |
| signup_mode | TEXT | NOT NULL | NO | 'student' | 'student' or 'admin' |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |

**RLS:** ENABLED

---

#### **invite_codes**
**Purpose:** Manages registration invite codes

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique invite code record |
| code | TEXT | UNIQUE NOT NULL | NO | — | The invite code (uppercase alphanumeric) |
| created_by | UUID | FOREIGN KEY users(id) | YES | NULL | Admin who generated this code |
| used_by | UUID | UNIQUE FOREIGN KEY users(id) | YES | NULL | Student who used this code (one-time use) |
| is_used | BOOLEAN | NOT NULL | NO | FALSE | Has code been claimed? |
| expires_at | TIMESTAMPTZ | NOT NULL | NO | — | Code expiration timestamp |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `code`
- UNIQUE on `used_by`

**Foreign Keys:**
- `created_by` → `users(id)`
- `used_by` → `users(id)` (UNIQUE constraint enforces one-time use)

**RLS:** ENABLED

---

### 4.3 Announcements & Interactions

#### **announcements**
**Purpose:** Global announcements broadcasted to all students

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique announcement |
| title | TEXT | NOT NULL | NO | — | Announcement title |
| body | TEXT | NOT NULL | NO | — | Full announcement text |
| priority | TEXT | CHECK (priority IN ('normal', 'important', 'urgent')) | NO | 'normal' | Priority level (affects styling) |
| created_by | UUID | FOREIGN KEY users(id) | YES | NULL | Admin who created |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Creation timestamp |

**Foreign Keys:**
- `created_by` → `users(id)`

**RLS:** ENABLED

---

#### **announcement_interactions**
**Purpose:** Tracks student interactions (read/like) with announcements

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique interaction record |
| announcement_id | UUID | FOREIGN KEY announcements(id) | YES | NULL | Which announcement |
| student_id | UUID | FOREIGN KEY users(id) | YES | NULL | Which student |
| is_read | BOOLEAN | NOT NULL | NO | FALSE | Has student read it? |
| is_liked | BOOLEAN | NOT NULL | NO | FALSE | Has student liked it? |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Interaction timestamp |
| UNIQUE | — | (announcement_id, student_id) | — | — | One record per student per announcement |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `(announcement_id, student_id)`

**Foreign Keys:**
- `announcement_id` → `announcements(id)`
- `student_id` → `users(id)`

**RLS:** ENABLED

---

### 4.4 Feedback & Support

#### **meal_feedback**
**Purpose:** Stores student feedback/ratings for meals

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique feedback record |
| student_id | UUID | FOREIGN KEY users(id) NOT NULL | NO | — | Student giving feedback |
| weekly_menu_id | UUID | FOREIGN KEY weekly_menus(id) NOT NULL | NO | — | Which meal being rated |
| date | DATE | NOT NULL | NO | — | Date of the meal |
| rating | INTEGER | CHECK (rating BETWEEN 1 AND 5) | YES | NULL | Star rating (1-5) |
| comment | TEXT | — | YES | NULL | Optional comment |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Feedback creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Last update time |
| UNIQUE | — | (student_id, weekly_menu_id, date) | — | — | One feedback per meal per student |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `(student_id, weekly_menu_id, date)`
- INDEX on `(student_id)`
- INDEX on `(weekly_menu_id, date)`

**Foreign Keys:**
- `student_id` → `users(id)` NOT NULL
- `weekly_menu_id` → `weekly_menus(id)` NOT NULL

**RLS:** ENABLED

---

#### **meal_feedback_replies**
**Purpose:** Admin replies to student feedback

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique reply record |
| feedback_id | UUID | FOREIGN KEY meal_feedback(id) NOT NULL | NO | — | Which feedback being replied to |
| admin_id | UUID | FOREIGN KEY users(id) NOT NULL | NO | — | Admin providing reply |
| reply | TEXT | NOT NULL | NO | — | Reply text |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Reply creation time |
| updated_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `(feedback_id)`

**Foreign Keys:**
- `feedback_id` → `meal_feedback(id)` NOT NULL
- `admin_id` → `users(id)` NOT NULL

**RLS:** ENABLED (not explicitly shown in schema, but should be)

---

### 4.5 Audit & Logging Tables

#### **audit_logs**
**Purpose:** Comprehensive audit trail of all significant actions

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | extensions.uuid_generate_v4() | Unique log entry |
| user_id | UUID | FOREIGN KEY users(id) | YES | NULL | User who performed action |
| action | VARCHAR | NOT NULL | NO | — | Action type (e.g., "UPDATE", "DELETE") |
| resource_type | VARCHAR | NOT NULL | NO | — | Type of resource affected (e.g., "meal_selection") |
| resource_id | UUID | — | YES | NULL | ID of resource affected |
| details | JSONB | — | YES | NULL | Additional details as JSON |
| ip_address | VARCHAR | — | YES | NULL | User's IP address |
| user_agent | TEXT | — | YES | NULL | HTTP User-Agent header |
| created_at | TIMESTAMP | NOT NULL | NO | CURRENT_TIMESTAMP | Log timestamp (UTC) |
| status | VARCHAR | NOT NULL | NO | 'success' | Status (success/failure) |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `(created_at)`
- INDEX on `(user_id)`

**Foreign Keys:**
- `user_id` → `users(id)`

---

#### **admin_actions**
**Purpose:** Logs admin-specific actions (approvals, deletions, etc.)

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique log entry |
| admin_id | UUID | FOREIGN KEY users(id) | YES | NULL | Admin who performed action |
| target_user_id | UUID | FOREIGN KEY users(id) | YES | NULL | User targeted by action |
| action | TEXT | NOT NULL | NO | — | Action description (e.g., "approve_student") |
| details | JSONB | NOT NULL | NO | '{}' | Additional details |
| ip | INET | — | YES | NULL | Admin's IP address |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Action timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `(target_user_id)`

**Foreign Keys:**
- `admin_id` → `users(id)`
- `target_user_id` → `users(id)`

---

#### **password_change_logs**
**Purpose:** Records password change events

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique log entry |
| user_id | UUID | FOREIGN KEY users(id) | YES | NULL | User changing password |
| changed_by_admin_id | UUID | FOREIGN KEY users(id) | YES | NULL | Admin who forced change (if applicable) |
| method | TEXT | NOT NULL | NO | — | How changed ('self', 'admin', 'reset_link') |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Change timestamp |

**Foreign Keys:**
- `user_id` → `users(id)`
- `changed_by_admin_id` → `users(id)`

---

#### **login_activity**
**Purpose:** Tracks login attempts (success/failure)

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique log entry |
| user_id | UUID | FOREIGN KEY users(id) | YES | NULL | User attempting login |
| success | BOOLEAN | NOT NULL | NO | — | Login success? |
| ip | INET | — | YES | NULL | User's IP address |
| user_agent | TEXT | — | YES | NULL | HTTP User-Agent |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Attempt timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `(user_id)`

**Foreign Keys:**
- `user_id` → `users(id)`

---

#### **user_activity_logs**
**Purpose:** General user activity tracking

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique log entry |
| user_id | UUID | FOREIGN KEY users(id) NOT NULL | NO | — | User performing action |
| action | VARCHAR | NOT NULL | NO | — | Action type |
| ip_address | INET | — | YES | NULL | User's IP |
| user_agent | TEXT | — | YES | NULL | HTTP User-Agent |
| device_info | VARCHAR | — | YES | NULL | Device information |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Activity timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `(user_id DESC)`
- INDEX on `(created_at DESC)`

**Foreign Keys:**
- `user_id` → `users(id)` NOT NULL

---

#### **impersonation_tokens**
**Purpose:** Allows admins to impersonate students (if implemented)

| Column | Type | Constraints | Nullable | Default | Notes |
|--------|------|-------------|----------|---------|-------|
| id | UUID | PRIMARY KEY | NO | gen_random_uuid() | Unique token |
| admin_id | UUID | FOREIGN KEY users(id) NOT NULL | NO | — | Admin performing impersonation |
| student_id | UUID | FOREIGN KEY users(id) NOT NULL | NO | — | Student being impersonated |
| token | TEXT | UNIQUE NOT NULL | NO | — | Temporary impersonation token |
| expires_at | TIMESTAMPTZ | NOT NULL | NO | — | Token expiration |
| used_at | TIMESTAMPTZ | — | YES | NULL | When token was used |
| created_at | TIMESTAMPTZ | NOT NULL | NO | NOW() | Token creation time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `token`
- INDEX on `token`

**Foreign Keys:**
- `admin_id` → `users(id)` NOT NULL
- `student_id` → `users(id)` NOT NULL

---

### 4.6 Data Relationships

**One-to-Many:**
- `users` (1) → `users` (many) via `created_by_admin` [Admin creates students]
- `users` (1) → `meal_selections` (many) [Student selects multiple meals]
- `users` (1) → `monthly_billing` (many) [Student has multiple monthly bills]
- `users` (1) → `meal_feedback` (many) [Student provides multiple feedbacks]
- `weekly_menus` (1) → `meal_selections` (many) [Menu item has multiple selections]
- `meals` (1) → `meal_selections` (many) [Meal has multiple selections]
- `announcements` (1) → `announcement_interactions` (many) [Announcement has many interactions]
- `meal_feedback` (1) → `meal_feedback_replies` (many) [Feedback has multiple replies]

**Many-to-Many:**
- `users` ↔ `announcements` via `announcement_interactions` [Students interact with announcements]

**Self-Referential:**
- `users` → `users` via `created_by_admin` [Admins create students]

---

### 4.7 Row Level Security (RLS) Policies

**Tables with RLS ENABLED:**
- `users`, `meals`, `meal_selections`, `monthly_billing`, `settings`
- `password_reset_tokens`, `weekly_menus`, `announcements`, `announcement_interactions`
- `email_verification_tokens`, `invite_codes`, `meal_slots`, `meal_feedback`, `meal_feedback_replies`

**Policy Implementation:** Policies are defined in the Supabase RLS UI but are NOT explicitly shown in the SQL file provided. Standard patterns:
- Students can view their own `meal_selections`, `monthly_billing`, `meal_feedback`
- Admins can view all records in most tables
- Public read for `announcements`, `weekly_menus` (if applicable)
- Service role (from API routes) has full access

---

## 5. AUTHENTICATION & AUTHORIZATION

### 5.1 Registration Flow

#### Student Registration (Two-Step Email Verification)
1. **Step 1: Signup Page** → Student provides:
   - Name
   - Email
   - Password
   - Token Number (student ID)
   - Invite Code
   
2. **Send Verification Email** (`POST /api/auth/send-verification`)
   - Validate invite code (not used, not expired)
   - Validate email not already in system
   - Generate UUID token
   - Insert into `email_verification_tokens` with 1-hour TTL
   - Send email via Brevo SMTP with verification link
   
3. **Step 2: Complete Registration** → User clicks email link
   - Token extracted from URL
   - Verify token (exists, not used, not expired)
   - Verify invite code still valid
   - Hash password with bcryptjs (cost 10)
   - Insert user into `users` table with:
     - `role: 'student'`
     - `is_approved: false` (awaiting admin approval)
     - `is_active: true`
     - `meal_selection_enabled: false` (until approved)
   - Mark `email_verification_tokens.used = true`
   - Mark `invite_codes.is_used = true` and `used_by = new_user_id`
   
4. **Await Admin Approval** → Student sees "Pending Approval" page

#### Admin Registration (Direct, No Invite Code)
1. **Admin Secret Code** → Admin provides:
   - Name
   - Email
   - Password
   - Admin Secret Code (from settings table)
   
2. **Validate Secret Code** (`POST /api/auth/register`)
   - Fetch `settings.admin_secret_code`
   - Compare with provided code
   - If valid, hash password and insert:
     - `role: 'admin'`
     - `is_approved: true`
     - `is_active: true`
     - `meal_selection_enabled: true`
   - Return success
   
3. **Login Immediately** → Redirected to `/admin/dashboard`

---

### 5.2 Login Flow

1. **Login Page** (`/login`)
   - User enters email and password
   
2. **NextAuth Credentials Provider** (`src/lib/auth.ts`)
   - Call `signIn('credentials', { email, password, redirect: false })`
   
3. **Authorize Function** in CredentialsProvider
   - Query `users` table by email (case-insensitive)
   - If not found → throw "Invalid email or password"
   - Compare provided password with bcrypt hash
   - If invalid → throw "Invalid email or password"
   - Return user object with: `id`, `name`, `email`, `role`, `is_approved`, `is_active`, `token_number`
   
4. **JWT Callback** (on every token refresh)
   - Store user data in JWT token
   - **Re-fetch live values from DB** to catch real-time changes (approve/deactivate)
   - Update token with: `name`, `is_approved`, `is_active`, `role`, `meal_selection_enabled`
   
5. **Session Callback**
   - Map JWT values to `session.user` object
   - Always use DB-fetched name (never defaults)
   
6. **Middleware Check** (`src/middleware.ts`)
   - Get token from `getToken()`
   - If no token → redirect to `/login?callbackUrl=...`
   - If admin route and `role !== 'admin'` → redirect to `/student/meal-selection`
   - If student route:
     - Check `role === 'student'`
     - Check `is_active === true` → else redirect to `/deactivated`
     - Check `is_approved === true` → else redirect to `/pending-approval`

---

### 5.3 Session Management

**Strategy:** JWT stored in HTTP-only cookie (NextAuth default)
- **Max Age:** 30 days
- **Token Refresh:** On every request (callback runs)
- **Database Sync:** On every refresh (live status check)
- **Secret:** `NEXTAUTH_SECRET` environment variable

**Session Data Structure:**
```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'admin';
    is_approved: boolean;
    is_active: boolean;
    token_number?: string | null;
    meal_selection_enabled?: boolean | null;
  };
}
```

---

### 5.4 Role-Based Access Control (RBAC)

#### Student Routes
- Require: `role === 'student'` AND `is_approved === true` AND `is_active === true`
- Middleware enforces at route level
- API routes double-check with `requireStudent()` function

#### Admin Routes
- Require: `role === 'admin'`
- Middleware enforces at route level
- API routes double-check with `requireAdmin()` function

#### Public Routes
- No auth required: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/complete-registration`

---

### 5.5 API Route Protection

All protected API routes follow pattern:
```typescript
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... route logic
}
```

---

### 5.6 Middleware

**File:** `src/middleware.ts`

**Protected Matchers:**
- `/admin/*` → Requires `role === 'admin'`
- `/student/*` → Requires `role === 'student'` + `is_active === true` + `is_approved === true`

**Redirects:**
- Unauthenticated → `/login?callbackUrl=...`
- Non-admin to `/admin/*` → `/student/meal-selection`
- Non-student to `/student/*` → `/admin/dashboard`
- Deactivated student → `/deactivated`
- Pending approval student → `/pending-approval`

**Edge Execution:** Runs on Vercel Edge Network for minimal latency

---

## 6. CORE BUSINESS LOGIC

### 6.1 Meal Selection System

#### How Students Select/Deselect Meals

**Endpoint:** `POST /api/student/selections`

**Request Body:**
```json
{
  "meal_id": "uuid" | null,
  "weekly_menu_id": "uuid" | null,
  "date": "YYYY-MM-DD",
  "is_selected": true | false
}
```

**Validation:**
- Exactly one of `meal_id` OR `weekly_menu_id` must be provided (mutually exclusive)
- `date` is required
- `is_selected` defaults to `true`

**Deadline Check:**
- Fetch `settings.meal_selection_deadline` (cached for 60 seconds)
- Parse deadline (e.g., "22:00:00")
- Calculate deadline time TODAY
- If `date === today` AND `current_time > deadline` → REJECT with 403
- Future dates: No deadline check

**Price Fetching:**
- If `weekly_menu_id` provided: Query `weekly_menus.price`
- If `meal_id` provided: Query `meals.price`
- Store snapshot price in `meal_selections.price` (preserves historical pricing)

**Database Operation:**
- Check if selection exists for `(student_id, meal_id, date)` or `(student_id, weekly_menu_id, date)`
- **If exists:** UPDATE with new `is_selected` and `price`
- **If not exists:** INSERT new selection
- Use UPSERT with `onConflict: "student_id,meal_id,date"` or `"student_id,weekly_menu_id,date"`

**After Update:**
- Trigger billing recalculation for that student/month (see Billing Logic)

**Response:**
```json
{
  "success": true,
  "selection": { ... }
}
```

---

#### Deadline Logic

**Deadline Time:** Stored in `settings.meal_selection_deadline` (e.g., "22:00:00" = 10:00 PM)

**Enforcement:**
- Deadline applies ONLY to today's meals
- For today's date: If current time > deadline → locked (cannot change)
- For future dates: No deadline restriction (can select anytime)
- For past dates: May be frozen (backend validation)

**UI Representation:**
- If locked: Green toggle switch replaced with gray Lock icon
- If unlocked: Green toggle switch functional

---

#### Bulk Selection: Turn On/Off from Date Onwards

**Endpoint:** `POST /api/student/bulk-selection`

**Request Body:**
```json
{
  "from_date": "YYYY-MM-DD",
  "action": "on" | "off"
}
```

**Action: "off"**
- DELETE all `meal_selections` for this student where `date >= from_date`
- Effect: Removes all meal selections from that date onwards

**Action: "on"**
1. Find Sunday of the week containing `from_date` (week_start_date)
2. Query all active `weekly_menus` with `week_start_date >= that_sunday`
3. For each menu, calculate absolute date: `week_start_date + day_of_week`
4. Filter to only include dates >= `from_date`
5. Check which menus student already has selections for
6. INSERT only new selections (avoid duplicates)
7. Effect: Student opts into all available future meals

---

### 6.2 Auto Carry-Over Cron Job

**Schedule:** Daily at 23:58 (2 minutes before midnight)
**File:** `src/app/api/cron/meal-carryover/route.ts`

**Purpose:** Automatically copy today's meal selections to tomorrow

**Logic:**
1. Get today's date and tomorrow's date
2. Fetch all active students with `meal_selection_enabled = true`
3. Find their selections for today where `is_selected = true`
4. For each selection, create identical selection for tomorrow
5. Use UPSERT with `ignoreDuplicates: true` (don't override if student already explicitly selected/deselected tomorrow)
6. Recalculate billing for next month

**Cron Setup:** Vercel `crons` in `vercel.json`
```json
{
  "path": "/api/cron/meal-carryover",
  "schedule": "58 23 * * *"
}
```

**Edge Case:** If student manually changes selection for tomorrow before carry-over runs, the UPSERT won't override.

---

### 6.3 Monthly Reset Cron Job

**Schedule:** Daily at 00:00 on the 1st of each month
**File:** `src/app/api/cron/month-reset/route.ts`

**Purpose:** Reset meal selections for new month and initialize billing records

**Logic:**
1. Get current date (after midnight on 1st)
2. Calculate start date of current month (1st)
3. UPDATE all `meal_selections` where `date >= month_start` to `is_selected = false`
4. For each active student, create/upsert `monthly_billing` record:
   - `month`: current month
   - `year`: current year
   - `total_cost`: 0 (will be recalculated)
   - `is_paid`: false

**Effect:** All students start the month with no meals selected, no cost accrued.

**Cron Setup:** Vercel `crons`
```json
{
  "path": "/api/cron/month-reset",
  "schedule": "0 0 1 * *"
}
```

---

### 6.4 Billing Logic

**File:** `src/lib/billing.ts` → `calculateMonthlyBill(studentId, month, year)`

**Triggered:**
- After every meal selection/deselection
- During monthly cron reset
- On admin force-recalculate (if implemented)

**Calculation:**
1. Query `meal_selections` where:
   - `student_id` matches
   - `is_selected = true`
   - `date` between month start and end
2. For each selection:
   - Use `meal_selections.price` (snapshot price) OR fetch from `weekly_menus.price`
   - Sum all prices: `totalCost = sum(price)`
3. Fetch existing `monthly_billing` record for (student_id, month, year)
4. Preserve `is_paid` status if exists
5. UPSERT with new `total_cost` and existing `is_paid`

**Real-Time Calculation:**
- Happens synchronously after every selection change
- Ensures `monthly_billing.total_cost` is always current

**Snapshot Pricing:**
- Prices stored in `meal_selections.price` at selection time
- Prevents retroactive price changes from affecting past bills

---

### 6.5 Student Approval Workflow

**Initial State:** `is_approved = false`

**Admin Approval:** `PATCH /api/admin/students/[id]`
```json
{
  "is_approved": true,
  "meal_selection_enabled": true
}
```

**Effect:**
- `is_approved = true` → Student can login, see dashboard, history, etc.
- `meal_selection_enabled = true` → Student can select meals
- Student redirected from `/pending-approval` to `/student/meal-selection`

**Admin Rejection:** DELETE student account
- Cannot recover (soft delete not used for rejection)

**Admin Deactivation:** `PATCH /api/admin/students/[id]`
```json
{
  "is_active": false
}
```

**Effect:**
- Student still exists in DB (soft delete)
- Student redirected to `/deactivated` page
- Cannot login or perform actions

**Reactivation:** `PATCH /api/admin/students/[id]`
```json
{
  "is_active": true
}
```

---

### 6.6 Admin Features

#### Weekly Menu Management

**Create/Edit Menu:** `POST /api/admin/weekly-menu`
```json
{
  "week_start_date": "2026-05-11",
  "day_of_week": 0,
  "meal_slot": "Breakfast",
  "items": "Toast, Eggs, Coffee",
  "price": 150,
  "is_active": true
}
```

**Database Logic:**
- Check if record exists: `(week_start_date, day_of_week, meal_slot)`
- If exists: UPDATE
- If not: INSERT
- Also sync to `meals` table (auto-create meal if not exists)

#### Copy Previous Week Menu

**Endpoint:** `POST /api/admin/weekly-menu/copy`
- Clone all menu items from one week to another
- Useful for recurring meals

#### Invite Code Generation

**Endpoint:** `POST /api/admin/invite-codes` (bulk generation)
- Generate N unique invite codes
- Set expiration (typically 30 days from creation)
- Codes are uppercase alphanumeric

#### Announcements

**Create:** `POST /api/announcements`
- Admin provides: title, body, priority
- Stored in `announcements` table

**Delete:** `DELETE /api/announcements/[id]`
- Only admin who created can delete

**Student View:** All announcements shown on `/student/announcements`
- Can mark read / like / unlike
- Stored in `announcement_interactions`

---

## 7. API ROUTES (DEEP DIVE)

### 7.1 Authentication API Routes

#### **`POST /api/auth/[...nextauth]/route.ts`**
- **Purpose:** NextAuth.js handler
- **Methods:** GET, POST
- **Response:** Session/token management
- **Provider:** Credentials (email/password)

#### **`POST /api/auth/register/route.ts`**
- **Purpose:** Direct user registration (old path, superseded by send-verification + complete-registration)
- **Request Body:** `{ name, email, password, role, token_number, admin_secret_code, inviteCode }`
- **Response:** `{ message: "..." }` (201 or 400/409)
- **Logic:** Validates invite code, checks email uniqueness, creates user

#### **`POST /api/auth/send-verification/route.ts`**
- **Purpose:** Initiate email verification during signup
- **Request Body:** `{ inviteCode, email, signupMode, adminSecretCode }`
- **Response:** `{ message: "..." }` (200)
- **Logic:**
  - Validate invite code and secret (if admin)
  - Generate UUID token
  - Send verification email via Brevo SMTP
  - Insert token record with 1-hour TTL

#### **`POST /api/auth/verify-token/route.ts`**
- **Purpose:** Validate token before registration completion
- **Request Query:** `?token=...`
- **Response:** `{ valid: boolean, user: { ... } }`
- **Logic:** Check token exists, not used, not expired

#### **`POST /api/auth/complete-registration/route.ts`**
- **Purpose:** Complete registration after email verification
- **Request Body:** `{ token, name, password, tokenNumber }`
- **Response:** `{ success: true }` (200)
- **Logic:**
  - Validate token and invite code
  - Hash password
  - Create user
  - Mark token as used
  - Mark invite code as used

#### **`POST /api/auth/forgot-password/route.ts`**
- **Purpose:** Request password reset
- **Request Body:** `{ email }`
- **Response:** `{ success: true }` (always, for security)
- **Logic:**
  - Find user by email
  - Generate reset token with 1-hour TTL
  - Invalidate previous tokens
  - Send email with reset link

#### **`POST /api/auth/reset-password/route.ts`**
- **Purpose:** Complete password reset with token
- **Request Body:** `{ token, newPassword }`
- **Response:** `{ success: true }` (200)
- **Logic:**
  - Validate token
  - Hash new password
  - Update user password
  - Mark token as used

---

### 7.2 Admin API Routes

#### **`GET /api/admin/dashboard`**
- **Headers:** Authorization (NextAuth session required)
- **Response:**
  ```json
  {
    "metrics": {
      "totalStudents": 150,
      "pendingApprovals": 5,
      "activeMeals": 12,
      "thisMonthRevenue": 45000
    },
    "pendingApprovalsList": [ ... ],
    "activities": [ ... ]
  }
  ```
- **Database Queries:**
  - Count students (role='student')
  - Count pending (is_approved=false)
  - Count active meals
  - Sum revenue from monthly_billing for current month
  - Fetch recent students and meals for activity feed

#### **`GET /api/admin/pending-approvals`**
- **Response:** `{ pendingCount: 5 }`
- **Logic:** Count students where is_approved=false

#### **`GET /api/admin/students?filter=All|Pending|Active|Deactivated&q=searchQuery`**
- **Response:** `{ students: [...] }`
- **Logic:**
  - Filter by approval/active status
  - Search by name, email, token_number (ilike for case-insensitive)
  - Order by created_at desc

#### **`GET /api/admin/students/[id]`**
- **Response:** `{ student: { id, name, email, token_number, is_approved, is_active, meal_selection_enabled, created_at } }`

#### **`PATCH /api/admin/students/[id]`**
- **Request Body:** `{ name?, token_number?, is_approved?, is_active?, meal_selection_enabled? }`
- **Response:** `{ message: "...", student: { ... } }`
- **Logic:** Update allowed fields, validate input

#### **`DELETE /api/admin/students/[id]`**
- **Response:** `{ message: "Student deleted successfully" }`
- **Error:** 400 if student has historical meal/billing records (foreign key violation)
- **Logic:** Hard delete student (cascade deletes selections, billing may be preserved for audit)

#### **`GET /api/admin/weekly-menu?weekStart=YYYY-MM-DD`**
- **Response:** `{ menus: [...], slots: [...] }`
- **Logic:** Fetch menu items for week and active slots

#### **`POST /api/admin/weekly-menu`**
- **Request Body:** `{ week_start_date, day_of_week, meal_slot, items, price, is_active }`
- **Response:** `{ menu: { ... } }`
- **Logic:** UPSERT menu item, sync to meals table

#### **`POST /api/admin/weekly-menu/[id]`** (or PUT)
- **Purpose:** Update individual menu item

#### **`POST /api/admin/weekly-menu/copy`**
- **Purpose:** Copy menu from one week to another

#### **`GET /api/admin/meal-slots`**
- **Response:** `{ slots: [ { id, name, display_order, is_active } ] }`

#### **`PUT /api/admin/meal-slots`**
- **Request Body:** `{ slots: [ { id?, name, display_order, is_active } ] }`
- **Response:** `{ slots: [...] }`

#### **`GET /api/admin/reports/[id]?month=5&year=2026`**
- **Response:** `{ student, selections, billing }`
- **Logic:** Fetch data for PDF report generation

#### **`GET /api/admin/invite-codes`**
- **Response:**
  ```json
  {
    "codes": [ { code, is_used, status, expires_at, created_at, used_by_name } ],
    "stats": { total, available, used, expired }
  }
  ```
- **Logic:** Fetch all codes, enrich with status, sort by availability

#### **`POST /api/admin/invite-codes`** (bulk generate)
- **Request Body:** `{ count: 100 }`
- **Response:** `{ success: true, generated: 100 }`

#### **`GET /api/admin/announcements`** (GET all)
- **Response:** `{ announcements: [ { id, title, body, priority, created_at, read_count, like_count } ] }`
- **Admin View:** Aggregated counts

#### **`POST /api/admin/announcements`** (create)
- **Request Body:** `{ title, body, priority }`
- **Response:** `{ announcement: { ... } }` (201)

#### **`DELETE /api/admin/announcements/[id]`**
- **Response:** `{ message: "..." }` (200)

#### **`GET /api/admin/analytics?month=5&year=2026`**
- **Response:**
  ```json
  {
    "metrics": {
      "totalMeals": 500,
      "totalRevenue": 50000,
      "avgMealsPerStudent": 3.5,
      "activeStudents": 150
    },
    "dailyParticipation": [ { day: 1, count: 100 }, ... ],
    "popularMeals": [ { meal: "Lunch", count: 250 }, ... ]
  }
  ```

#### **`GET /api/admin/billing-summary?month=5&year=2026`**
- **Response:** `{ summary: [ { token_number, name, meals_consumed, total_bill, payment_status } ] }`

---

### 7.3 Student API Routes

#### **`GET /api/student/selections?date=YYYY-MM-DD` OR `?month=5&year=2026`**
- **Response:** `{ selections: [ { id, date, is_selected, student_id, meal_id, weekly_menu_id, price } ] }`
- **Logic:**
  - If date provided: return selections for that date
  - If month/year provided: return selections for entire month
  - Only return is_selected=true

#### **`POST /api/student/selections`**
- **Request Body:** `{ meal_id?, weekly_menu_id?, date, is_selected? }`
- **Response:** `{ success: true, selection: { ... } }`
- **Logic:** Toggle meal selection, check deadline, recalculate billing

#### **`POST /api/student/bulk-selection`**
- **Request Body:** `{ from_date, action: "on" | "off" }`
- **Response:** `{ success: true, inserted: 50 }`

#### **`GET /api/student/weekly-menu?startDate=...&endDate=...`**
- **Response:** `{ menus: [ { id, date, meal_slot, items, price } ], slots: [...] }`

#### **`GET /api/student/billing`**
- **Response:** `{ billing: [ { id, month, year, total_cost, is_paid, created_at } ] }`

#### **`GET /api/student/history?month=5&year=2026`**
- **Response:** `{ history: [ { date, meal_slot, items, price } ] }`

#### **`POST /api/student/feedback`**
- **Request Body:** `{ weekly_menu_id, date, rating, comment? }`
- **Response:** `{ success: true }`
- **Logic:** Create/upsert feedback, only allow for today or past

#### **`GET /api/student/feedback?weekly_menu_id=...&date=...`**
- **Response:**
  ```json
  {
    "feedback": [
      {
        "id": "...",
        "rating": 4,
        "comment": "...",
        "student": { "name": "...", "token_number": "..." },
        "replies": [ { "reply": "...", "admin": { "name": "..." } } ]
      }
    ]
  }
  ```

#### **`DELETE /api/student/feedback?id=...`**
- **Response:** `{ success: true }`
- **Logic:** Only allow deletion of own feedback

---

### 7.4 Announcement Interaction Routes

#### **`GET /api/announcements`** (student view)
- **Response:** Announcements with student's read/like state

#### **`POST /api/announcements/[id]/interact`**
- **Request Body:** `{ action: "read" | "like" | "unlike" }`
- **Response:** `{ success: true }`
- **Logic:** Toggle read/like in announcement_interactions table

#### **`GET /api/announcements/unread-count`**
- **Response:** `{ count: 3 }`

---

### 7.5 Cron Routes

#### **`POST /api/cron/meal-carryover`**
- **Headers:** `Authorization: Bearer CRON_SECRET`
- **Schedule:** 23:58 daily
- **Response:** `{ success: true, message: "Carried over X selections" }`

#### **`POST /api/cron/month-reset`**
- **Headers:** `Authorization: Bearer CRON_SECRET`
- **Schedule:** 00:00 on 1st of month
- **Response:** `{ success: true, message: "Month reset completed" }`

#### **`POST /api/cron/keep-warm`**
- **Purpose:** Prevent Vercel serverless cold starts
- **Schedule:** Every 5 minutes (or similar)
- **Response:** `{ ok: true }`

---

## 8. FRONTEND ARCHITECTURE

### 8.1 Layout Hierarchy

#### Root Layout (`src/app/layout.tsx`)
- Wraps entire app
- Imports global fonts (DM Sans, Playfair Display)
- Loads `providers.tsx` (SessionProvider)
- Renders `<Toaster />` (Sonner toast notifications)
- Renders `<TooltipProvider />` (Shadcn)

#### App Root Page (`src/app/page.tsx`)
- Renders after login
- Checks session and role
- Redirects:
  - Unauthenticated → `/login`
  - Deactivated → `/deactivated`
  - Pending approval → `/pending-approval`
  - Admin → `/admin/dashboard`
  - Student → `/student/meal-selection`

#### Auth Layout (`src/app/(auth)/*`)
- Grouped route (parentheses), doesn't add URL prefix
- Contains: login, signup, forgot-password, reset-password, complete-registration

#### Admin Layout (`src/app/admin/layout.tsx`)
- Sidebar navigation
- Topbar with user menu
- Dynamic breadcrumbs
- Main content area

#### Student Layout (`src/app/student/layout.tsx`)
- Sidebar navigation (different from admin)
- Topbar with user menu
- Main content area

#### Holding Pages
- `/deactivated` — Static page showing account deactivated
- `/pending-approval` — Static page showing awaiting admin approval

---

### 8.2 Global Providers

**File:** `src/components/providers.tsx`
```tsx
"use client";
export function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

**Providers:**
- **SessionProvider** (from NextAuth.js) — Exposes session to client components

---

### 8.3 Component Organization

#### Layout Components (`src/components/layout/`)
- **AdminLayoutGuard.tsx** — Checks admin role, redirects if not
- **AdminSidebar.tsx** — Admin navigation sidebar
- **StudentLayoutGuard.tsx** — Checks student role, redirects if not
- **StudentSidebar.tsx** — Student navigation sidebar
- **Topbar.tsx** — Top navigation bar (shared or role-specific)

#### Shared Components (`src/components/shared/`)
- **DataTable.tsx** — Reusable table component
- **EmptyState.tsx** — Empty state UI (no data)
- **LoadingSkeleton.tsx** — Shimmer skeleton loaders
- **MealToggleCard.tsx** — Meal selection card with iOS-like toggle switch
- **StatCard.tsx** — Dashboard stat card (metric + icon + color)
- **ToastProvider.tsx** — May be deprecated (Sonner handles toasts)

#### PDF Components (`src/components/pdf/`)
- **StudentMonthlyBill.tsx** — `@react-pdf/renderer` Document for monthly bill
- **MonthlyBillSummary.tsx** — Admin export PDF
- **MonthlyReport.tsx** — Detailed report PDF

#### Admin Components (`src/components/admin/`)
- **MealPDFGeneratorModal.tsx** — Modal to trigger PDF generation

#### UI Components (`src/components/ui/`)
- Shadcn UI primitives: Button, Input, Dialog, Tabs, Select, Avatar, Badge, Tooltip, AlertDialog, etc.

---

### 8.4 Page Structure (Example: Meal Selection)

**File:** `src/app/student/meal-selection/page.tsx` (SSR)
```tsx
export default async function MealSelectionPage() {
  const session = await getServerSession(authOptions);
  return <MealSelectionClient session={session} />;
}
```

**Client Component:** `MealSelectionClient.tsx` (CSR)
- Manages `activeTab` state (week/calendar)
- Fetches weekly menus on load
- Renders MealToggleCard components
- Handles meal toggle POST requests
- Shows cutoff lock if past deadline

---

### 8.5 Loading & Error States

#### Loading States
- **Page Loading:** `src/app/[role]/loading.tsx` renders LoadingSkeleton
- **Component Loading:** Individual components show skeleton or spinner
- **Framer Motion:** staggerContainer with staggerItem animation

#### Error States
- Empty state UI when no data
- Toast notifications on API errors
- Retry buttons for failed requests
- Fallback UI for missing data

#### Animations
- **Page Transitions:** Framer Motion `motion.div` with `initial`, `animate`, `exit`
- **Staggered Lists:** Multiple items fade in with delays
- **Toggle Switch:** Spring physics on MealToggleCard
- **Count-Up Numbers:** Stats cards animate from 0 to final value
- **Shimmer Skeleton:** Loading placeholders with shimmer effect

---

### 8.6 Responsive Design

**Breakpoints:** Tailwind's default responsive classes
- `hidden lg:flex` — Hide on mobile, show on large screens
- `w-full lg:w-2/3` — Full width on mobile, 2/3 on large

**Mobile Optimizations:**
- Stacked layouts on mobile
- Touch-friendly button sizes (min 48px)
- Side drawer navigation (possibly)

---

## 9. STATE MANAGEMENT & DATA FETCHING

### 9.1 Server State Fetching

**Server Components:**
- Pages use `getServerSession()` to fetch auth data
- Can directly query Supabase in SSR (backend only)
- Example: Fetch pending approvals count, student list

**Approach:** Direct Supabase queries in Server Components where possible (most efficient)

### 9.2 Client State Fetching

**Client Components:**
- Use `useEffect(() => { fetch('/api/...') })` pattern
- Or use `useCallback` for manual fetch functions
- Example: Toggle meal selection, fetch updated billing

**No External State Management:** (Zustand, Redux, Jotai not used)
- Local `useState` for UI state (tabs, filters, modals)
- Re-fetch on actions

### 9.3 Form Handling

**Native HTML Forms:** Basic HTML `<form>` with `onSubmit`
**No Formal Library:** (React Hook Form, Formik not explicitly used)

**Example: Login Form**
```tsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const handleSubmit = async (e) => {
  e.preventDefault();
  const res = await signIn('credentials', { email, password, redirect: false });
};
```

### 9.4 Validation

**Client-Side:** HTML5 validation + custom checks
**Server-Side:** API routes validate all inputs

Example: Meal selection validation
- Check exact one of meal_id/weekly_menu_id provided
- Validate date format
- Check deadline

---

## 10. ENVIRONMENT & CONFIGURATION

### 10.1 Environment Variables

**Public (NEXT_PUBLIC prefix):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public Supabase anon key

**Server-Only:**
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (full DB access)
- `NEXTAUTH_SECRET` — Secret for JWT signing
- `NEXTAUTH_URL` — (Optional, auto-detected in Vercel)
- `CRON_SECRET` — Secret for verifying cron job requests
- `BREVO_SMTP_USER` — Brevo email service username
- `BREVO_SMTP_PASS` — Brevo email service password

**Example `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXTAUTH_SECRET=your-super-secret-string
CRON_SECRET=your-cron-secret
BREVO_SMTP_USER=your-brevo-email@brevo.com
BREVO_SMTP_PASS=your-brevo-api-key
```

---

### 10.2 Configuration Files

#### `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "framer-motion",
    ],
  },
};
```

**Features:**
- Enables gzip compression
- Optimizes package imports (tree-shaking)

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "playwright.config.ts", "tests/**"]
}
```

**Path Aliases:** `@/*` resolves to `src/`

#### `postcss.config.mjs`
- Tailwind CSS v4 PostCSS plugin

#### `tailwind.config.ts` (likely exists but not shown)
- Custom colors, fonts, animations
- Extends Tailwind defaults

#### `eslint.config.mjs`
- ESLint configuration with Next.js preset

#### `playwright.config.ts`
- E2E testing configuration
- Browser: Chromium
- Test directory: `tests/`

---

## 11. DEPLOYMENT & INFRASTRUCTURE

### 11.1 Deployment Target

**Platform:** Vercel
- Serverless functions for API routes
- Static hosting for Next.js build output
- Built-in CI/CD integration with GitHub

### 11.2 Vercel Configuration

**File:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/meal-carryover",
      "schedule": "58 23 * * *"
    },
    {
      "path": "/api/cron/month-reset",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Cron Jobs:**
1. **Meal Carryover:** 23:58 daily (2 min before midnight)
   - Copies today's selections to tomorrow
   
2. **Month Reset:** 00:00 on 1st of month
   - Resets all meal selections
   - Initializes monthly billing records

### 11.3 Environment Variables in Production

**Stored in:** Vercel project settings (Environment Variables)

**Process:**
1. Copy all `.env.local` vars to Vercel
2. Vercel encrypts and stores them
3. Auto-injected at build/runtime

---

## 12. BUGS, EDGE CASES & TECHNICAL DEBT

### 12.1 Comments Containing TODO/FIXME/HACK/BUG

**Regex Search Result:** Only 20 matches returned, mostly in `package-lock.json` and `.gitignore` (false positives for "debug")

**Actual Code Issues Found:** None explicitly marked with TODO/FIXME/BUG/HACK in main codebase (based on initial grep)

**Potential Areas to Monitor:**
1. **Billing Edge Case:** If a selection is toggled multiple times rapidly, billing recalculation could be called many times. Consider debouncing.

2. **Cron Concurrency:** If meal-carryover runs during carry-over, could have race condition. Vercel crons should be idempotent.

3. **Timezone Handling:** Date logic uses local browser timezone + "Asia/Dhaka" hardcoded. May have issues during DST transitions (though Bangladesh doesn't observe DST).

4. **Email Rate Limiting:** If many password resets requested, Brevo could throttle. No rate limiting implemented.

5. **Settings Cache:** In-memory 60-second cache on Vercel serverless means freshness not guaranteed across instances. Consider Vercel KV for distributed cache.

---

### 12.2 Edge Cases Not Handled

1. **Student Selects Same Meal Multiple Times:** UNIQUE constraint on `(student_id, meal_id, date)` prevents duplicates, but UI could be clearer.

2. **Admin Deletes Weekly Menu While Student Selecting:** Foreign key doesn't CASCADE, so orphaned `meal_selections` could remain.

3. **Multiple Admins Editing Same Menu Simultaneously:** No optimistic locking or conflict resolution.

4. **Email Delivery Failure:** If Brevo is down, no retry mechanism. User sees "success" but never receives link.

5. **Billing Recalculation During Carry-Over:** Possible race condition if cron runs while student is toggling meal.

6. **Session Expiration:** If JWT expires during form submission, user sees generic 401 instead of "session expired" message.

---

### 12.3 Potential Security Vulnerabilities

1. **SQL Injection:** Uses Supabase client library which is safe, but parameterization should be verified.

2. **XSS:** No sanitization of user input in announcements/feedback comments. Could render malicious scripts if not escaped in Shadcn/React.

3. **CSRF:** NextAuth.js handles CSRF tokens for form submissions, but API routes accept POST without explicit CSRF header check (relies on same-site cookie policy).

4. **Brute Force:** No rate limiting on `/api/auth/[...nextauth]` login endpoint. Attacker could try many password guesses.

5. **Admin Secret Code:** Hardcoded in settings table during setup. If DB is compromised, any admin can be created. Should use environment variable instead.

6. **Service Role Key Exposure:** `SUPABASE_SERVICE_ROLE_KEY` exposed in API routes (server-side). If API route is compromised, full DB access possible. Mitigated by Vercel Edge execution, but still risk.

7. **RLS Not Enforced:** Schema shows RLS ENABLED, but actual policies not defined in SQL. Need to verify Supabase RLS rules are strict.

8. **Invite Code Validation:** Invite codes stored as uppercase text, could be brute-forced if keyspace is small (e.g., 6-char alphanumeric = 2 trillion possibilities, but if only 1000 codes exist, easier to guess).

---

### 12.4 Performance Bottlenecks

1. **N+1 Query Problem:** Student history page fetches meal selections, then for each, could fetch related menu data. Should use JOIN.

2. **Missing Indexes:** Weekly menu queries on `(week_start_date, day_of_week, meal_slot)` are covered by UNIQUE constraint, but other filtering (e.g., `is_active`) may benefit from indexes.

3. **Large Dataset Export:** Admin exports entire month's billing as Excel — no pagination. If 10,000 students × 30 days = 300,000 rows, slow export.

4. **Repeated Settings Fetches:** `getCachedSettings()` uses 60s in-memory cache, but if many requests during cold start, multiple DB hits.

5. **Image Optimization:** No mention of image optimization (likely not relevant for this app, but if profile pictures added, should optimize).

6. **Client-Side Calculations:** Dashboard uses count-up animations — could stall on slow devices.

---

### 12.5 Technical Debt

1. **Duplicate Layout Components:** `src/components/layout/` and `src/components/layouts/` both exist (possible typo?). Should consolidate.

2. **Old Registration Flow:** `POST /api/auth/register` still exists, but new flow uses send-verification + complete-registration. Should remove old endpoint or deprecate.

3. **Unused Imports:** Package includes both Resend and Nodemailer for email, but likely only Nodemailer/Brevo used. Could trim.

4. **No Input Sanitization Library:** Should consider adding DOMPurify or similar for user-generated content (announcements, feedback).

5. **Hard coded Dates/URLs:** Reset password link hardcoded to `hall-meal-management.vercel.app`. Should use environment variable for domain.

6. **Missing Type Safety:** Some API responses use `any` type, especially in error handling.

---

## 13. COMPARATIVE FEATURES (vs Generic Systems)

### Unique to This System

1. **Automatic Meal Carry-Over:** Most systems require manual selection each day. This auto-carries (if configured), reducing friction.

2. **Invite Code System:** Two-step registration with email verification + invite code, more secure than simple sign-up.

3. **Cron-Based Automation:** Month-end resets and daily carry-overs are fully automated, no manual admin intervention.

4. **Real-Time Billing Snapshot:** Prices stored at selection time, prevents retroactive price changes from affecting historical bills.

5. **Deadline Enforcement:** Meal selection locked after daily cutoff time (e.g., 10 PM). Forces timely decisions.

6. **Weekly Menu Template:** Admin creates menu by week/day/slot, not meal-by-meal. More efficient for recurring meals.

7. **Feedback System:** Students can rate/comment on meals, admins can reply. Bidirectional communication channel.

8. **PDF Generation:** On-demand PDF reports for individual students and bulk billing exports in Excel.

9. **Announcements with Interactions:** Global announcements with read/like tracking, not just one-way broadcasts.

10. **Role-Based Layouts:** Completely different UIs for student vs admin, not just hidden sections.

---

## 14. CODE PATTERNS & CONVENTIONS

### 14.1 TypeScript Types & Interfaces

**Custom Session Type:**
```typescript
interface Session {
  user: {
    id: string;
    role: string;
    is_approved: boolean;
    is_active: boolean;
    token_number?: string | null;
    meal_selection_enabled?: boolean | null;
  };
}
```

**Request Body Types:**
```typescript
interface MealSelectionRequest {
  meal_id?: string;
  weekly_menu_id?: string;
  date: string;
  is_selected?: boolean;
}
```

**Database Row Types:**
- Generated or inferred from Supabase schema (not explicitly shown in codebase)
- Use `await supabaseAdmin.from('table').select()` for auto-typing

---

### 14.2 Naming Conventions

**Files:**
- Components: PascalCase (e.g., `AdminDashboardClient.tsx`)
- Utilities: camelCase (e.g., `billing.ts`, `supabase.ts`)
- Pages: lowercase (e.g., `page.tsx`, `layout.tsx`)

**Variables:**
- camelCase for variables/functions (e.g., `studentId`, `calculateMonthlyBill()`)
- UPPER_CASE for constants (e.g., `CACHE_TTL_MS`)

**CSS Classes:**
- Tailwind utilities directly in JSX
- Custom class names use kebab-case (e.g., `animate-bokeh`, `stagger-2`)

**Database Columns:**
- snake_case (e.g., `is_approved`, `created_at`, `meal_selection_enabled`)

---

### 14.3 Import Organization

**Pattern:**
1. External libraries (React, Next.js)
2. NextAuth, Supabase
3. Internal components/utils
4. Types

**Example:**
```typescript
import { useRouter } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
```

---

### 14.4 Common Patterns

**Route Protection:**
```typescript
const session = await getServerSession(authOptions);
if (!session?.user || session.user.role !== "admin") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Error Handling:**
```typescript
try {
  const { data, error } = await supabaseAdmin.from("table").select();
  if (error) throw error;
  return NextResponse.json({ data });
} catch (error) {
  console.error("Error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

**Upsert Pattern:**
```typescript
const { error } = await supabaseAdmin.from("table").upsert(
  { id, field1, field2 },
  { onConflict: "id" }
);
```

**Date Formatting:**
```typescript
import { format, addDays, parseISO } from "date-fns";
const today = format(new Date(), "yyyy-MM-dd");
const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
```

---

## 15. UNCERTAIN AREAS

1. **RLS Policies:** Schema shows RLS ENABLED on tables, but actual policy definitions not shown in SQL. Need to verify Supabase RLS is correctly configured.

2. **Exact PDF Generation Logic:** `@react-pdf/renderer` is used, but exact rendering process and layout not fully detailed.

3. **Settings Cache Behavior:** In-memory cache on Vercel serverless could be stale across instances. Actual behavior depends on Vercel's execution model.

4. **Feedback Feature Status:** Feedback system is implemented (tables + API routes), but not visible in UI screenshots. May be in-progress feature.

5. **Impersonation Tokens Table:** Schema includes `impersonation_tokens`, but no API routes found implementing admin impersonation. May be unfinished feature.

6. **Admin Activities Table:** UI mentions "Recent Activity" widget, but data source unclear (built from logs vs simulated).

7. **Responsive Breakpoints:** No explicit Tailwind config file shown. Using Tailwind defaults? Or custom breakpoints defined elsewhere?

8. **Analytics Charts:** `recharts` imported, analytics endpoint exists, but exact chart types/queries not detailed.

---

## CONCLUSION

This is a mature, production-ready full-stack meal management system with:
- Robust authentication and authorization
- Real-time billing calculations
- Automated cron jobs for meal carry-over and monthly resets
- Professional UI with Framer Motion animations
- Comprehensive admin and student portals
- Email verification and password reset flows
- PDF report generation and Excel exports
- Feedback and announcement systems

The codebase follows Next.js App Router best practices, uses TypeScript for type safety, and leverages Supabase for scalable backend infrastructure. While there are some edge cases and potential security improvements (as noted), the system is well-designed and thoroughly documented.

