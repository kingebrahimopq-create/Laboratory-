import { db, auth } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, setDoc, query, where, Timestamp, deleteDoc } from './supabase-firestore';
export { db, auth, doc, updateDoc, collection, addDoc, getDocs, getDoc, setDoc, query, where, Timestamp, deleteDoc };
import { Patient, Test, User, UserRole } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const PATIENTS_COLLECTION = 'patients';
const TESTS_COLLECTION = 'tests';
const USERS_COLLECTION = 'users';

// --- User Profile Operations ---
export const createUserProfile = async (uid: string, userData: Omit<User, 'id'>) => {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      ...userData,
      id: uid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfileByEmail = async (email: string): Promise<User | null> => {
  const path = `${USERS_COLLECTION}`;
  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    return [];
  }
};

export const updateUserRole = async (uid: string, role: UserRole) => {
  const path = `${USERS_COLLECTION}/${uid}`;
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// --- Patient Operations ---
export const addPatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
      ...patient,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PATIENTS_COLLECTION);
    throw error;
  }
};

export const getAllPatients = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PATIENTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PATIENTS_COLLECTION);
    return [];
  }
};

export const getPatientsByPhone = async (phone: string): Promise<Patient[]> => {
  try {
    const q = query(collection(db, PATIENTS_COLLECTION), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PATIENTS_COLLECTION);
    return [];
  }
};

// --- Test Operations ---
export const addTest = async (test: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, TESTS_COLLECTION), {
      ...test,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TESTS_COLLECTION);
    throw error;
  }
};

export const getAllTests = async (): Promise<Test[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, TESTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TESTS_COLLECTION);
    return [];
  }
};

export const getTestsByPatient = async (patientId: string) => {
  try {
    const q = query(collection(db, TESTS_COLLECTION), where("patientId", "==", patientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TESTS_COLLECTION);
    return [];
  }
};

export const updateTestResultsAndStatus = async (testId: string, status: 'pending' | 'completed' | 'cancelled', results?: any) => {
  const path = `${TESTS_COLLECTION}/${testId}`;
  try {
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };
    if (results !== undefined) {
      updateData.results = results;
    }
    await updateDoc(doc(db, TESTS_COLLECTION, testId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// --- Staff Invites Operations ---
export interface StaffInvite {
  email: string;
  name: string;
  nameAr: string;
  role: UserRole;
  createdAt?: any;
}

export const createStaffInvite = async (email: string, nameAr: string, name: string, role: UserRole) => {
  const normalizedEmail = email.toLowerCase().trim();
  const path = `staff_invites/${normalizedEmail}`;
  try {
    await setDoc(doc(db, 'staff_invites', normalizedEmail), {
      email: normalizedEmail,
      name,
      nameAr,
      role,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getStaffInvite = async (email: string): Promise<StaffInvite | null> => {
  const normalizedEmail = email.toLowerCase().trim();
  const path = `staff_invites/${normalizedEmail}`;
  try {
    const inviteDoc = await getDoc(doc(db, 'staff_invites', normalizedEmail));
    if (inviteDoc.exists()) {
      return inviteDoc.data() as StaffInvite;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const getAllStaffInvites = async (): Promise<StaffInvite[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'staff_invites'));
    return querySnapshot.docs.map(doc => doc.data() as StaffInvite);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'staff_invites');
    return [];
  }
};

export const deleteStaffInvite = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const path = `staff_invites/${normalizedEmail}`;
  try {
    await deleteDoc(doc(db, 'staff_invites', normalizedEmail));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- Appointments Operations ---
export interface Appointment {
  id: string;
  patientId: string;
  patientNameAr: string;
  phone: string;
  testType: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'cancelled';
  createdAt?: any;
}

export const createAppointment = async (apt: Omit<Appointment, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...apt,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'appointments');
    throw error;
  }
};

export const getAppointmentsByPatient = async (patientId: string): Promise<Appointment[]> => {
  try {
    const q = query(collection(db, 'appointments'), where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
    return [];
  }
};

export const getAppointmentsByPhone = async (phone: string): Promise<Appointment[]> => {
  try {
    const q = query(collection(db, 'appointments'), where('phone', '==', phone.trim()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
    return [];
  }
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'appointments'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
    return [];
  }
};

export const updateAppointmentStatus = async (id: string, status: 'pending' | 'approved' | 'cancelled') => {
  const path = `appointments/${id}`;
  try {
    await updateDoc(doc(db, 'appointments', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// --- Real Laboratory Prices & Catalog ---
export interface TestCatalogItem {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  durationText: string;
  requiresFasting: boolean;
  descriptionAr: string;
  category: string;
}

export const LAB_TESTS_CATALOG: TestCatalogItem[] = [
  {
    id: 'cbc',
    nameAr: 'صورة الدم الكاملة',
    nameEn: 'Complete Blood Count (CBC)',
    price: 90,
    durationText: 'ساعتين',
    requiresFasting: false,
    descriptionAr: 'تحليل شامل لخلايا الدم الحمراء والبيضاء والصفائح الكشف عن فقر الدم أو الالتهابات والمناعة.',
    category: 'الفحوصات العامة'
  },
  {
    id: 'fbs',
    nameAr: 'تحليل السكر الصائم',
    nameEn: 'Fasting Blood Sugar (FBS)',
    price: 45,
    durationText: 'صائم (٨ ساعات)',
    requiresFasting: true,
    descriptionAr: 'فحص لمستوى الجلوكوز بمصل الدم بعد صيام 8 ساعات لتشخيص مرض السكري ومعدل حرق الكربوهيدرات.',
    category: 'أمراض السكري'
  },
  {
    id: 'lipid',
    nameAr: 'فحص الدهون الكامل',
    nameEn: 'Lipid Profile',
    price: 150,
    durationText: 'صائم (١٢ ساعة)',
    requiresFasting: true,
    descriptionAr: 'يشمل الكوليسترول الكلي، الدهون الثلاثية، الكوليسترول الضار والنافع لمراقبة صحة القلب والشرايين.',
    category: 'صحة القلب والشرايين'
  },
  {
    id: 'kidney',
    nameAr: 'وظائف الكلى الكاملة',
    nameEn: 'Kidney Function Test',
    price: 130,
    durationText: 'ساعتين',
    requiresFasting: false,
    descriptionAr: 'يشمل قياس نسبة الكرياتينين واليوريا وحمض البوليك لتقييم كفاءة عمل الكلى.',
    category: 'وظائف الأعضاء'
  },
  {
    id: 'liver',
    nameAr: 'إنزيمات ووظائف الكبد',
    nameEn: 'Liver Function Test (LFT)',
    price: 160,
    durationText: '٣ ساعات',
    requiresFasting: false,
    descriptionAr: 'يقيس مستويات إنزيمات الكبد والبيليروبين والبروتينات لتقييم صحة خلايا الكبد والمرارة.',
    category: 'وظائف الأعضاء'
  },
  {
    id: 'thyroid',
    nameAr: 'فحص هرمونات الغدة الدرقية',
    nameEn: 'Thyroid Profile (TSH, Free T3, Free T4)',
    price: 190,
    durationText: 'يوم واحد',
    requiresFasting: false,
    descriptionAr: 'يقيم أداء الغدة الدرقية والكشف عن حالات قصور الغدة أو نشاطها المفرط.',
    category: 'الهرمونات والغدد'
  },
  {
    id: 'vit_d',
    nameAr: 'تحليل فيتامين دال',
    nameEn: 'Vitamin D (25-OH)',
    price: 180,
    durationText: 'يوم واحد',
    requiresFasting: false,
    descriptionAr: 'قياس نسبة الكالسيوم النشط وفيتامين دال لتقييم سلامة العظام والمفاصل والمناعة الذاتية.',
    category: 'الفيتامينات والمناعة'
  }
];

// --- Daily Expenses Operations ---
export interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  recordedBy: string;
  createdAt: any;
}

export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'expenses');
    throw error;
  }
};

export const getAllExpenses = async (): Promise<Expense[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'expenses'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'expenses');
    return [];
  }
};

// --- Shift Handover / Closing Operations ---
export interface ShiftClosing {
  id?: string;
  date: string;
  recordedBy: string;
  initialCash: number;
  totalCollected: number;
  totalExpenses: number;
  netAmount: number;
  notes: string;
  createdAt: any;
}

export const createShiftClosing = async (closing: Omit<ShiftClosing, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'shifts'), {
      ...closing,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'shifts');
    throw error;
  }
};

export const getAllShiftClosings = async (): Promise<ShiftClosing[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'shifts'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftClosing));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'shifts');
    return [];
  }
};

// --- Quality Control (QC) Operations ---
export interface QCCheck {
  id?: string;
  deviceName: string;
  status: 'passed' | 'failed';
  checkedBy: string;
  findings: string;
  createdAt: any;
}

export const addQCCheck = async (qc: Omit<QCCheck, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'qc'), {
      ...qc,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'qc');
    throw error;
  }
};

export const getAllQCChecks = async (): Promise<QCCheck[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'qc'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QCCheck));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'qc');
    return [];
  }
};

// --- Audit Trial Logs Operations ---
export interface AuditLog {
  id?: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  createdAt: any;
}

export const addAuditLog = async (log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'audit_logs'), {
      ...log,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'audit_logs');
    throw error;
  }
};

export const getAllAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'audit_logs'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'audit_logs');
    return [];
  }
};

// --- Interactive Customizable Tests Service ---
export const getCustomTestsCatalog = async (): Promise<TestCatalogItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'tests_catalog'));
    if (querySnapshot.empty) {
      // Seed initial ones first
      for (const item of LAB_TESTS_CATALOG) {
        await setDoc(doc(db, 'tests_catalog', item.id), item);
      }
      return LAB_TESTS_CATALOG;
    }
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestCatalogItem));
  } catch (error) {
    console.warn('Failed to fetch from firestore, using static LAB_TESTS_CATALOG fallback', error);
    return LAB_TESTS_CATALOG;
  }
};

export const updateCustomTestCatalogItem = async (itemId: string, updatedFields: Partial<TestCatalogItem>) => {
  try {
    await setDoc(doc(db, 'tests_catalog', itemId), updatedFields, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tests_catalog/${itemId}`);
  }
};

export const addCustomTestCatalogItem = async (item: TestCatalogItem) => {
  try {
    await setDoc(doc(db, 'tests_catalog', item.id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tests_catalog/${item.id}`);
  }
};

export const getOwnerEmail = async (): Promise<string> => {
  try {
    const docRef = doc(db, 'settings', 'ownership');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().ownerEmail?.toLowerCase() || 'mhm763517@gmail.com';
    }
    return 'mhm763517@gmail.com';
  } catch (err) {
    return 'mhm763517@gmail.com';
  }
};

export const updateOwnerEmail = async (newEmail: string): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', 'ownership');
    await setDoc(docRef, { ownerEmail: newEmail.trim().toLowerCase() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/ownership');
  }
};



