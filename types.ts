
export const TARGET_AMOUNT = 350000;

export enum CollectionStatus {
  PROMISED = 'وعد سداد',
  NO_ANSWER = 'بدون اجابه',
  WRONG_DATA = 'بيانات خاطئة',
  UNRESOLVED = 'مشكلة غير محلوله',
  REFUSED = 'رافض السداد',
  SETTLED = 'تم السداد'
}

export type FixationOption = 'KEEP' | 'Rotation 1' | 'Rotation 2' | 'Rotation 3' | 'NEW';

export interface DashboardSettings {
  showKPIs: boolean;
  showSegments: boolean;
  showCalculator: boolean;
  showAIBanner: boolean;
  showHero: boolean;
}

export interface User {
  collectorName: string;
  username: string;
  password: string;
  isAdmin?: boolean;
  dashboardSettings?: DashboardSettings;
}

export interface ExemptionRequest {
  id: string;
  sabilOrderNumber: string; // 1. رقم طلب سيبل
  name: string;             // 2. اسم العميل
  orderDate: string;        // 3. تاريخ الطلب
  orderStatus: string;      // 4. حالة الطلب
  collectorName: string;    // 5. اسم الموظف
  mobile: string;           // 6. رقم الجوال (دولي)
  whatsAppLink: string;     // 7. رابط واتساب
  idNumber: string;         // 8. رقم الهوية
  description: string;      // 9. الوصف
}

export interface Customer {
  id: string;
  name: string; 
  accountNumber: string; 
  amount: number; 
  fixation: string; 
  status: string; 
  followUpDate: string; 
  idNumber: string; 
  mobile: string; 
  whatsAppLink: string; 
  collectorName: string; 
  employeeId: string; 
  supervisorName: string; 
  product: string; 
  debtAge: string; 
  businessEvaluation: string; 
  freezeDate: string; 
  ageOver60: string; 
  salaryClient: string; 
  isDeceased: string; 
  unarchivedBond: string; 
  caseNumber: string; 
  executiveReferenceNumber: string; 
  courtName: string; 
  sabilOrderNumber: string; 
  orderNotes: string; 
  balances: number; 
  discountRate: number; 
  settlementAmount: number; 
  paymentAmount: number; 
  withdrawn?: string; 
}

export const formatSaudiMobile = (mobile: string | number | undefined): string => {
  if (!mobile) return '';
  let cleaned = String(mobile).replace(/\D/g, '');
  
  // معالجة البادئة 00966
  if (cleaned.startsWith('00966')) {
    cleaned = cleaned.substring(2);
  }
  
  // معالجة 96605... وتحويلها إلى 9665...
  if (cleaned.startsWith('96605')) {
    return '966' + cleaned.substring(4);
  }
  
  // إذا كان الرقم يبدأ بـ 9665 وطوله 12 فهو صحيح
  if (cleaned.startsWith('9665') && cleaned.length === 12) {
    return cleaned;
  }

  // معالجة 05...
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    return '966' + cleaned.substring(1);
  }
  
  // معالجة 5... (بدون صفر)
  if (cleaned.startsWith('5') && cleaned.length === 9) {
    return '966' + cleaned;
  }
  
  // إذا كان يبدأ بـ 966 وطوله 12 (حالة عامة)
  if (cleaned.startsWith('966') && cleaned.length === 12) {
    return cleaned;
  }

  return cleaned;
};
