export interface VerificationResult {
  parameterKey: string;
  parameterName: string;
  value: number | string;
  normalRange: string;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  evaluationAr: string;
  colorClass: string;
}

export interface TestVerificationReport {
  isAutoVerified: boolean;
  needsPhysicianReview: boolean;
  overallStatus: 'normal' | 'flagged' | 'critical';
  overallStatusAr: string;
  parameters: VerificationResult[];
}

// Clinician configuration for biological ranges and panic alerts
export const BIOLOGICAL_RULES: Record<string, {
  minNormal: number;
  maxNormal: number;
  minPanic: number;
  maxPanic: number;
}> = {
  hemoglobin: { minNormal: 13.8, maxNormal: 17.2, minPanic: 7.5, maxPanic: 20.0 },
  wbc: { minNormal: 4.5, maxNormal: 11.0, minPanic: 2.0, maxPanic: 25.0 },
  platelets: { minNormal: 150, maxNormal: 450, minPanic: 50, maxPanic: 800 },
  fbs: { minNormal: 70, maxNormal: 100, minPanic: 50, maxPanic: 250 },
  hba1c: { minNormal: 4.0, maxNormal: 5.7, minPanic: 3.5, maxPanic: 9.5 },
  cholesterol: { minNormal: 100, maxNormal: 200, minPanic: 50, maxPanic: 300 },
  triglycerides: { minNormal: 50, maxNormal: 150, minPanic: 40, maxPanic: 450 },
  ldl: { minNormal: 50, maxNormal: 100, minPanic: 30, maxPanic: 190 },
  hdl: { minNormal: 40, maxNormal: 70, minPanic: 20, maxPanic: 100 },
  creatinine: { minNormal: 0.6, maxNormal: 1.2, minPanic: 0.3, maxPanic: 3.5 },
  urea: { minNormal: 7, maxNormal: 20, minPanic: 4, maxPanic: 60 },
  tsh: { minNormal: 0.4, maxNormal: 4.1, minPanic: 0.1, maxPanic: 12.0 },
  ft4: { minNormal: 0.9, maxNormal: 1.7, minPanic: 0.5, maxPanic: 3.5 }
};

// Evaluate actual test parameters and return results of rule verification
export function verifyTestResults(parameters: any, resultsForm: Record<string, string>): TestVerificationReport {
  let isAutoVerified = true;
  let needsPhysicianReview = false;
  let overallStatus: 'normal' | 'flagged' | 'critical' = 'normal';
  const checkedParams: VerificationResult[] = [];

  Object.entries(parameters).forEach(([key, param]: [string, any]) => {
    const rawVal = resultsForm[key] || '';
    const numericVal = parseFloat(rawVal);
    
    // Check if configuration exists
    const rule = BIOLOGICAL_RULES[key];
    
    if (isNaN(numericVal) || !rule) {
      // Non-numerical or unmapped values default to manual verified normal or unflagged block
      checkedParams.push({
        parameterKey: key,
        parameterName: param.name,
        value: rawVal || 'N/A',
        normalRange: param.normal,
        unit: param.unit,
        status: 'normal',
        evaluationAr: 'متروك للتقييم الكيفي للتقني',
        colorClass: 'text-slate-700'
      });
      return;
    }

    let status: VerificationResult['status'] = 'normal';
    let evaluationAr = 'سليم (ضمن النطاق الطبيعي)';
    let colorClass = 'text-emerald-600 font-extrabold';

    // Rule compliance evaluation
    if (numericVal < rule.minPanic) {
      status = 'critical';
      evaluationAr = '🚨 منخفض حرج (قيمة ذعر طبية! مهددة للحياة)';
      colorClass = 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-black animate-pulse';
      isAutoVerified = false;
      needsPhysicianReview = true;
      overallStatus = 'critical';
    } else if (numericVal > rule.maxPanic) {
      status = 'critical';
      evaluationAr = '🚨 مرتفع حرج (قيمة ذعر طبية! مهددة للحياة)';
      colorClass = 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-black animate-pulse';
      isAutoVerified = false;
      needsPhysicianReview = true;
      overallStatus = 'critical';
    } else if (numericVal < rule.minNormal) {
      status = 'low';
      evaluationAr = '📉 منخفض (خارج المعدل الطبيعي)';
      colorClass = 'text-blue-600 font-bold';
      isAutoVerified = false;
      overallStatus = overallStatus === 'critical' ? 'critical' : 'flagged';
    } else if (numericVal > rule.maxNormal) {
      status = 'high';
      evaluationAr = '📈 مرتفع (خارج المعدل الطبيعي)';
      colorClass = 'text-amber-600 font-bold';
      isAutoVerified = false;
      overallStatus = overallStatus === 'critical' ? 'critical' : 'flagged';
    }

    checkedParams.push({
      parameterKey: key,
      parameterName: param.name,
      value: numericVal,
      normalRange: param.normal,
      unit: param.unit,
      status,
      evaluationAr,
      colorClass
    });
  });

  return {
    isAutoVerified,
    needsPhysicianReview,
    overallStatus,
    overallStatusAr: overallStatus === 'normal' 
      ? 'معتمد تلقائياً - جميع المعدلات طبيعية' 
      : overallStatus === 'flagged' 
        ? 'يحتاج مراجعة الطبيب الاستشاري (خارج المعدلات الطبيعية للتحليل)' 
        : '⚠️ إخطار ذعر فوري للمستشفى وحالة حرجة (يتطلب اعتماد استشاري عاجل!)',
    parameters: checkedParams
  };
}
