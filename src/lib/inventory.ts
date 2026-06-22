import { db } from './firebase';
import { collection, addDoc, getDocs, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { pushNotification } from './notifications';

export interface InventoryItem {
  id: string; // e.g., 'blood_edta', 'blood_serum', 'glucose_reagent', 'cbc_lyse', 'thyroid_reagent'
  name: string;
  nameAr: string;
  category: 'tubes' | 'reagents' | 'consumables';
  categoryAr: 'أنابيب سحب' | 'محاليل كيميائية' | 'مستهلكات عامة';
  quantity: number;
  minTarget: number; // For low-stock threshold warning
  unit: string;
  unitAr: string;
}

export interface InventoryLog {
  id?: string;
  itemId: string;
  itemNameAr: string;
  quantityConsumed: number;
  testType: string;
  testId: string;
  timestamp: string;
  detailsAr: string;
  recordedBy: string;
}

// Default standard list of medical consumables
export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'blood_edta',
    name: 'EDTA Lavender Tube',
    nameAr: 'أنبوب EDTA البنفسجي (CBC)',
    category: 'tubes',
    categoryAr: 'أنابيب سحب',
    quantity: 180,
    minTarget: 30,
    unit: 'pcs',
    unitAr: 'قطعة'
  },
  {
    id: 'blood_serum',
    name: 'Gel & Clot Activator Tube',
    nameAr: 'أنبوب الجيل الأصفر (الكبد/الدهون/الكلى)',
    category: 'tubes',
    categoryAr: 'أنابيب سحب',
    quantity: 220,
    minTarget: 40,
    unit: 'pcs',
    unitAr: 'قطعة'
  },
  {
    id: 'blood_fluoride',
    name: 'Fluoride Grey Tube',
    nameAr: 'أنبوب فلوريد الصوديوم الرمادي (السكر)',
    category: 'tubes',
    categoryAr: 'أنابيب سحب',
    quantity: 120,
    minTarget: 25,
    unit: 'pcs',
    unitAr: 'قطعة'
  },
  {
    id: 'cbc_reagent',
    name: 'CBC Diluent / Lyse Reagent',
    nameAr: 'محلول محلل خلايا الدم Sysmex Cellpack',
    category: 'reagents',
    categoryAr: 'محاليل كيميائية',
    quantity: 85,
    minTarget: 15,
    unit: 'tests',
    unitAr: 'فحص'
  },
  {
    id: 'glucose_kit',
    name: 'Glucose Enzymatic Reagent Kit',
    nameAr: 'كاشف فحص الجلوكوز السكري',
    category: 'reagents',
    categoryAr: 'محاليل كيميائية',
    quantity: 90,
    minTarget: 20,
    unit: 'tests',
    unitAr: 'فحص'
  },
  {
    id: 'lipid_reagent',
    name: 'Cholesterol/Triglycerides Reagent Kit',
    nameAr: 'كاشف فحص الدهون الثلاثية والكوليسترول',
    category: 'reagents',
    categoryAr: 'محاليل كيميائية',
    quantity: 120,
    minTarget: 20,
    unit: 'tests',
    unitAr: 'فحص'
  },
  {
    id: 'kidney_reagent',
    name: 'Creatinine/Urea Enzymatic Reagent Kit',
    nameAr: 'كاشف فحص وظائف الكلى (يوريا وكرياتينين)',
    category: 'reagents',
    categoryAr: 'محاليل كيميائية',
    quantity: 110,
    minTarget: 15,
    unit: 'tests',
    unitAr: 'فحص'
  },
  {
    id: 'thyroid_elisa',
    name: 'TSH/FT4 ELISA Reagent Wells',
    nameAr: 'كواشف الغدة الدرقية ELISA هرمونات',
    category: 'reagents',
    categoryAr: 'محاليل كيميائية',
    quantity: 60,
    minTarget: 12,
    unit: 'tests',
    unitAr: 'فحص'
  },
  {
    id: 'sterile_syringes',
    name: 'Sterile 5ml Disposable Syringes',
    nameAr: 'سرنجات سحب معقمة 5 مل',
    category: 'consumables',
    categoryAr: 'مستهلكات عامة',
    quantity: 300,
    minTarget: 50,
    unit: 'pcs',
    unitAr: 'حقنة'
  }
];

// Initialize and Fetch current inventory items
export async function getInventory(): Promise<InventoryItem[]> {
  try {
    const qSnapshot = await getDocs(collection(db, 'inventory'));
    if (qSnapshot.empty) {
      // Seed default stock
      for (const item of DEFAULT_INVENTORY_ITEMS) {
        await setDoc(doc(db, 'inventory', item.id), item);
      }
      return DEFAULT_INVENTORY_ITEMS;
    }
    return qSnapshot.docs.map(d => d.data() as InventoryItem);
  } catch (e) {
    console.warn('Inventory fetch failed, using fallback memory state', e);
    return DEFAULT_INVENTORY_ITEMS;
  }
}

// Fetch live deduction logs
export async function getInventoryLogs(): Promise<InventoryLog[]> {
  try {
    const qSnapshot = await getDocs(collection(db, 'inventory_logs'));
    const list = qSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryLog));
    return list.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    return [];
  }
}

// Replenish stock level of a specific item
export async function restructureStock(itemId: string, newQty: number): Promise<void> {
  try {
    await updateDoc(doc(db, 'inventory', itemId), { quantity: newQty });
    pushNotification({
      title: 'Stock Updated Successfully',
      titleAr: 'تم تحديث عهدة المستندات والمخزون',
      message: `Updated inventory item ${itemId} stock to ${newQty}.`,
      messageAr: `تم تحديث رصيد الصنف المختار في المخزن بنجاح إلى (${newQty} وحدات).`,
      type: 'info'
    });
  } catch (e) {
    console.warn('Restructuring stock failed', e);
  }
}

// Automatic Deduction Trigger Engine
// Triggered on Sample collection complete (for tubes/syringes) or Test parameter submission (for Reagents!)
export async function autoDeductConsumables(testType: string, testId: string, stage: 'sampled' | 'completed'): Promise<void> {
  try {
    const stock = await getInventory();
    const deductions: { itemId: string; qty: number }[] = [];

    // Parse test keys
    const lowerType = testType.toLowerCase();
    
    if (stage === 'sampled') {
      // General phlebotomists tubes and syringe consumption on blood collection
      deductions.push({ itemId: 'sterile_syringes', qty: 1 });
      
      if (lowerType.includes('cbc') || lowerType.includes('دم')) {
        deductions.push({ itemId: 'blood_edta', qty: 1 });
      } else if (lowerType.includes('سكر') || lowerType.includes('glucose') || lowerType.includes('fbs')) {
        deductions.push({ itemId: 'blood_fluoride', qty: 1 });
      } else {
        // Lipid Profile, Renal Panel, Liver, Thyroid etc require serum tubes
        deductions.push({ itemId: 'blood_serum', qty: 1 });
      }
    } else if (stage === 'completed') {
      // Reagent consumption when result is finalized on analyzer/tech workstation
      if (lowerType.includes('cbc') || lowerType.includes('دم')) {
        deductions.push({ itemId: 'cbc_reagent', qty: 1 });
      } else if (lowerType.includes('سكر') || lowerType.includes('glucose') || lowerType.includes('fbs')) {
        deductions.push({ itemId: 'glucose_kit', qty: 1 });
      } else if (lowerType.includes('دهون') || lowerType.includes('lipid')) {
        deductions.push({ itemId: 'lipid_reagent', qty: 1 });
      } else if (lowerType.includes('كلى') || lowerType.includes('renal') || lowerType.includes('kidney')) {
        deductions.push({ itemId: 'kidney_reagent', qty: 1 });
      } else if (lowerType.includes('غدة') || lowerType.includes('thyroid') || lowerType.includes('tsh')) {
        deductions.push({ itemId: 'thyroid_elisa', qty: 1 });
      }
    }

    if (deductions.length === 0) return;

    for (const d of deductions) {
      const match = stock.find(item => item.id === d.itemId);
      if (!match) continue;

      const updatedQty = Math.max(0, match.quantity - d.qty);
      
      // Update in Firestore
      await updateDoc(doc(db, 'inventory', match.id), { quantity: updatedQty });

      // Create inventory log
      const detailsAr = stage === 'sampled' 
        ? `استهلاك تلقائي لأغراض سحب العينة للفحص (${testType})` 
        : `استهلاك تلقائي للمحلول الطبي عند اعتماد نتيجة الفحص (${testType})`;

      await addDoc(collection(db, 'inventory_logs'), {
        itemId: match.id,
        itemNameAr: match.nameAr,
        quantityConsumed: d.qty,
        testType,
        testId,
        timestamp: new Date().toISOString(),
        detailsAr,
        recordedBy: 'محرك أتمتة العمليات (Auto-Deduction Engine)'
      });

      // Low Stock Warning alert trigger
      if (updatedQty <= match.minTarget) {
        await pushNotification({
          title: 'Low Stock Level Alert',
          titleAr: '⚠️ انخفاض مخزون المستهلكات الطبية!',
          message: `Item ${match.name} is low on stock (${updatedQty} left).`,
          messageAr: `انخفض رصيد الصنف (${match.nameAr}) إلى مستوى حرج العتبة (${updatedQty} ${match.unitAr} متبقية!). الرجاء إعادة عهدة المخزن.`,
          type: 'warning'
        });
      }
    }
  } catch (e) {
    console.error('Failed to auto-deduct reagents/consumables', e);
  }
}
