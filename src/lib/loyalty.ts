import { Patient, Test } from '../types';

export interface LoyaltyPointsStatus {
  totalSpent: number;
  accruedPoints: number;
  spentHistoryPoints: number;
  currentPoints: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  tierAr: string;
  tierColor: string;
  benefitsAr: string;
}

// Calculate loyalty status based on patient transactions and previous tests
export function computeLoyaltyStatus(patient: Patient, patientTests: Test[]): LoyaltyPointsStatus {
  // Total money collected from this patient
  const totalSpent = patientTests.reduce((sum, test) => {
    // Ensure we handle numeric amount
    return sum + (Number(test.amountCollected) || 0);
  }, 0);

  // 1 loyalty point is rewarded for every 10 SDG/Saudi Riyals/EGP spent
  const accruedPoints = Math.floor(totalSpent / 10);

  // Read redeemed points from patient properties if set
  const spentHistoryPoints = (patient as any).spentLoyaltyPoints || 0;
  const currentPoints = Math.max(0, accruedPoints - spentHistoryPoints);

  let tier: LoyaltyPointsStatus['tier'] = 'Silver';
  let tierAr = 'الفئة الفضية';
  let tierColor = 'from-slate-400 to-slate-200 text-slate-800 border-slate-300';
  let benefitsAr = 'مكافآت عامة وخصم نقاط بسيط';

  if (accruedPoints >= 300) {
    tier = 'Platinum';
    tierAr = '🌟 الفئة البلاتينية النخبوية';
    tierColor = 'from-indigo-600 via-indigo-500 to-slate-900 text-white border-indigo-500';
    benefitsAr = 'خصم فوري 25% على كافة الفحوصات المستجدة وأولوية القصوى بالطابور المنزلي';
  } else if (accruedPoints >= 100) {
    tier = 'Gold';
    tierAr = '✨ الفئة الذهبية المتقدمة';
    tierColor = 'from-amber-400 to-amber-200 text-amber-900 border-amber-300';
    benefitsAr = 'سحب عينات منزلي مخفض بنصف السعر ومكافآت دورية';
  }

  return {
    totalSpent,
    accruedPoints,
    spentHistoryPoints,
    currentPoints,
    tier,
    tierAr,
    tierColor,
    benefitsAr
  };
}

// Discount translation: every 10 points redeemed equals 5 units of currency discount
export function calculateRedemptionDiscount(pointsToRedeem: number): number {
  return pointsToRedeem * 0.5;
}
