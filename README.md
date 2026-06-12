# My Lab LIMS - Laboratory Information Management System

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20Android-Teal?style=for-the-badge&logo=react" alt="Platform"/>
  <img src="https://img.shields.io/badge/Node.js-v20+-green?style=for-the-badge&logo=nodedotjs" alt="Node"/>
  <img src="https://img.shields.io/badge/Framework-React%2019%20%2B%20Vite%20%2B%20TailwindCSS-blue?style=for-the-badge" alt="Vite"/>
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%7C%20MongoDB%20%7C%20localStorage-orange?style=for-the-badge" alt="Database"/>
  <img src="https://img.shields.io/badge/AI-Gemini%20Integration-purple?style=for-the-badge&logo=google" alt="AI"/>
  <img src="https://img.shields.io/badge/License-Secured%20by%20Director-red?style=for-the-badge&logo=googlekeep" alt="License"/>
</p>

## Overview

**My Lab LIMS** is a comprehensive, secure, and multi-platform Laboratory Information Management System designed for medical diagnostics centers. It provides complete patient management, lab test ordering, result analysis, report generation, and AI-powered medical assistance.

### Key Features

- **Multi-Platform**: Web, Windows Desktop, and Android applications
- **Patient Management**: Complete medical records with history tracking
- **Lab Test Management**: CBC, Lipid Profile, Liver Function, Glucose, Thyroid, Kidney tests
- **QR Code Verification**: Public verification of lab results
- **Print Reports**: Support for thermal printers (80mm/58mm), network printers, and PDF
- **AI Medical Assistant**: Powered by Google Gemini for medical queries
- **Multi-Language**: Full Arabic and English support
- **Google Drive Backup**: Cloud synchronization of patient data
- **Biometric Authentication**: Fingerprint-based login simulation
- **Appointment Scheduling**: Lab visits and home sample collection
- **Complaint Management**: Patient feedback and issue tracking
- **Database Ready**: Adapter pattern for PostgreSQL, MongoDB, MySQL, Firestore

---

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kingebrahimopq-create/Laboratory-.git
cd Laboratory-

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy environment file
cp .env.example .env

# 4. Configure your environment variables
# Edit .env with your API keys and settings

# 5. Seed the database with demo data
npm run db:seed

# 6. Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

---

## Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run TypeScript type checking |
| `npm run test` | Run test suite |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Populate database with demo data |
| `npm run db:migrate` | Run database migrations |
| `npm run db:backup` | Create JSON backup |
| `npm run db:restore -- <file>` | Restore from backup |

### Desktop & Mobile

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Run Electron desktop app |
| `npm run electron:build` | Build Windows installer |
| `npm run android:init` | Initialize Capacitor Android |
| `npm run android:build` | Build Android APK |

---

## Project Structure

```
Laboratory-/
├── .github/workflows/       # CI/CD pipelines
├── electron/                # Electron desktop app files
├── public/                  # Static assets & PWA manifest
├── scripts/                 # Database scripts
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── AdminPortal.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoginPortal.tsx
│   │   ├── PatientPortal.tsx
│   │   ├── ReceptionPortal.tsx
│   │   ├── TechnicianPortal.tsx
│   │   └── ...
│   ├── db/                  # Database layer
│   │   ├── storage.ts      # localStorage implementation
│   │   └── database-adapter.ts  # Database abstraction
│   ├── services/            # Business logic
│   │   └── printer-service.ts   # Printer integration
│   ├── hooks/               # Custom React hooks
│   │   ├── useDatabase.ts
│   │   └── usePrinter.ts
│   ├── types.ts             # TypeScript definitions
│   ├── auth.ts              # Authentication logic
│   ├── App.tsx              # Main application
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── capacitor.config.ts      # Capacitor configuration
├── electron-builder.json    # Electron build config
├── server.ts                # Express server
├── vite.config.ts           # Vite configuration
├── vitest.config.ts         # Test configuration
├── package.json
└── tsconfig.json
```

---

## Database Integration

The application uses a **Database Adapter Pattern** that allows seamless switching between storage backends:

### Supported Databases

1. **localStorage** (default) - Client-side storage for standalone deployments
2. **PostgreSQL** - Production-grade relational database
3. **MongoDB** - Document-based NoSQL database
4. **MySQL** - Popular relational database
5. **Firestore** - Firebase cloud database

### Switching Databases

```typescript
import { DatabaseAdapter, StorageType } from './db/database-adapter';

// Use localStorage (default)
const db = DatabaseAdapter.create(StorageType.LOCAL);

// Use PostgreSQL (requires backend configuration)
DatabaseAdapter.configure({
  type: StorageType.POSTGRESQL,
  host: 'localhost',
  port: 5432,
  database: 'mylab',
  username: 'mylab_user',
  password: 'secure_password'
});
const pgDb = DatabaseAdapter.create();
```

### Database Operations

```typescript
// Patients
const patients = await db.patients.findAll();
const patient = await db.patients.findById('EMR-30911029');
await db.patients.create(newPatient);
await db.patients.update(id, { name: 'Updated Name' });

// Appointments
const appointments = await db.appointments.findAll();
await db.appointments.create(newAppointment);

// Lab Tests
const tests = await db.tests.findAll();
await db.tests.create(newTest);

// Sync between databases
const syncResult = await localDb.sync(remoteDb);

// Backup & Restore
const backup = await db.backup();
await db.restore(backup.data);
```

---

## Printer Integration

The system supports multiple printer connection types:

### Supported Printers

- **Network (IPP)** - Ethernet/WiFi printers via IP address
- **USB** - Direct USB connection (Electron/WebSerial)
- **Bluetooth** - Wireless Bluetooth printers
- **Serial** - RS-232 serial printers

### Usage

```typescript
import { getPrinterService, PrinterConnectionType } from './services/printer-service';

const printer = getPrinterService();

// Connect to network printer
await printer.connect({
  type: PrinterConnectionType.NETWORK,
  ipAddress: '192.168.1.100',
  port: 9100,
  paperSize: '80mm'
});

// Print lab report
const result = await printer.printTestReport(test, patient, settings);

// Print barcode
await printer.printBarcode('12345678');

// Print QR code
await printer.printQRCode('VERIFIED-LAB-001-2026');

// Get status
const status = printer.getStatus();
```

---

## AI Medical Assistant

Powered by **Google Gemini**, the AI assistant provides:

- Medical information and health advice
- Lab result interpretation
- Administrative task automation (booking, pricing, discounts)
- Multi-language responses (Arabic/English)

### Configuration

Set your Gemini API key in `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

---

## CI/CD Pipelines

The project includes automated build pipelines:

### Workflows

| Workflow | Trigger | Output |
|----------|---------|--------|
| `ci.yml` | PR & Push | Lint, test, and build verification |
| `build-apps.yml` | Push to main | Windows .exe, Android .apk, Web bundle |

### GitHub Actions Secrets Required

- `GITHUB_TOKEN` (auto-provided)
- `GEMINI_API_KEY` (optional, for AI features)

---

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |

### Optional

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `FIREBASE_*` | Firebase configuration |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `PRINTER_IP_ADDRESS` | Default printer IP |
| `TWILIO_*` | SMS/WhatsApp gateway |

---

## Deployment

### Web Deployment

```bash
npm run build
# Deploy dist/ folder to any static hosting (Vercel, Netlify, etc.)
```

### Windows Desktop

```bash
npm run electron:build
# Installer will be in dist-electron/
```

### Android

```bash
npm run android:build
# APK will be in android/app/build/outputs/apk/debug/
```

---

## Security

- All patient data is encrypted at rest
- HIPAA-compliant access controls
- Biometric authentication support
- Role-based access (Admin, Receptionist, Patient)
- Audit trail for all data modifications

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

For support, please contact the development team or create an issue in the repository.

---

<p align="center">
  Made with care for better healthcare management
  <br/>
  2026 My Lab LIMS Team
</p>
