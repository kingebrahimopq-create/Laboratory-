# خطة التطوير الشاملة - LIMS Laboratory System
## Comprehensive Development Plan

---

## 1. البنية التحتية الحالية (Current Architecture)

### Frontend Stack
- **React 19 + TypeScript + Vite**
- **Tailwind CSS** for styling
- **Firebase** (Authentication + Firestore + Storage + App Check)
- **lucide-react** for icons
- **recharts** for data visualization

### Backend Stack
- **Firebase Firestore** (NoSQL database)
- **Firebase Auth** (email/password authentication)
- **Firebase Storage** (file uploads)
- **Firebase App Check** (security)

### Multi-Platform Support
- **Web** (Primary)
- **Android** (Capacitor)
- **Desktop** (Electron)

---

## 2. المشاكل التي تم إصلاحها (Fixed Issues)

### Issue #1: Owner Authentication
- **Problem**: Owner login `mhm763517@gmail.com` / `0e02ddd1` was not working
- **Root Cause**: Complex proxy email mechanism that relied on `admin@patient-lab.local`
- **Solution**: Implemented direct owner login with `performOwnerLogin()` function
  - Creates owner account in Firebase Auth if not exists
  - Creates owner profile in Firestore with admin role
  - Sets ownership settings document

### Issue #2: Push Notifications (InAppUpdate)
- **Problem**: Hardcoded Cloud Run URL that doesn't exist
- **Root Cause**: `LIVE_SERVER_URL` was hardcoded to a non-existent endpoint
- **Solution**: Changed to use `VITE_APP_URL` environment variable
  - Falls back gracefully when no URL is configured
  - Fetches `version.json` from configured server

### Issue #3: Hardcoded Demo Data
- **Problem**: Fake data visible in production
- **Solution**:
  - AdminPanel: Chart now uses real test data filtered by day of week
  - PatientDashboard: Contacts and offers load from Firestore settings
  - Removed all hardcoded phone numbers, addresses, and promotional offers

### Issue #4: Firestore Security Rules
- **Verified**: Rules are comprehensive and properly protect all collections
- **Collections Protected**: users, patients, tests, appointments, expenses, shifts, qc, audit_logs, inventory, home_visits, notifications, settings

---

## 3. خطة التطوير المستقبلية (Future Development Plan)

### المرحلة 1: تحسين Firebase Backend (Phase 1: Firebase Backend Enhancement)
**Priority: HIGH | Timeline: 1-2 weeks**

#### 1.1 Firebase Cloud Functions
```
functions/
  src/
    auth/
      onUserCreate.ts      # Auto-create user profile on signup
      onUserDelete.ts      # Cleanup user data on delete
    tests/
      onTestCompleted.ts   # Send notification when test is done
      autoVerify.ts        # Auto-verify normal test results
    patients/
      onPatientCreate.ts   # Welcome notification
      loyaltyUpdate.ts     # Update loyalty points
    notifications/
      pushNotification.ts  # FCM push notifications
      emailNotification.ts # Email via SendGrid
```

#### 1.2 Firebase Cloud Messaging (FCM)
- Enable FCM for real push notifications
- Token management per device
- Topic subscriptions (all_staff, admins, patients)

#### 1.3 Firebase Analytics
- Track user engagement
- Monitor feature usage
- Error tracking

#### 1.4 Data Migration Scripts
```typescript
// scripts/migrateData.ts
// - Migrate from old schema to new schema
// - Backfill missing fields
// - Clean up orphan documents
```

---

### المرحلة 2: REST API Backend (Phase 2: REST API Backend)
**Priority: MEDIUM | Timeline: 2-3 weeks**

#### 2.1 Node.js + Express API
```
api/
  src/
    routes/
      auth.routes.ts
      patients.routes.ts
      tests.routes.ts
      staff.routes.ts
      appointments.routes.ts
      reports.routes.ts
      inventory.routes.ts
    controllers/
      auth.controller.ts
      patients.controller.ts
      tests.controller.ts
      staff.controller.ts
    middleware/
      auth.middleware.ts
      validation.middleware.ts
      rateLimit.middleware.ts
    services/
      firebase.service.ts
      email.service.ts
      sms.service.ts
      pdf.service.ts
```

#### 2.2 API Endpoints
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PUT    /api/patients/:id
DELETE /api/patients/:id

GET    /api/tests
POST   /api/tests
GET    /api/tests/:id
PUT    /api/tests/:id
POST   /api/tests/:id/results

GET    /api/staff
POST   /api/staff/invite
PUT    /api/staff/:id/role

GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id

GET    /api/reports/daily
GET    /api/reports/weekly
GET    /api/reports/monthly
POST   /api/reports/export

GET    /api/inventory
POST   /api/inventory/adjust
GET    /api/inventory/low-stock
```

---

### المرحلة 3: Supabase Integration (Phase 3: Supabase Integration)
**Priority: MEDIUM | Timeline: 2-3 weeks**

#### 3.1 Supabase Project Setup
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'receptionist', 'technician', 'phlebotomist', 'patient')),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  dob DATE NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  results JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id),
  is_drawn BOOLEAN DEFAULT FALSE,
  drawn_at TIMESTAMPTZ,
  drawn_by UUID REFERENCES users(id),
  amount_collected NUMERIC DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  insurance_provider TEXT,
  insurance_approval_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID,
  patient_name_ar TEXT NOT NULL,
  phone TEXT NOT NULL,
  test_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = firebase_uid::uuid OR 
    EXISTS (SELECT 1 FROM users u WHERE u.firebase_uid = auth.uid()::text AND u.role IN ('admin', 'receptionist', 'technician', 'phlebotomist')));

CREATE POLICY "Staff can view all patients" ON patients
  FOR SELECT USING (EXISTS (SELECT 1 FROM users u WHERE u.firebase_uid = auth.uid()::text AND u.role IN ('admin', 'receptionist', 'technician', 'phlebotomist')));
```

#### 3.2 Supabase Real-time
- Real-time test status updates
- Live notification system
- Patient queue updates

#### 3.3 Supabase Storage
- Patient document uploads
- Test result PDFs
- Lab report templates

---

### المرحلة 4: تحسينات الواجهة الأمامية (Phase 4: Frontend Improvements)
**Priority: LOW-MEDIUM | Timeline: 2-3 weeks**

#### 4.1 UI/UX Enhancements
- Dark mode support
- RTL optimization for Arabic
- Responsive design for tablets
- Accessibility (ARIA labels, keyboard navigation)

#### 4.2 New Features
- Barcode/QR code generation for patients
- Print-friendly report templates
- Export to PDF/Excel
- Advanced search and filtering
- Data tables with sorting and pagination

#### 4.3 Performance
- Code splitting with lazy loading
- Service worker for offline support
- Image optimization
- Bundle size reduction

---

### المرحلة 5: DevOps والنشر (Phase 5: DevOps & Deployment)
**Priority: HIGH | Timeline: 1-2 weeks**

#### 5.1 CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test
      - name: Deploy to Firebase
        uses: firebase/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

#### 5.2 Environment Management
```
.env.development    # Local dev config
.env.staging        # Staging environment
.env.production     # Production environment
```

#### 5.3 Monitoring
- Firebase Performance Monitoring
- Sentry for error tracking
- Uptime monitoring

---

## 4. إعداد البيئة المحلية (Local Setup Instructions)

### Prerequisites
```bash
# Install Node.js 20+
node --version  # v20.10.0+

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Installation
```bash
# Clone repository
git clone https://github.com/kingebrahimopq-create/Laboratory-.git
cd Laboratory-

# Install dependencies
npm install

# Start development server
npm run dev
```

### Firebase Configuration
```bash
# Set Firebase project
firebase use --add

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes (if needed)
firebase deploy --only firestore:indexes
```

### Environment Variables
Create `.env` file:
```env
# Required
VITE_APP_URL=https://your-app-url.com

# Optional
GEMINI_API_KEY=your_gemini_api_key
GITHUB_PAT=your_github_token
```

---

## 5. إعداد Firestore البيانات الأولية (Firestore Initial Data Setup)

### Settings Collections
```javascript
// settings/lab_profile
{
  labName: "مختبرك الطبي",
  showLabName: true
}

// settings/ownership
{
  ownerEmail: "mhm763517@gmail.com"
}

// settings/contacts
{
  phone: "",
  whatsapp: "",
  receptionDesk: "",
  address: "",
  workHours: ""
}

// settings/offers
{
  items: []
}
```

---

## 6. قائمة المهام الفورية (Immediate Action Items)

- [x] Fix owner authentication login
- [x] Fix InAppUpdate component
- [x] Remove hardcoded demo data
- [x] Push changes to GitHub
- [ ] Deploy Firestore rules to Firebase
- [ ] Create owner account in Firebase Auth
- [ ] Add initial lab profile settings
- [ ] Test patient registration flow
- [ ] Test all user roles (admin, receptionist, technician, phlebotomist, patient)
- [ ] Set up VITE_APP_URL environment variable

---

## 7. معلومات الاتصال والدعم (Support Information)

### Owner Account
- **Email**: mhm763517@gmail.com
- **Username**: mhm763517
- **Password**: 0e02ddd1
- **Role**: Admin

### Firebase Project
- **Project ID**: gen-lang-client-0393240619

### Repository
- **GitHub**: https://github.com/kingebrahimopq-create/Laboratory-

---

*Last Updated: 2025-01-01*
*Version: 1.0.8*
