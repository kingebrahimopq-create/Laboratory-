import { Patient, LabTest, Appointment } from './types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "2980512",
    name: "أحمد بن علي الكردي",
    nameEn: "Ahmed Ali Al-Kurdi",
    phone: "0599112233",
    gender: "ذكر",
    birthDate: "1988-06-15",
    bloodType: "O+"
  },
  {
    id: "2940120",
    name: "سارة أحمد الجودر",
    nameEn: "Sarah Ahmed Al-Jowder",
    phone: "0599445566",
    gender: "أنثى",
    birthDate: "1994-11-22",
    bloodType: "A+"
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "APT-001",
    patientName: "أحمد بن علي الكردي",
    patientPhone: "0599112233",
    date: "2026-06-10",
    time: "10:30",
    type: "home",
    testType: "CBC",
    status: "confirmed",
    notes: "يرجى الاتصال قبل الوصول بـ ١٥ دقيقة.",
    latitude: 24.7136,
    longitude: 46.6753,
    address: "المملكة العربية السعودية، الرياض، حي الياسمين"
  },
  {
    id: "APT-002",
    patientName: "سارة أحمد الجودر",
    patientPhone: "0599445566",
    date: "2026-06-12",
    time: "09:00",
    type: "lab",
    testType: "LIPID",
    status: "pending",
    notes: "فحص صيام لمدة ١٢ ساعة"
  }
];

export const PARAMETER_TEMPLATES = {
  CBC: [
    { name: "Hemoglobin (Hb)", nameAr: "الهيموجلوبين", unit: "g/dL", minNormal: 12.0, maxNormal: 17.5 },
    { name: "White Blood Cells (WBC)", nameAr: "خلايا الدم البيضاء", unit: "10^3/µL", minNormal: 4.0, maxNormal: 11.0 },
    { name: "Red Blood Cells (RBC)", nameAr: "خلايا الدم الحمراء", unit: "10^6/µL", minNormal: 4.2, maxNormal: 5.9 },
    { name: "Platelets (PLT)", nameAr: "الصفائح الدموية", unit: "10^3/µL", minNormal: 150, maxNormal: 450 }
  ],
  LIPID: [
    { name: "Total Cholesterol", nameAr: "الكوليسترول الكلي", unit: "mg/dL", minNormal: 120, maxNormal: 200 },
    { name: "Triglycerides", nameAr: "الدهون الثلاثية", unit: "mg/dL", minNormal: 40, maxNormal: 150 },
    { name: "HDL Cholesterol", nameAr: "الكوليسترول النافع (HDL)", unit: "mg/dL", minNormal: 40, maxNormal: 60 },
    { name: "LDL Cholesterol", nameAr: "الكوليسترول الضار (LDL)", unit: "mg/dL", minNormal: 50, maxNormal: 130 }
  ],
  LIVER: [
    { name: "Alanine Aminotransferase (ALT)", nameAr: "إنزيم ALT", unit: "U/L", minNormal: 7, maxNormal: 56 },
    { name: "Aspartate Aminotransferase (AST)", nameAr: "إنزيم AST", unit: "U/L", minNormal: 10, maxNormal: 40 },
    { name: "Total Bilirubin", nameAr: "الصفراء الكلية", unit: "mg/dL", minNormal: 0.2, maxNormal: 1.2 },
    { name: "Alkaline Phosphatase (ALP)", nameAr: "الفوسفاتاز القلوي", unit: "U/L", minNormal: 44, maxNormal: 147 }
  ],
  GLUCOSE: [
    { name: "Fasting Blood Sugar", nameAr: "سكر الدم الصائم", unit: "mg/dL", minNormal: 70, maxNormal: 100 },
    { name: "Postprandial Glucose", nameAr: "سكر الدم بعد الأكل", unit: "mg/dL", minNormal: 80, maxNormal: 140 },
    { name: "HbA1c (Cumulative)", nameAr: "السكر التراكمي", unit: "%", minNormal: 4.0, maxNormal: 5.6 }
  ]
};

export const INITIAL_TESTS: LabTest[] = [
  {
    id: "LAB-2026-001",
    patientId: "2980512",
    patientName: "أحمد بن علي الكردي",
    patientNameEn: "Ahmed Ali Al-Kurdi",
    testType: "CBC",
    titleAr: "صورة دم كاملة (CBC)",
    titleEn: "Complete Blood Count (CBC)",
    requestDate: "2026-06-08 14:30:00",
    sampleStatus: "approved",
    parameters: [
      { name: "Hemoglobin (Hb)", nameAr: "الهيموجلوبين", value: 14.5, unit: "g/dL", minNormal: 12.0, maxNormal: 17.5, isAbnormal: false },
      { name: "White Blood Cells (WBC)", nameAr: "خلايا الدم البيضاء", value: 6.2, unit: "10^3/µL", minNormal: 4.0, maxNormal: 11.0, isAbnormal: false },
      { name: "Red Blood Cells (RBC)", nameAr: "خلايا الدم الحمراء", value: 4.8, unit: "10^6/µL", minNormal: 4.2, maxNormal: 5.9, isAbnormal: false },
      { name: "Platelets (PLT)", nameAr: "الصفائح الدموية", value: 250, unit: "10^3/µL", minNormal: 150, maxNormal: 450, isAbnormal: false }
    ],
    cost: 180,
    paidAmount: 180,
    approvedBy: "د. عبد الرحمن الفضلي",
    approvedAt: "2026-06-08 16:15:00",
    barcode: "88491023",
    qrToken: "VERIFIED-CBC-88491023-2026"
  },
  {
    id: "LAB-2026-002",
    patientId: "2940120",
    patientName: "سارة أحمد الجودر",
    patientNameEn: "Sarah Ahmed Al-Jowder",
    testType: "GLUCOSE",
    titleAr: "تحليل سكر الدم (Glucose)",
    titleEn: "Blood Sugar (Glucose)",
    requestDate: "2026-06-09 08:00:00",
    sampleStatus: "analyzed",
    parameters: [
      { name: "Fasting Blood Sugar", nameAr: "سكر الدم الصائم", value: 115, unit: "mg/dL", minNormal: 70, maxNormal: 100, isAbnormal: true },
      { name: "Postprandial Glucose", nameAr: "سكر الدم بعد الأكل", value: 135, unit: "mg/dL", minNormal: 80, maxNormal: 140, isAbnormal: false },
      { name: "HbA1c (Cumulative)", nameAr: "السكر التراكمي", value: 5.4, unit: "%", minNormal: 4.0, maxNormal: 5.6, isAbnormal: false }
    ],
    cost: 120,
    paidAmount: 120,
    barcode: "120839420",
    qrToken: "VERIFIED-GLUCOSE-120839420-2026"
  }
];

// Historical Glycemic trend data for charting
export const GLUCOSE_HISTORICAL_TREND = [
  { month: "يناير", fbs: 95, hba1c: 5.2 },
  { month: "فبراير", fbs: 88, hba1c: 5.1 },
  { month: "مارس", fbs: 104, hba1c: 5.4 },
  { month: "أبريل", fbs: 92, hba1c: 5.3 },
  { month: "يونيو (الحالي)", fbs: 115, hba1c: 5.4 }
];
