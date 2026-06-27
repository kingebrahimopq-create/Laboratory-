import { db } from './supabase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp, query, where } from './supabase-firestore';
import { pushNotification } from './notifications';
import { autoDeductConsumables } from './inventory';

export interface HomeVisit {
  id?: string;
  patientId: string;
  patientNameAr: string;
  phone: string;
  address: string;
  visitDate: string;
  visitTime: string;
  testsReq: string[]; // string array e.g., ['Complete Blood Count', 'Fasting Blood Sugar']
  status: 'pending' | 'dispatched' | 'collected' | 'completed' | 'cancelled';
  phlebotomist?: string;
  notes?: string;
  createdAt: string;
}

export async function scheduleHomeVisit(visit: Omit<HomeVisit, 'createdAt' | 'status'>): Promise<string> {
  try {
    const newVisit: HomeVisit = {
      ...visit,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'home_visits'), newVisit);
    
    // Dispatch system notification
    pushNotification({
      title: 'New Home Visit Scheduled',
      titleAr: '🏠 تم جدولة طلب زيارة منزلية جديدة',
      message: `Scheduled a home visit for ${visit.patientNameAr} on ${visit.visitDate} at ${visit.visitTime}`,
      messageAr: `تم جدولة زيارة منزلية لسحب العينات للمريض (${visit.patientNameAr}) بتاريخ ${visit.visitDate} في تمام الساعة ${visit.visitTime}.`,
      type: 'info'
    });

    return docRef.id;
  } catch (e) {
    console.error('Failed to schedule home visit: ', e);
    throw e;
  }
}

export async function getAllHomeVisits(): Promise<HomeVisit[]> {
  try {
    const qSnapshot = await getDocs(collection(db, 'home_visits'));
    const list = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as HomeVisit));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error('Failed to get home visits: ', e);
    return [];
  }
}

export async function updateHomeVisitStatus(visitId: string, status: HomeVisit['status'], phlebotomistName?: string): Promise<void> {
  try {
    const dataToUpdate: any = { status };
    if (phlebotomistName) {
      dataToUpdate.phlebotomist = phlebotomistName;
    }
    
    await updateDoc(doc(db, 'home_visits', visitId), dataToUpdate);
    
    // Notification translation matching state shifts
    let alertTitle = 'Home Visit Status Shipped';
    let alertTitleAr = '🏠 تحديث طلب الزيارة المنزلية';
    let alertMsgAr = `تغيرت حالة طلب الزيارة للمريض إلى (${status === 'dispatched' ? 'تم الانطلاق الميداني' : status === 'collected' ? 'تم سحب العينة بنجاح' : status === 'completed' ? 'توصيل للمختبر وبدء الفحص' : 'ملغي'}).`;
    let type: any = 'info';

    if (status === 'collected') {
      type = 'success';
      alertTitleAr = '🧪 تم سحب العينات بالمنزل بنجاح';
      // Automatically deduct matching items from inventory (for example EDTA / Serum / Syringes used)
      await autoDeductConsumables('Home Specimen Visit Draw', visitId, 'sampled');
    }

    pushNotification({
      title: alertTitle,
      titleAr: alertTitleAr,
      message: `Home visit ID ${visitId} updated to ${status}`,
      messageAr: alertMsgAr,
      type
    });

  } catch (e) {
    console.error('Failed to update home visit: ', e);
  }
}
