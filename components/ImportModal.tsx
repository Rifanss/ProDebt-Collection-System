
import React, { useState, useRef } from 'react';
import { Customer, formatSaudiMobile } from '../types.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (customers: Customer[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<{ count: number; totalAmount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tempCustomersRef = useRef<Customer[]>([]);

  const parseCSV = (text: string): any[] => {
    try {
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      const lines = cleanText.split(/\r?\n/);
      if (lines.length < 2) return [];
      const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
      const results = [];
      const regex = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const currentLine = lines[i].split(regex).map(v => v ? v.trim().replace(/"/g, '') : '');
        const obj: any = {};
        headers.forEach((header, index) => { if (header) obj[header] = currentLine[index] || ''; });
        results.push(obj);
      }
      return results;
    } catch (err) { return []; }
  };

  const mapData = async (rawData: any[]) => {
    setIsProcessing(true);
    const headers = Object.keys(rawData[0] || {});
    const findCol = (exactName: string) => headers.find(h => h.trim() === exactName) || '';

    // الالتزام التام بأسماء الأعمدة الـ 29 المعتمدة
    const colMap = {
      name: findCol('اسم العميل'),
      account: findCol('رقم الحساب'),
      amount: findCol('مبلغ المديونية'),
      fixation: findCol('التثبيت'),
      status: findCol('الاكشن'),
      followUp: findCol('تاريخ المتابعة'),
      idNum: findCol('رقم الهوية'),
      mobile: findCol('رقم الجوال'),
      waLink: findCol('زر تواصل واتساب'),
      collector: findCol('اسم المحصل'),
      empId: findCol('الرقم الوظيفي للمحصل id'),
      supervisor: findCol('اسم المشرف'),
      product: findCol('نوع المنتج'),
      debtAge: findCol('عمر الدين'),
      evaluation: findCol('حسابات تقييم أعمال'),
      freeze: findCol('تاريخ التجميد'),
      age60: findCol('عمر العميل فوق 60'),
      salary: findCol('عميل رواتب'),
      deceased: findCol('عميل متوفي'),
      bond: findCol('سند غير مؤرشف'),
      case: findCol('رقم القضية'),
      execRef: findCol('رقم المرجع التنفيذي'),
      court: findCol('اسم المحكمة'),
      sabil: findCol('رقم طلب سيبل'),
      notes: findCol('ملاحظات على الطلب'),
      bal: findCol('الأرصدة'),
      disc: findCol('نسبة الخصم'),
      settle: findCol('مبلغ التسوية'),
      pay: findCol('السداد'),
    };

    const isYes = (v: any) => {
      const s = String(v || '').toLowerCase().trim();
      return ['yes', 'نعم', '1', 'true', 'y', '✅'].includes(s);
    };

    const mapped: Customer[] = rawData.map((row, i) => {
      let p = String(row[colMap.product] || '').toUpperCase().trim();
      if (p.includes('PF') || p.includes('شخصي') || p === 'BF') p = 'BF';
      else if (p.includes('AL') || p.includes('تأجيري')) p = 'AL';
      else if (p.includes('CC') || p.includes('بطاقة')) p = 'CC';

      return {
        id: `C-${i}-${Date.now()}`,
        name: String(row[colMap.name] || '').trim(),
        accountNumber: String(row[colMap.account] || '').trim(),
        amount: parseFloat(String(row[colMap.amount] || '0').replace(/[^0-9.-]/g, '')) || 0,
        fixation: String(row[colMap.fixation] || '').trim(),
        status: String(row[colMap.status] || 'بدون اجابة').trim(),
        followUpDate: String(row[colMap.followUp] || '').trim(),
        idNumber: String(row[colMap.idNum] || '').trim(),
        mobile: formatSaudiMobile(row[colMap.mobile]),
        whatsAppLink: String(row[colMap.waLink] || '').trim(),
        collectorName: String(row[colMap.collector] || '').trim(),
        employeeId: String(row[colMap.empId] || '').trim(),
        supervisorName: String(row[colMap.supervisor] || '').trim(),
        product: p,
        debtAge: String(row[colMap.debtAge] || '').trim(),
        businessEvaluation: String(row[colMap.evaluation] || '').trim(),
        freezeDate: String(row[colMap.freeze] || '').trim(),
        ageOver60: isYes(row[colMap.age60]) ? 'Yes' : 'No',
        salaryClient: isYes(row[colMap.salary]) ? 'Yes' : 'No',
        isDeceased: isYes(row[colMap.deceased]) ? 'Yes' : 'No',
        unarchivedBond: isYes(row[colMap.bond]) ? 'Yes' : 'No',
        caseNumber: String(row[colMap.case] || '').trim(),
        executiveReferenceNumber: String(row[colMap.execRef] || '').trim(),
        courtName: String(row[colMap.court] || '').trim(),
        sabilOrderNumber: String(row[colMap.sabil] || '').trim(),
        orderNotes: String(row[colMap.notes] || '').trim(),
        balances: parseFloat(String(row[colMap.bal] || '0').replace(/[^0-9.-]/g, '')) || 0,
        discountRate: parseFloat(String(row[colMap.disc] || '0').replace(/[^0-9.-]/g, '')) || 0,
        settlementAmount: parseFloat(String(row[colMap.settle] || '0').replace(/[^0-9.-]/g, '')) || 0,
        paymentAmount: parseFloat(String(row[colMap.pay] || '0').replace(/[^0-9.-]/g, '')) || 0,
      };
    });

    tempCustomersRef.current = mapped;
    setPreviewData({ count: mapped.length, totalAmount: mapped.reduce((s, c) => s + c.amount, 0) });
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-brand-primary p-6 text-white text-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">استيراد المحفظة</h2>
          <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest font-black">Official Matrix Import Engine</p>
        </div>
        <div className="p-8 space-y-4">
          {isProcessing ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-teal-50 border-t-teal-500 animate-spin mx-auto mb-4 rounded-none"></div>
              <p className="text-xs font-bold text-slate-500">جاري مطابقة الـ 29 عموداً المعتمدة...</p>
            </div>
          ) : previewData ? (
            <div className="text-center space-y-6">
              <div className="bg-slate-50 p-8 rounded-none border border-slate-100 flex flex-col items-center">
                <p className="text-4xl font-black text-brand-primary">{previewData.count.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">سجل تم التعرف عليه بنجاح</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => { onImport(tempCustomersRef.current); onClose(); }} className="w-full py-5 bg-teal-600 text-white rounded-none font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl">تأكيد استيراد البيانات</button>
                <button onClick={() => { setPreviewData(null); tempCustomersRef.current = []; }} className="w-full py-3 bg-slate-100 text-slate-600 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">إلغاء واختيار ملف آخر</button>
              </div>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-slate-200 p-10 text-center rounded-none hover:border-brand-primary transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => mapData(parseCSV(ev.target?.result as string));
                    reader.readAsText(file);
                  }
                }} />
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">اختر ملف CSV المعتمد</p>
                <p className="text-[9px] text-slate-300 mt-2 font-bold italic">يجب أن يحتوي الملف على الـ 29 عموداً المحددة.</p>
              </div>
              
              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-100 text-slate-500 border border-slate-200 rounded-none hover:bg-slate-200 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <span>🏠</span>
                <span>الرجوع للصفحة الرئيسية</span>
              </button>
            </>
          )}
        </div>
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Matrix v4.6 Column Lock System Active</p>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
