import { db, auth } from './firebase';
import { collection, addDoc, getDocs, doc, Timestamp, query, orderBy, limit } from 'firebase/firestore';

export interface LISNotification {
  id?: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  timestamp: string;
  read: boolean;
}

// Play notification sound using the Web Audio API (completely native, no external assets needed!)
export function playNotificationTone(type: 'success' | 'warning' | 'info' | 'error' | 'critical') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create oscillator and gain node
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'success') {
      // Elegant high double-beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'critical' || type === 'error') {
      // Alarm minor third down
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(370, now + 0.15); // F#4
      osc.frequency.setValueAtTime(440, now + 0.3);
      osc.frequency.setValueAtTime(370, now + 0.45);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'warning') {
      // Warm alert tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(554.37, now); // C#5
      osc.frequency.setValueAtTime(587.33, now + 0.12); // D5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Classic light notification bubble tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    console.warn('Audio Context tone failed (user interaction might be required):', e);
  }
}

// Fetch lists of latest notifications
export async function getNotifications(): Promise<LISNotification[]> {
  try {
    const qSnapshot = await getDocs(collection(db, 'notifications'));
    if (qSnapshot.empty) {
      return getLocalNotifications();
    }
    const list = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as LISNotification));
    return list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    return getLocalNotifications();
  }
}

// Add a notification with on-screen triggers
export async function pushNotification(notification: Omit<LISNotification, 'timestamp' | 'read'>) {
  const newNotif: LISNotification = {
    ...notification,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  // Save to Firestore for durability
  try {
    await addDoc(collection(db, 'notifications'), newNotif);
  } catch (e) {
    console.warn('Saving notification to firestore failed, falling back to local storage', e);
  }

  // Save to localStorage so we have redundancy
  const local = getLocalNotifications();
  local.unshift(newNotif);
  localStorage.setItem('lis_notifications_store', JSON.stringify(local.slice(0, 50)));

  // Play ambient alert audio
  playNotificationTone(newNotif.type);

  // Dispatch custom event for real-time update in active UI components
  window.dispatchEvent(new CustomEvent('lis_notification_received', { detail: newNotif }));
}

function getLocalNotifications(): LISNotification[] {
  const raw = localStorage.getItem('lis_notifications_store');
  if (!raw) {
    const initial: LISNotification[] = [];
    localStorage.setItem('lis_notifications_store', JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearNotifications() {
  localStorage.removeItem('lis_notifications_store');
  window.dispatchEvent(new CustomEvent('lis_notification_received'));
}
