/**
 * Database Seed Script
 * 
 * Populates the database with realistic demo data for testing.
 * Usage: npm run db:seed
 */

import { ClinicalDatabase } from '../src/db/storage';
import { Patient, Appointment, LabTest, AppComplaint, DoctorSettings } from '../src/types';

const SEED_PATIENTS: Patient[] = [
  {
    id: 'EMR-30911029',
    name: 'كمال الدين المحلاوي',
    nameEn: 'Kamal Al-Din AlMahlawi',
    phone: '01019183921',
    gender: 'ذكر',
    birthDate: '1979-05-12',
    bloodType: 'AB+'
  },
  {
    id: 'EMR-30911030',
    name: 'فاطمة أحمد محمود',
    nameEn: 'Fatima Ahmed Mahmoud',
    phone: '01123456789',
    gender: 'أنثى',
    birthDate: '1985-09-23',
    bloodType: 'O+'
  },
  {
    id: 'EMR-30911031',
    name: 'محمد عبد السلام',
    nameEn: 'Mohamed Abdelsalam',
    phone: '01092819382',
    gender: 'ذكر',
    birthDate: '1965-03-08',
    bloodType: 'A+'
  },
  {
    id: 'EMR-30911032',
    name: 'سارة محمود علي',
    nameEn: 'Sara Mahmoud Ali',
    phone: '01283921822',
    gender: 'أنثى',
    birthDate: '1992-11-17',
    bloodType: 'B+'
  },
  {
    id: 'EMR-30911033',
    name: 'أحمد إبراهيم حسن',
    nameEn: 'Ahmed Ibrahim Hassan',
    phone: '01551234567',
    gender: 'ذكر',
    birthDate: '1988-07-30',
    bloodType: 'O-'
  }
];

const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-001',
    patientName: 'كمال الدين المحلاوي',
    patientPhone: '01019183921',
    date: '2026-06-15',
    time: '09:00',
    type: 'lab',
    testType: 'CBC',
    status: 'confirmed',
    notes: 'صيام 8 ساعات مطلوب'
  },
  {
    id: 'APT-002',
    patientName: 'فاطمة أحمد محمود',
    patientPhone: '01123456789',
    date: '2026-06-15',
    time: '10:30',
    type: 'lab',
    testType: 'LIPID',
    status: 'confirmed',
    notes: 'فحص دوري'
  },
  {
    id: 'APT-003',
    patientName: 'محمد عبد السلام',
    patientPhone: '01092819382',
    date: '2026-06-16',
    time: '11:00',
    type: 'home',
    testType: 'GLUCOSE',
    status: 'pending',
    notes: 'زيارة منزلية - الصفحة',
    address: '15 شارع النيل، الصفحة، الجيزة'
  },
  {
    id: 'APT-004',
    patientName: 'سارة محمود علي',
    patientPhone: '01283921822',
    date: '2026-06-16',
    time: '14:00',
    type: 'lab',
    testType: 'THYROID',
    status: 'confirmed'
  },
  {
    id: 'APT-005',
    patientName: 'أحمد إبراهيم حسن',
    patientPhone: '01551234567',
    date: '2026-06-17',
    time: '09:30',
    type: 'lab',
    testType: 'LIVER',
    status: 'pending',
    notes: 'ارتفاع إنزيمات الكبد سابقاً'
  }
];

const SEED_TESTS: LabTest[] = [
  {
    id: 'LAB-2026-001',
    patientId: 'EMR-30911029',
    patientName: 'كمال الدين المحلاوي',
    patientNameEn: 'Kamal Al-Din AlMahlawi',
    testType: 'CBC',
    titleAr: 'صورة دم كاملة',
    titleEn: 'Complete Blood Count',
    requestDate: '2026-06-10',
    sampleStatus: 'approved',
    parameters: [
      { name: 'Hemoglobin', nameAr: 'الهيموجلوبين', value: 14.2, unit: 'g/dL', minNormal: 12.5, maxNormal: 17.5, isAbnormal: false },
      { name: 'RBC Count', nameAr: 'عدد الكريات الحمراء', value: 4.8, unit: '10^6/uL', minNormal: 4.2, maxNormal: 6.1, isAbnormal: false },
      { name: 'WBC Count', nameAr: 'عدد الكريات البيضاء', value: 7.2, unit: '10^3/uL', minNormal: 4.0, maxNormal: 11.0, isAbnormal: false },
      { name: 'Platelets', nameAr: 'الصفائح الدموية', value: 250, unit: '10^3/uL', minNormal: 150, maxNormal: 450, isAbnormal: false },
      { name: 'Hematocrit', nameAr: 'الهيماتوكريت', value: 42, unit: '%', minNormal: 38, maxNormal: 52, isAbnormal: false },
    ],
    cost: 180,
    paidAmount: 180,
    discountPercent: 0,
    approvedBy: 'د. صفاء عبد اللطيف الشافعي',
    approvedAt: '2026-06-10 14:30:00',
    barcode: '12345678',
    qrToken: 'VERIFIED-CBC-12345678-2026'
  },
  {
    id: 'LAB-2026-002',
    patientId: 'EMR-30911030',
    patientName: 'فاطمة أحمد محمود',
    patientNameEn: 'Fatima Ahmed Mahmoud',
    testType: 'LIPID',
    titleAr: 'الدهون في الدم',
    titleEn: 'Lipid Profile',
    requestDate: '2026-06-11',
    sampleStatus: 'analyzed',
    parameters: [
      { name: 'Total Cholesterol', nameAr: 'الكوليسترول الكلي', value: 210, unit: 'mg/dL', minNormal: 0, maxNormal: 200, isAbnormal: true },
      { name: 'LDL Cholesterol', nameAr: 'الكوليسترول الضار', value: 140, unit: 'mg/dL', minNormal: 0, maxNormal: 130, isAbnormal: true },
      { name: 'HDL Cholesterol', nameAr: 'الكوليسترول النافع', value: 45, unit: 'mg/dL', minNormal: 40, maxNormal: 100, isAbnormal: false },
      { name: 'Triglycerides', nameAr: 'الدهون الثلاثية', value: 180, unit: 'mg/dL', minNormal: 0, maxNormal: 150, isAbnormal: true },
    ],
    cost: 240,
    paidAmount: 240,
    discountPercent: 0,
    barcode: '23456789',
    qrToken: 'VERIFIED-LIPID-23456789-2026'
  },
  {
    id: 'LAB-2026-003',
    patientId: 'EMR-30911031',
    patientName: 'محمد عبد السلام',
    patientNameEn: 'Mohamed Abdelsalam',
    testType: 'GLUCOSE',
    titleAr: 'تحليل السكر',
    titleEn: 'Glucose Test',
    requestDate: '2026-06-12',
    sampleStatus: 'collected',
    parameters: [
      { name: 'Fasting Glucose', nameAr: 'السكر الصائم', value: 95, unit: 'mg/dL', minNormal: 70, maxNormal: 100, isAbnormal: false },
      { name: 'HbA1c', nameAr: 'السكر التراكمي', unit: '%', minNormal: 4.0, maxNormal: 6.5 },
    ],
    cost: 120,
    paidAmount: 120,
    discountPercent: 0,
    barcode: '34567890',
    qrToken: 'VERIFIED-GLUCOSE-34567890-2026'
  }
];

const SEED_COMPLAINTS: AppComplaint[] = [
  {
    id: 'CQ-2026-001',
    name: 'محمد عبد السلام',
    phone: '01092819382',
    category: 'delay',
    details: 'تأخر ظهور نتيجة فحص السكر التراكمي لعدة ساعات عن الموعد المتوقع.',
    testId: 'LAB-2026-003',
    date: '2026-06-12',
    status: 'resolved',
    adminReply: 'تم حل الشكوى وتسليم التقرير مع تقديم خصم 25% للفحص القادم كاعتذار من معمل النيل.'
  },
  {
    id: 'CQ-2026-002',
    name: 'سارة محمود علي',
    phone: '01283921822',
    category: 'technical',
    details: 'لم أتمكن من تسجيل الدخول التلقائي عبر بصمة الإصبع في هاتفي الأندرويد لأول مرة.',
    date: '2026-06-13',
    status: 'investigating'
  }
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // Seed patients
  console.log('📋 Seeding patients...');
  for (const patient of SEED_PATIENTS) {
    ClinicalDatabase.savePatient(patient);
  }
  console.log(`  ✓ ${SEED_PATIENTS.length} patients seeded`);

  // Seed appointments
  console.log('📅 Seeding appointments...');
  for (const appointment of SEED_APPOINTMENTS) {
    ClinicalDatabase.saveAppointment(appointment);
  }
  console.log(`  ✓ ${SEED_APPOINTMENTS.length} appointments seeded`);

  // Seed tests
  console.log('🧪 Seeding lab tests...');
  for (const test of SEED_TESTS) {
    ClinicalDatabase.saveTest(test);
  }
  console.log(`  ✓ ${SEED_TESTS.length} tests seeded`);

  // Seed complaints
  console.log('📝 Seeding complaints...');
  ClinicalDatabase.saveAllComplaints(SEED_COMPLAINTS);
  console.log(`  ✓ ${SEED_COMPLAINTS.length} complaints seeded`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nTo reset the database, clear your browser localStorage or run:');
  console.log('  localStorage.clear()');
}

seed().catch(console.error);
