/**
 * Firebase Storage Backup Service
 * - تسجيل الدخول بحساب Google عبر Firebase Auth (signInWithPopup - يعمل على الويب والأندرويد)
 * - رفع تلقائي عند وجود تغييرات كل 5 دقائق
 * - استعادة أي نسخة سابقة
 */
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  onAuthStateChanged, signOut, User
} from 'firebase/auth';
import {
  getStorage, ref, uploadString,
  getDownloadURL, listAll, getMetadata, deleteObject
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const fbApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const fbAuth = getAuth(fbApp);
const fbStorage = getStorage(fbApp);

const gProvider = new GoogleAuthProvider();
gProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
gProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
gProvider.setCustomParameters({ prompt: 'select_account' });

export interface BackupEntry {
  fileName: string;
  path: string;
  uploadedAt: string;
  sizeBytes: number;
}

export interface SyncState {
  isSignedIn: boolean;
  user: { name: string; email: string; avatar: string } | null;
  lastSync: string | null;
  pendingChanges: boolean;
}

let _currentUser: User | null = null;
let _lastSyncHash: string | null = localStorage.getItem('fb_last_sync_hash');
let _autoSyncTimer: ReturnType<typeof setInterval> | null = null;
let _dataProvider: (() => any) | null = null;
let _onSyncStateChange: ((s: SyncState) => void) | null = null;

function hashData(data: any): string {
  const str = JSON.stringify(data);
  let h = 0;
  for (let i = 0; i < Math.min(str.length, 10000); i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return h.toString(16);
}

function _hasPendingChanges(): boolean {
  if (!_dataProvider) return false;
  return hashData(_dataProvider()) !== _lastSyncHash;
}

function _notifyState() {
  if (!_onSyncStateChange) return;
  _onSyncStateChange({
    isSignedIn: !!_currentUser,
    user: _currentUser ? {
      name: _currentUser.displayName || _currentUser.email || 'مستخدم',
      email: _currentUser.email || '',
      avatar: _currentUser.photoURL || ''
    } : null,
    lastSync: localStorage.getItem('fb_last_sync'),
    pendingChanges: _hasPendingChanges()
  });
}

export const initStorageAuth = (onStateChange: (s: SyncState) => void) => {
  _onSyncStateChange = onStateChange;
  return onAuthStateChanged(fbAuth, (user) => {
    _currentUser = user;
    _notifyState();
  });
};

/**
 * تسجيل الدخول بـ Google Popup (يعمل على الويب + Capacitor Android)
 */
export const googleSignInStorage = async (): Promise<User | null> => {
  const result = await signInWithPopup(fbAuth, gProvider);
  _currentUser = result.user;
  const cred = GoogleAuthProvider.credentialFromResult(result);
  if (cred?.accessToken) localStorage.setItem('firebase_access_token', cred.accessToken);
  _notifyState();
  return result.user;
};

/** Kept for backward compatibility - popup flow doesn't need redirect */
export const handleStorageRedirectResult = async (): Promise<User | null> => null;

export const googleSignOutStorage = async () => {
  await signOut(fbAuth);
  _currentUser = null;
  localStorage.removeItem('firebase_access_token');
  _notifyState();
};

export const getCurrentStorageUser = () => _currentUser;

function userBackupPath(fileName: string): string {
  if (!_currentUser) throw new Error('يجب تسجيل الدخول أولاً');
  return `backups/${_currentUser.uid}/${fileName}`;
}

export const uploadBackup = async (data: any): Promise<{ success: boolean; message: string; fileName?: string }> => {
  if (!_currentUser) return { success: false, message: 'يجب تسجيل الدخول بحساب Google أولاً' };
  if (!navigator.onLine) return { success: false, message: '⚠️ لا يوجد اتصال — سيتم الرفع عند استعادة الاتصال' };

  const fileName = `MyLab_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const path = userBackupPath(fileName);

  try {
    const storageRef = ref(fbStorage, path);
    await uploadString(storageRef, JSON.stringify(data, null, 2), 'raw', {
      contentType: 'application/json',
      customMetadata: { uploadedAt: new Date().toISOString(), version: '2.0' }
    });
    const hash = hashData(data);
    _lastSyncHash = hash;
    localStorage.setItem('fb_last_sync_hash', hash);
    localStorage.setItem('fb_last_sync', new Date().toISOString());
    _notifyState();
    return { success: true, message: '✓ تم رفع النسخة الاحتياطية إلى Firebase بنجاح!', fileName };
  } catch (err: any) {
    console.error('Firebase upload error:', err);
    return { success: false, message: `❌ فشل الرفع: ${err.message || 'خطأ غير معروف'}` };
  }
};

export const listBackups = async (): Promise<BackupEntry[]> => {
  if (!_currentUser || !navigator.onLine) return [];
  try {
    const listRef = ref(fbStorage, `backups/${_currentUser.uid}/`);
    const result = await listAll(listRef);
    const entries = await Promise.all(result.items.map(async (item) => {
      try {
        const meta = await getMetadata(item);
        return {
          fileName: item.name,
          path: item.fullPath,
          uploadedAt: meta.customMetadata?.uploadedAt || meta.updated,
          sizeBytes: meta.size
        } as BackupEntry;
      } catch { return null; }
    }));
    return (entries.filter(Boolean) as BackupEntry[])
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  } catch (err) {
    console.error('listBackups error:', err);
    return [];
  }
};

export const downloadBackup = async (entry: BackupEntry): Promise<any> => {
  if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');
  const url = await getDownloadURL(ref(fbStorage, entry.path));
  const res = await fetch(url);
  if (!res.ok) throw new Error('فشل تنزيل النسخة الاحتياطية');
  return res.json();
};

export const pruneOldBackups = async (keepCount = 10) => {
  const backups = await listBackups();
  if (backups.length <= keepCount) return;
  await Promise.all(
    backups.slice(keepCount).map(b => deleteObject(ref(fbStorage, b.path)).catch(() => {}))
  );
};

export const triggerManualSync = async (data: any) => uploadBackup(data);

export const startAutoSync = (dataProvider: () => any, intervalMs = 300000) => {
  _dataProvider = dataProvider;
  if (_autoSyncTimer) clearInterval(_autoSyncTimer);

  const trySync = async () => {
    if (!_currentUser || !navigator.onLine || !_hasPendingChanges()) return;
    await uploadBackup(dataProvider());
    await pruneOldBackups(10);
  };

  window.addEventListener('online', trySync);
  _autoSyncTimer = setInterval(trySync, intervalMs);
  setTimeout(trySync, 5000);
};

export const stopAutoSync = () => {
  if (_autoSyncTimer) { clearInterval(_autoSyncTimer); _autoSyncTimer = null; }
};
