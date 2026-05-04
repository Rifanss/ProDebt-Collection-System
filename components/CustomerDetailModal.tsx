
import React, { useState, useMemo } from 'react';
import { Customer, CollectionStatus, formatSaudiMobile } from '../types.ts';
import CopyButton from './CopyButton.tsx';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
  onUpdateField?: (id: string, field: keyof Customer, value: any) => void;
  messageTemplate?: string;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, onClose, onUpdateField, messageTemplate }) => {
  const [localNotes, setLocalNotes] = useState(customer?.orderNotes || '');
  const [localFollowUp, setLocalFollowUp] = useState(customer?.followUpDate || '');
  const [localFreezeDate, setLocalFreezeDate] = useState(customer?.freezeDate || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const debtAgeYears = useMemo(() => {
    if (!localFreezeDate) return 0;
    try {
      const freeze = new Date(localFreezeDate);
      const now = new Date();
      if (isNaN(freeze.getTime())) return 0;
      return Math.abs(now.getTime() - freeze.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    } catch (e) {
      return 0;
    }
  }, [localFreezeDate]);

  const policyDiscount = useMemo(() => {
    if (!customer || !localFreezeDate) return 0;
    if (customer.isDeceased === 'Yes' || customer.ageOver60 === 'Yes') return 60;

    const hasCase = !!customer.caseNumber && customer.caseNumber !== 'لا يوجد' && customer.caseNumber !== '';
    const isUnarchived = customer.unarchivedBond === 'Yes';
    let base = 0;

    if (customer.product === 'AL') {
      if (debtAgeYears >= 10) base = 60;
      else if (debtAgeYears >= 5) base = 45;
      else if (debtAgeYears >= 4) base = 40;
      else if (debtAgeYears >= 3) base = 35;
      else if (debtAgeYears >= 2) base = 25;
      else if (debtAgeYears >= 1) base = 15;
      else base = 10;
    } else {
      if (hasCase) {
        if (debtAgeYears >= 15) base = 75;
        else if (debtAgeYears >= 10) base = 70;
        else if (debtAgeYears >= 5) base = 65;
        else if (debtAgeYears >= 4) base = 60;
        else if (debtAgeYears >= 3) base = 55;
        else if (debtAgeYears >= 2) base = 45;
        else if (debtAgeYears >= 1) base = 30;
        else base = 20;
      } else {
        if (debtAgeYears >= 15) base = 75;
        else if (debtAgeYears >= 10) base = 70;
        else if (debtAgeYears >= 5) base = 60;
        else if (debtAgeYears >= 4) base = 55;
        else if (debtAgeYears >= 3) base = 50;
        else if (debtAgeYears >= 2) base = 40;
        else if (debtAgeYears >= 1) base = 20;
        else base = 20;
      }
      if (!hasCase && isUnarchived && customer.product === 'PF') {
        base += 10;
      }
    }
    return Math.min(base, 80);
  }, [customer, localFreezeDate, debtAgeYears]);

  if (!customer) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleSaveAll = () => {
    if (onUpdateField) {
      setIsUpdating(true);
      onUpdateField(customer.id, 'orderNotes', localNotes);
      onUpdateField(customer.id, 'followUpDate', localFollowUp);
      onUpdateField(customer.id, 'freezeDate', localFreezeDate);
      if (localFreezeDate) {
        onUpdateField(customer.id, 'discountRate', policyDiscount);
        onUpdateField(customer.id, 'settlementAmount', customer.amount * (1 - policyDiscount/100));
      }
      setTimeout(() => setIsUpdating(false), 500);
    }
  };

  const generateWhatsAppLink = () => {
    if (!messageTemplate || !customer.mobile) return '#';
    const customerParts = customer.name.trim().split(/\s+/);
    const customerFirstName = customerParts[0] || '';
    const collectorFirstName = (customer.collectorName || '').split(' ')[0];
    
    // حساب مبلغ التسوية بناءً على الخصم الحالي
    const currentDiscount = localFreezeDate ? policyDiscount : (customer.discountRate || 0);
    const settlement = customer.amount * (1 - currentDiscount/100);
    
    let msg = messageTemplate
      .replace(/{customerName}/g, customer.name)
      .replace(/{customerFirstName}/g, customerFirstName)
      .replace(/{amount}/g, formatCurrency(customer.amount) + " SAR")
      .replace(/{product}/g, customer.product || '')
      .replace(/{collectorName}/g, customer.collectorName || '')
      .replace(/{collectorFirstName}/g, collectorFirstName)
      .replace(/{settlementAmount}/g, formatCurrency(settlement) + " SAR")
      .replace(/{debtAge}/g, customer.debtAge || '')
      .replace(/{freezeDate}/g, localFreezeDate || 'غير محدد');
      
    const mobile = formatSaudiMobile(customer.mobile);
    return `https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`;
  };

  const DetailItem = ({ label, value, highlight = false, copyable = false, color = 'text-slate-800' }: { label: string, value: string | number, highlight?: boolean, copyable?: boolean, color?: string }) => (
    <div className={`p-2.5 border-b border-l text-center transition-all ${highlight ? 'bg-teal-50/50 border-teal-100 shadow-inner' : 'bg-white border-slate-100'}`}>
      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
      <div className="flex items-center justify-center gap-1.5">
        <p className={`text-[10px] font-bold ${highlight ? 'text-teal-700' : color}`}>{value || '-'}</p>
        {copyable && value && <CopyButton text={String(value)} />}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white w-full max-w-full md:max-w-4xl shadow-premium overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] md:rounded-none">
        
        {/* Header Section */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-none -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="flex items-center gap-4 text-right relative z-10">
            <div className="w-10 h-10 bg-white/10 rounded-none flex items-center justify-center text-xl shadow-lg border border-white/10">👤</div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base md:text-lg font-bold">{customer.name}</h2>
                <CopyButton text={customer.name} className="text-white/40 hover:text-white" />
              </div>
              <div className="flex gap-3 text-[9px] font-bold text-white/50 uppercase mt-0.5 items-center">
                <span className="bg-white/10 px-1.5 py-0.5 rounded-none flex items-center gap-1">
                  {customer.accountNumber}
                  <CopyButton text={customer.accountNumber} className="text-white/30 hover:text-white" />
                </span>
                <span className="text-teal-400">مديونية: {formatCurrency(customer.amount)} SAR</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-rose-500 hover:text-white rounded-none transition-all text-xl font-light z-10">&times;</button>
        </div>

        {/* Quick Communication Bar */}
        <div className="bg-white border-b border-slate-100 p-2 flex items-center justify-center gap-3">
            {customer.mobile && (
             <a 
               href={`tel:${formatSaudiMobile(customer.mobile)}`}
               className="flex-1 max-w-[180px] flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-none font-bold text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
             >
               <span>📞 هاتف</span>
             </a>
           )}
           <a 
              href={customer.mobile ? generateWhatsAppLink() : '#'} 
              target={customer.mobile ? "_blank" : "_self"}
              className={`flex-1 max-w-[180px] flex items-center justify-center gap-2 py-2 rounded-none font-bold text-[10px] uppercase transition-all shadow-sm border ${customer.mobile ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'}`}
           >
              <span>💬 WhatsApp</span>
           </a>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-slate-50/30 custom-scrollbar">
          {/* Policy Calculation Alert */}
          <div className={`p-4 transition-all duration-700 border-b flex flex-col md:flex-row items-center justify-between gap-3 relative overflow-hidden ${localFreezeDate ? 'bg-slate-900 text-white border-white/5' : 'bg-slate-100 border-slate-200'}`}>
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-500 via-transparent to-transparent"></div>
             <div className="text-right relative z-10 w-full md:w-auto">
               <p className="text-lg md:text-xl font-bold">{localFreezeDate ? 'الخصم المعتمد حسب السياسة' : ''}</p>
             </div>
             {localFreezeDate ? (
               <div className="flex items-center gap-6 relative z-10 w-full md:w-auto justify-around">
                 <div className="text-center">
                   <p className="text-[9px] font-bold text-teal-400 uppercase mb-0.5 opacity-60">الخصم</p>
                   <p className="text-3xl font-bold text-white leading-none">%{policyDiscount}</p>
                 </div>
                 <div className="w-[1px] h-8 bg-white/10"></div>
                 <div className="text-center">
                   <p className="text-[9px] font-bold text-teal-400 uppercase mb-0.5 opacity-60">مبلغ التسوية</p>
                   <p className="text-xl font-bold text-teal-400 leading-none tabular-nums">{formatCurrency(customer.amount * (1 - policyDiscount/100))} <span className="text-[9px] font-bold">SAR</span></p>
                 </div>
               </div>
             ) : (
               <div className="text-center px-4 py-1.5 bg-slate-200/50 rounded-none text-[9px] font-bold uppercase text-slate-400">يُرجى إدخال تاريخ التجميد أدناه</div>
             )}
          </div>

          <div className="p-4 space-y-6">
            
            {/* القسم 1: البيانات المالية الأساسية */}
            <section>
              <div className="flex items-center gap-3 mb-3 pr-2 border-r-4 border-emerald-500">
                <h3 className="text-[11px] font-bold text-slate-600 uppercase">البيانات المالية الأساسية</h3>
                <div className="flex-1 h-[1px] bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border border-slate-100 rounded-none overflow-hidden shadow-soft">
                <DetailItem label="مبلغ المديونية" value={formatCurrency(customer.amount)} highlight={true} color="text-teal-600" />
                <DetailItem label="الأرصدة المتوفرة" value={formatCurrency(customer.balances)} color="text-emerald-600" />
                <DetailItem label="مبلغ التسوية" value={formatCurrency(customer.settlementAmount || (customer.amount * (1 - policyDiscount/100)))} highlight={true} color="text-teal-600" />
                <DetailItem label="نسبة الخصم" value={`%${customer.discountRate || policyDiscount}`} />
                <DetailItem label="السداد الفعلي" value={formatCurrency(customer.paymentAmount || 0)} color="text-amber-600" />
                <DetailItem label="نوع المنتج" value={customer.product} />
                <DetailItem label="عمر الدين" value={customer.debtAge} />
                <DetailItem label="عمر الدين (محسوب)" value={`${debtAgeYears.toFixed(1)} سنة`} />
                <DetailItem label="التثبيت" value={customer.fixation} />
                <DetailItem label="سند غير مؤرشف" value={customer.unarchivedBond === 'Yes' ? 'نعم' : 'لا'} />
              </div>
            </section>

            {/* القسم 2: بيانات العميل والتحصيل */}
            <section>
              <div className="flex items-center gap-3 mb-3 pr-2 border-r-4 border-blue-500">
                <h3 className="text-[11px] font-bold text-slate-600 uppercase">بيانات العميل والتحصيل</h3>
                <div className="flex-1 h-[1px] bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-slate-100 rounded-none overflow-hidden shadow-soft">
                <DetailItem label="رقم الجوال" value={formatSaudiMobile(customer.mobile)} copyable={true} color="text-blue-600" />
                <DetailItem label="رقم الهوية" value={customer.idNumber} copyable={true} />
                <DetailItem label="الاكشن (الحالة)" value={customer.status} highlight={true} />
                <DetailItem label="تاريخ المتابعة" value={localFollowUp} />
                <DetailItem label="اسم المحصل" value={customer.collectorName} />
                <DetailItem label="الرقم الوظيفي" value={customer.employeeId} />
                <DetailItem label="اسم المشرف" value={customer.supervisorName} />
                <DetailItem label="تقييم الأعمال" value={customer.businessEvaluation} />
              </div>
            </section>

            {/* القسم 3: الحالة الوظيفية والطبية */}
            <section>
              <div className="flex items-center gap-3 mb-3 pr-2 border-r-4 border-purple-500">
                <h3 className="text-[11px] font-bold text-slate-600 uppercase">الحالة الوظيفية والطبية</h3>
                <div className="flex-1 h-[1px] bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-3 gap-0 border border-slate-100 rounded-none overflow-hidden shadow-soft">
                <DetailItem label="عميل رواتب" value={customer.salaryClient === 'Yes' ? 'نعم' : 'لا'} highlight={customer.salaryClient === 'Yes'} />
                <DetailItem label="فوق 60 سنة" value={customer.ageOver60 === 'Yes' ? 'نعم' : 'لا'} highlight={customer.ageOver60 === 'Yes'} />
                <DetailItem label="عميل متوفي" value={customer.isDeceased === 'Yes' ? 'نعم' : 'لا'} highlight={customer.isDeceased === 'Yes'} color="text-rose-600" />
              </div>
            </section>

            {/* القسم 4: البيانات القانونية وسيبل */}
            <section>
              <div className="flex items-center gap-3 mb-3 pr-2 border-r-4 border-rose-500">
                <h3 className="text-[11px] font-bold text-slate-600 uppercase">البيانات القانونية وسيبل</h3>
                <div className="flex-1 h-[1px] bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-slate-100 rounded-none overflow-hidden shadow-soft">
                <DetailItem label="رقم القضية" value={customer.caseNumber} copyable={true} color="text-rose-600" />
                <DetailItem label="رقم المرجع التنفيذي" value={customer.executiveReferenceNumber} copyable={true} />
                <DetailItem label="اسم المحكمة" value={customer.courtName} />
                <DetailItem label="رقم طلب سيبل" value={customer.sabilOrderNumber} highlight={true} />
                <DetailItem label="تاريخ التجميد" value={localFreezeDate} />
                <DetailItem label="ملاحظات الطلب" value={customer.orderNotes} />
                <DetailItem label="زر تواصل واتساب" value={customer.whatsAppLink || 'رابط نظامي'} />
                <DetailItem label="سجلات إضافية" value={customer.withdrawn === 'Yes' ? 'منسحب' : '-'} />
              </div>
            </section>

            {/* القسم 5: توثيق الملاحظات والتعديلات */}
            <section>
              <div className="flex items-center gap-3 mb-3 pr-2 border-r-4 border-slate-900">
                <h3 className="text-[11px] font-bold text-slate-600 uppercase">توثيق الملاحظات والتعديلات</h3>
                <div className="flex-1 h-[1px] bg-slate-100"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-none border border-slate-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">تاريخ التجميد (لتفعيل السياسة)</label>
                    <input 
                      type="date" 
                      value={localFreezeDate} 
                      onChange={(e) => setLocalFreezeDate(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white transition-all text-center" 
                    />
                  </div>
                  <div className="bg-white p-3 rounded-none border border-slate-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">تاريخ المتابعة القادم</label>
                    <input 
                      type="date" 
                      value={localFollowUp} 
                      onChange={(e) => setLocalFollowUp(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white transition-all text-center" 
                    />
                  </div>
                </div>
                <textarea 
                  value={localNotes} 
                  onChange={(e) => setLocalNotes(e.target.value)} 
                  className="w-full h-full min-h-[120px] bg-white border border-slate-200 p-3 text-[11px] text-slate-700 outline-none resize-none text-right font-bold rounded-none shadow-soft focus:ring-1 focus:ring-slate-200 transition-all" 
                  placeholder="سجل نتائج المكالمة أو تفاصيل التسوية هنا..."
                />
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 text-right w-full md:w-auto">
             <div className="w-6 h-6 rounded-none bg-slate-900 text-white flex items-center justify-center text-[10px]">🏦</div>
             <div>
               <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">المحصل المعين</p>
               <p className="text-xs font-bold text-slate-800">{customer.collectorName}</p>
             </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={onClose} className="flex-1 md:flex-none px-6 py-2 text-slate-500 rounded-none text-[10px] font-bold hover:bg-slate-50 transition-all uppercase border border-slate-100">إغلاق</button>
            <button onClick={handleSaveAll} disabled={isUpdating} className="flex-1 md:flex-none px-10 py-2 bg-slate-900 text-white rounded-none text-[10px] font-bold hover:bg-teal-600 active:scale-95 transition-all shadow-premium uppercase">
              {isUpdating ? 'جاري الحفظ...' : 'حفظ وتوثيق'}
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default CustomerDetailModal;
