-- Supabase Database Initialization Script for Clinical Laboratory Management System
-- Paste this entire script into the Supabase SQL Editor and click "Run" to initialize all tables.

-- Drop old tables if you want a clean slate (optional, commented out for safety)
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.audit_logs CASCADE;
-- DROP TABLE IF EXISTS public.qc CASCADE;
-- DROP TABLE IF EXISTS public.shifts CASCADE;
-- DROP TABLE IF EXISTS public.expenses CASCADE;
-- DROP TABLE IF EXISTS public.home_visits CASCADE;
-- DROP TABLE IF EXISTS public.staff_invites CASCADE;
-- DROP TABLE IF EXISTS public.settings CASCADE;
-- DROP TABLE IF EXISTS public.inventory_logs CASCADE;
-- DROP TABLE IF EXISTS public.inventory CASCADE;
-- DROP TABLE IF EXISTS public.appointments CASCADE;
-- DROP TABLE IF EXISTS public.tests CASCADE;
-- DROP TABLE IF EXISTS public.tests_catalog CASCADE;
-- DROP TABLE IF EXISTS public.patients CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Profile Table (References Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  role TEXT DEFAULT 'patient',
  name TEXT,
  "nameAr" TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
  id TEXT PRIMARY KEY,
  "patientId" TEXT,
  name TEXT,
  "nameAr" TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT,
  dob TIMESTAMPTZ,
  address TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tests Catalog Table
CREATE TABLE IF NOT EXISTS public.tests_catalog (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT,
  "nameAr" TEXT,
  category TEXT,
  "categoryAr" TEXT,
  price NUMERIC DEFAULT 0,
  "turnaroundTime" TEXT,
  requirements TEXT,
  "durationText" TEXT,
  "requiresFasting" BOOLEAN DEFAULT FALSE,
  "descriptionAr" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tests (Orders / Results) Table
CREATE TABLE IF NOT EXISTS public.tests (
  id TEXT PRIMARY KEY,
  "patientId" TEXT,
  type TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  "assignedTo" TEXT,
  "isDrawn" BOOLEAN DEFAULT FALSE,
  "drawnAt" TIMESTAMPTZ,
  "drawnBy" TEXT,
  "drawNotes" TEXT,
  "insuranceProvider" TEXT,
  "insuranceApprovalNumber" TEXT,
  "discountPercentage" NUMERIC DEFAULT 0,
  "amountCollected" NUMERIC DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  "patientId" TEXT,
  "patientName" TEXT,
  date TEXT,
  time TEXT,
  type TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory Table
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY,
  name TEXT,
  "nameAr" TEXT,
  category TEXT,
  "categoryAr" TEXT,
  quantity INTEGER DEFAULT 0,
  "minTarget" INTEGER DEFAULT 10,
  unit TEXT,
  "unitAr" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inventory Consumption Logs Table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id TEXT PRIMARY KEY,
  "itemId" TEXT,
  "itemNameAr" TEXT,
  "quantityConsumed" INTEGER DEFAULT 1,
  "testType" TEXT,
  "testId" TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  "detailsAr" TEXT,
  "recordedBy" TEXT
);

-- 8. Global Settings / Ownership Table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  "ownerEmail" TEXT DEFAULT 'mhm763517@gmail.com',
  "labName" TEXT DEFAULT 'المختبر السريري الذكي',
  "showLabName" BOOLEAN DEFAULT TRUE
);

-- Initialize Default Lab Profile Settings if not exists
INSERT INTO public.settings (id, "ownerEmail", "labName", "showLabName")
VALUES ('lab_profile', 'mhm763517@gmail.com', 'المختبر السريري الذكي', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9. Staff Invites Table
CREATE TABLE IF NOT EXISTS public.staff_invites (
  email TEXT PRIMARY KEY,
  name TEXT,
  "nameAr" TEXT,
  role TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Home Visits Table
CREATE TABLE IF NOT EXISTS public.home_visits (
  id TEXT PRIMARY KEY,
  "patientId" TEXT,
  "patientNameAr" TEXT,
  phone TEXT,
  address TEXT,
  "visitDate" TEXT,
  "visitTime" TEXT,
  "testsReq" JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  phlebotomist TEXT,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  amount NUMERIC DEFAULT 0,
  category TEXT,
  description TEXT,
  "recordedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Shifts Closing/Closing Handover Table
CREATE TABLE IF NOT EXISTS public.shifts (
  id TEXT PRIMARY KEY,
  date TEXT,
  "recordedBy" TEXT,
  "initialCash" NUMERIC DEFAULT 0,
  "totalCollected" NUMERIC DEFAULT 0,
  "totalExpenses" NUMERIC DEFAULT 0,
  "netAmount" NUMERIC DEFAULT 0,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Quality Control (QC) Table
CREATE TABLE IF NOT EXISTS public.qc (
  id TEXT PRIMARY KEY,
  "deviceName" TEXT,
  status TEXT DEFAULT 'passed',
  "checkedBy" TEXT,
  findings TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  "userId" TEXT,
  username TEXT,
  action TEXT,
  details TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 15. LIS Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT,
  "titleAr" TEXT,
  message TEXT,
  "messageAr" TEXT,
  type TEXT DEFAULT 'info',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ==========================================

-- Enable Row Level Security (RLS) on all tables for Supabase structure compatibility
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- Create Public Access Policies to allow easy reading/writing across the clinic application.
-- (Adjust in full production if tenant isolation is required, but perfect for robust unified MVP)

CREATE POLICY "Allow public select users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow public all patients" ON public.patients FOR ALL USING (true);
CREATE POLICY "Allow public all tests_catalog" ON public.tests_catalog FOR ALL USING (true);
CREATE POLICY "Allow public all tests" ON public.tests FOR ALL USING (true);
CREATE POLICY "Allow public all appointments" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Allow public all inventory" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Allow public all inventory_logs" ON public.inventory_logs FOR ALL USING (true);
CREATE POLICY "Allow public all settings" ON public.settings FOR ALL USING (true);
CREATE POLICY "Allow public all staff_invites" ON public.staff_invites FOR ALL USING (true);
CREATE POLICY "Allow public all home_visits" ON public.home_visits FOR ALL USING (true);
CREATE POLICY "Allow public all expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Allow public all shifts" ON public.shifts FOR ALL USING (true);
CREATE POLICY "Allow public all qc" ON public.qc FOR ALL USING (true);
CREATE POLICY "Allow public all audit_logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow public all notifications" ON public.notifications FOR ALL USING (true);
