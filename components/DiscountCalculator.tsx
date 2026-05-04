
import React, { useState, useEffect, useMemo } from 'react';
import { Customer } from '../types.ts';
import CopyButton from './CopyButton.tsx';

interface DiscountCalculatorProps {
  customers?: Customer[];
  onAskAI?: () => void;
}

const DiscountCalculator: React.FC<DiscountCalculatorProps> = ({ customers = [], onAskAI }) => {
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [productType, setProductType] = useState<'BF' | 'AL' | 'CC'>('BF');
  const [hasCase, setHasCase] = useState<'Yes' | 'No'>('No');
  const [vehicleStatus, setVehicleStatus] = useState<'WithCustomer' | 'Repossessed'>('WithCustomer');
  const [outstandingAmount, setOutstandingAmount] = useState<string>('');
  const [debtAgeRange, setDebtAgeRange] = useState<string>('0'); 
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [isFoundAnim, setIsFoundAnim] = useState(false);

  const ageOptions = [
    { label: 'أقل من سنة', value: '0' },
    { label: 'سنة إلى سنتين', value: '1' },
    { label: 'سنتين إلى 3 سنوات', value: '2' },
    { label: '3 إلى 4 سنوات', value: '3' },
    { label: '4 إلى 5 سنوات', value: '4' },
    { label: '5 إلى 10 سنوات', value: '5' },
    { label: '10 إلى 15 سنة', value: '10' },
    { label: 'أكثر من 15 سنة', value: '15' },
  ];

  useEffect(() => {
    if (accountSearch.length >= 5) {
      const found = customers.find(c => c.accountNumber === accountSearch || c.idNumber === accountSearch);
      if (found) {
        setMatchedCustomer(found);
        setProductType(found.product as any || 'BF');
        setHasCase((found.caseNumber && found.caseNumber !== 'لا يوجد' && found.caseNumber !== '') ? 'Yes' : 'No');
        setOutstandingAmount(String(found.amount));
        
        const ageStr = found.debtAge || '';
        if (ageStr.includes('0-1')) setDebtAgeRange('0');
        else if (ageStr.includes('1-2')) setDebtAgeRange('1');
        else if (ageStr.includes('2-3')) setDebtAgeRange('2');
        else if (ageStr.includes('3-4')) setDebtAgeRange('3');
        else if (ageStr.includes('4-5')) setDebtAgeRange('4');
        else if (ageStr.includes('5-10')) setDebtAgeRange('5');
        else if (ageStr.includes('10-15')) setDebtAgeRange('10');
        else if (ageStr.includes('15')) setDebtAgeRange('15');
        
        setIsFoundAnim(true);
        setTimeout(() => setIsFoundAnim(false), 1000);
      } else {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
    }
  }, [accountSearch, customers]);

  const finalDiscountRate = useMemo(() => {
    const age = parseFloat(debtAgeRange);
    let rate = 0;

    if (productType === 'AL') {
      if (age >= 10) rate = 0.60;
      else if (age >= 5) rate = 0.45;
      else if (age >= 4) rate = 0.40;
      else if (age >= 3) rate = 0.35;
      else if (age >= 2) rate = 0.25;
      else if (age >= 1) rate = 0.15;
      else rate = 0.10;

      if (vehicleStatus === 'Repossessed') {
        rate += 0.05; 
      }
    } else {
      if (hasCase === 'Yes') {
        if (age >= 15) rate = 0.75;
        else if (age >= 10) rate = 0.70;
        else if (age >= 5) rate = 0.65;
        else if (age >= 4) rate = 0.60;
        else if (age >= 3) rate = 0.55;
        else if (age >= 2) rate = 0.45;
        else if (age >= 1) rate = 0.30;
        else rate = 0.20;
      } else {
        if (age >= 15) rate = 0.75;
        else if (age >= 10) rate = 0.70;
        else if (age >= 5) rate = 0.60;
        else if (age >= 4) rate = 0.55;
        else if (age >= 3) rate = 0.50;
        else if (age >= 2) rate = 0.40;
        else if (age >= 1) rate = 0.20;
        else rate = 0.20;
      }
    }
    return Math.min(rate, 0.85);
  }, [productType, hasCase, vehicleStatus, debtAgeRange]);

  const amountValue = parseFloat(outstandingAmount) || 0;
  const discountValue = amountValue * finalDiscountRate;
  const settlementValue = amountValue - discountValue;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-none shadow-premium overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500" dir="rtl">
      <div className="bg-slate-900 px-4 py-2 text-white flex justify-between items-center">
        <div>
          <h1 className="text-[10px] font-black uppercase tracking-tight">حاسبة الخصم الذكية</h1>
          <p className="text-[6px] font-bold text-teal-400 uppercase tracking-widest leading-none">Policy Engine v5.5</p>
        </div>
        <div className="text-lg">🧮</div>
      </div>

      <div className="p-4 space-y-4">
        {/* AI Call-to-Action */}
        <button 
          onClick={onAskAI}
          className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 p-2.5 rounded-none flex items-center justify-between group hover:scale-[1.01] transition-all shadow-lg border border-white/10"
        >
          <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center text-base group-hover:rotate-12 transition-transform">🤖</div>
            <div className="text-right">
               <p className="text-[9px] font-black leading-none mb-0.5">اسأل ذكي عن مبلغ تسوية العميل</p>
               <p className="text-[6px] font-bold opacity-60 uppercase tracking-tighter">AI Voice Request</p>
            </div>
          </div>
          <div className="w-5 h-5 bg-white/10 rounded-none flex items-center justify-center text-[8px] text-white">🎤</div>
        </button>

        <div className="space-y-1">
          <label className="text-[8px] font-black text-slate-400 uppercase px-1 flex items-center gap-1">
            <span>🏷️</span> البحث التلقائي
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="رقم الحساب أو الهوية..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className={`w-full border rounded-none py-2 px-3 text-[10px] font-black outline-none transition-all text-right tabular-nums ${matchedCustomer ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/10' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900/10'}`}
            />
            {accountSearch.length >= 5 && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-none ${matchedCustomer ? 'bg-teal-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                  {matchedCustomer ? 'Found' : '...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {accountSearch.length >= 5 && matchedCustomer && (
          <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-0.5 p-2 bg-slate-50 rounded-none border border-slate-100">
              <label className="text-[7px] font-black text-slate-400 uppercase flex items-center gap-1">
                <span>👤</span> اسم العميل
              </label>
              <div className="flex items-center justify-between gap-1 overflow-hidden">
                <p className="text-[9px] font-black text-slate-800 truncate">{matchedCustomer.name}</p>
              </div>
            </div>
            <div className="space-y-0.5 p-2 bg-slate-50 rounded-none border border-slate-100">
              <label className="text-[7px] font-black text-slate-400 uppercase flex items-center gap-1">
                <span>💳</span> رقم الهوية
              </label>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[9px] font-black text-slate-800 tabular-nums">{matchedCustomer.idNumber}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase px-1 flex items-center gap-1">
              <span>🏦</span> المنتج
            </label>
            <select 
              value={productType}
              onChange={(e) => setProductType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-1.5 px-2 text-[9px] font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all appearance-none text-right cursor-pointer"
            >
              <option value="BF">شخصي</option>
              <option value="AL">تأجيري</option>
              <option value="CC">بطاقات</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase px-1 flex items-center gap-1">
              <span>⚖️</span> قضية؟
            </label>
            <select 
              value={hasCase}
              onChange={(e) => setHasCase(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-1.5 px-2 text-[9px] font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all appearance-none text-right cursor-pointer"
            >
              <option value="No">لا</option>
              <option value="Yes">نعم</option>
            </select>
          </div>
        </div>

        {productType === 'AL' && (
          <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
            <label className="text-[8px] font-black text-slate-400 uppercase px-1 flex items-center gap-1">
              <span>🚗</span> حالة المركبة
            </label>
            <select 
              value={vehicleStatus}
              onChange={(e) => setVehicleStatus(e.target.value as any)}
              className="w-full bg-teal-50/50 border border-teal-100 rounded-none py-1.5 px-2 text-[9px] font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all appearance-none text-right cursor-pointer"
            >
              <option value="WithCustomer">مع العميل</option>
              <option value="Repossessed">مسحوبة (Deficit)</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase px-1 flex items-center gap-1">
              <span>💰</span> المديونية
            </label>
            <div className="relative">
              <input 
                type="text" 
                inputMode="decimal"
                placeholder="0.00"
                value={outstandingAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setOutstandingAmount(val);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-none py-1.5 px-6 text-[9px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all text-center tabular-nums"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300">SAR</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase px-1 flex items-center gap-1">
              <span>⏳</span> العمر
            </label>
            <select 
              value={debtAgeRange}
              onChange={(e) => setDebtAgeRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-1.5 px-2 text-[9px] font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all appearance-none text-right cursor-pointer"
            >
              {ageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-50 rounded-none p-4 border border-slate-100 relative overflow-hidden space-y-3">
          <div className="flex w-full items-center justify-between">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 leading-none">مبلغ التسوية</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-teal-600 tabular-nums">{formatCurrency(settlementValue)}</span>
                <span className="text-[8px] font-bold text-slate-400">SAR</span>
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <div className="text-center px-2 py-1 bg-white rounded-none border border-teal-100 shadow-sm min-w-[50px]">
                <p className="text-[7px] font-black text-slate-400 uppercase leading-none">الخصم</p>
                <p className="text-[10px] font-black text-teal-600">%{Math.round(finalDiscountRate * 100)}</p>
              </div>
              <div className="text-center px-2 py-1 bg-white rounded-none border border-slate-100 shadow-sm min-w-[50px]">
                <p className="text-[7px] font-black text-slate-400 uppercase leading-none">القيمة</p>
                <p className="text-[10px] font-black text-slate-800 tabular-nums">{Math.floor(discountValue).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <button 
            disabled={amountValue <= 0}
            className={`w-full py-2.5 rounded-none font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2 ${amountValue > 0 ? 'bg-slate-950 text-white hover:bg-teal-600 shadow-xl active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            <span>إصدار خطاب تسوية</span>
            <span className="text-xs">📜</span>
          </button>
        </div>
      </div>
      
      <div className="bg-slate-50 py-2 px-4 border-t border-slate-100 text-center">
         <p className="text-[6px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none">Compliance: AI Auditor Online</p>
      </div>
    </div>
  );
};

export default DiscountCalculator;
