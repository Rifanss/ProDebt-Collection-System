
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Customer, User } from '../types.ts';
import CustomerTable from './CustomerTable.tsx';
import FilteredCustomersModal from './FilteredCustomersModal.tsx';
import CopyButton from './CopyButton.tsx';

const AnimatedCounter: React.FC<{ value: number; duration?: number; isCurrency?: boolean }> = ({ value, duration = 2000, isCurrency = false }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = null;
    startValueRef.current = displayValue;
    let animationFrame: number;
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const progress = Math.min((currentTime - startTimeRef.current) / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentProgress = easeOutQuad(progress);
      const nextValue = startValueRef.current + (value - startValueRef.current) * currentProgress;
      setDisplayValue(nextValue);
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {isCurrency ? Math.floor(displayValue).toLocaleString() : Math.floor(displayValue).toLocaleString()}
    </span>
  );
};

interface EmployeeDashboardProps {
  customers: Customer[];
  currentUser: User | null;
  onUpdateField: (id: string, field: keyof Customer, value: any) => void;
  messageTemplate: string;
  setIsAIPanelOpen?: (isOpen: boolean) => void;
  setActiveTab?: (tab: any) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ customers, currentUser, onUpdateField, messageTemplate, setIsAIPanelOpen, setActiveTab }) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'portfolio'>('dashboard');
  const [filterModalConfig, setFilterModalConfig] = useState<{ isOpen: boolean; title: string; data: Customer[] }>({
    isOpen: false, title: '', data: []
  });

  const myPortfolio = useMemo(() => {
    if (!currentUser) return [];
    return customers.filter(c => String(c.employeeId || '').trim() === String(currentUser.username || '').trim());
  }, [customers, currentUser]);

  const resolvedCollectorName = useMemo(() => {
    if (myPortfolio.length > 0) return myPortfolio[0].collectorName;
    return currentUser?.collectorName || 'غير محدد';
  }, [myPortfolio, currentUser]);

  const supervisorName = useMemo(() => {
    return myPortfolio.length > 0 ? myPortfolio[0].supervisorName : 'غير محدد';
  }, [myPortfolio]);

  const stats = useMemo(() => {
    const isYes = (v: any) => {
      const s = String(v || '').toLowerCase().trim();
      return s === 'yes' || s === 'نعم' || s === '1' || s === 'true';
    };

    const getProductStats = (data: Customer[]) => {
      const pf = data.filter(c => c.product === 'PF' || c.product === 'BF');
      const al = data.filter(c => c.product === 'AL');
      const cc = data.filter(c => c.product === 'CC');
      return {
        bf: pf, al, cc,
        bfCount: pf.length, bfAmount: pf.reduce((s, c) => s + (c.amount || 0), 0),
        alCount: al.length, alAmount: al.reduce((s, c) => s + (c.amount || 0), 0),
        ccCount: cc.length, ccAmount: cc.reduce((s, c) => s + (c.amount || 0), 0),
        totalAmount: data.reduce((s, c) => s + (c.amount || 0), 0),
        totalCount: data.length
      };
    };

    const sabilData = myPortfolio.filter(c => c.sabilOrderNumber && String(c.sabilOrderNumber).trim() !== '');
    
    const recent01 = myPortfolio.filter(c => {
      const age = String(c.debtAge || '').trim();
      return age === '0-1' || age === '1' || age.includes('0-1');
    });
    
    const recent12 = myPortfolio.filter(c => {
      const age = String(c.debtAge || '').trim();
      return age === '1-2' || age === '2' || age.includes('1-2');
    });

    return {
      totalDebt: myPortfolio.reduce((s, c) => s + (c.amount || 0), 0),
      totalPaid: myPortfolio.reduce((s, c) => s + (c.paymentAmount || 0), 0),
      count: myPortfolio.length,
      globalProducts: getProductStats(myPortfolio),
      salary: getProductStats(myPortfolio.filter(c => isYes(c.salaryClient))),
      deceased: getProductStats(myPortfolio.filter(c => isYes(c.isDeceased))),
      recent01: getProductStats(recent01),
      recent12: getProductStats(recent12),
      sabilData: sabilData,
      highBalance: [...myPortfolio].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 10),
      topAvailableBalances: [...myPortfolio].sort((a, b) => (b.balances || 0) - (a.balances || 0)).slice(0, 10)
    };
  }, [myPortfolio]);

  const handleOpenModal = (title: string, data: Customer[]) => {
    if (data.length === 0) return;
    setFilterModalConfig({ isOpen: true, title, data });
  };

  const handleExit = () => {
    setActiveTab?.('dashboard');
  };

  const SectionHeader = ({ children }: { children?: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-6 pr-2 border-r-4 border-teal-500">
      <h2 className="section-title text-sm font-black text-slate-600 uppercase">
        {children}
      </h2>
      <div className="flex-1 h-[1px] bg-gradient-to-l from-slate-200 to-transparent"></div>
    </div>
  );

  const StrategicCard = ({ title, count, amount, color, onClick, customers }: any) => (
    <div 
      onClick={() => onClick(title, customers)}
      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden flex items-center justify-between cursor-pointer group hover:shadow-md hover:border-teal-100 transition-all h-36"
    >
      <div className={`absolute right-0 top-0 bottom-0 w-1.5 ${color}`}></div>
      <div className="flex-1 pr-4 text-right">
        <h3 className="text-[12px] font-black text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">{title}</h3>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-slate-500">
            العدد : <span className="tabular-nums font-black text-slate-800">{count.toLocaleString()}</span>
          </p>
          <p className="text-[10px] font-bold text-slate-500">
            المبلغ : <span className="tabular-nums font-black text-indigo-600">SAR {amount.toLocaleString()}</span>
          </p>
        </div>
      </div>
      <div className="shrink-0">
         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-teal-50 transition-colors">
            <span className="text-xs">📂</span>
         </div>
      </div>
    </div>
  );

  if (viewMode === 'portfolio') {
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-500">
        <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-white/10 shrink-0">
          <h2 className="text-sm font-black text-white">المحفظة الخاصة</h2>
          <button onClick={() => setViewMode('dashboard')} className="px-4 py-1.5 bg-white text-slate-900 font-black text-[10px] uppercase hover:bg-slate-100 transition-all rounded-lg shadow-md">الرجوع</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CustomerTable customers={myPortfolio} onUpdateField={onUpdateField} messageTemplate={messageTemplate} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 bg-slate-50/50 min-h-screen" dir="rtl">
      {/* Premium Digital ID Banner */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[40] px-4 md:px-12 py-4 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
          {/* Identity Info */}
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative group">
              <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-lg border border-slate-800 transition-transform group-hover:rotate-6">👤</div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 border-4 border-white rounded-full"></div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
              {/* Collector Info */}
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">اسم المحصل</span>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black text-slate-800 leading-none">{resolvedCollectorName}</h1>
                  <CopyButton text={resolvedCollectorName} className="text-slate-300" />
                </div>
              </div>

              {/* Employee ID */}
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">الرقم الوظيفي (ID)</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-black tabular-nums border border-slate-200">
                    {currentUser?.username}
                  </span>
                  <CopyButton text={currentUser?.username || ''} className="text-slate-300" />
                </div>
              </div>

              {/* Supervisor Info */}
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">المشرف المباشـر</span>
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="text-xs font-black leading-none">{supervisorName}</span>
                  <span className="text-[10px]">💠</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 md:pr-6 md:border-r border-slate-100">
             <button onClick={() => setIsAIPanelOpen?.(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-teal-600 transition-all shadow-md flex items-center justify-center gap-2 group">
               <span className="group-hover:animate-pulse">🎤</span> مساعد ذكي
             </button>
             <button onClick={handleExit} className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all">
               خروج 🚪
             </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-12 space-y-12 max-w-7xl mx-auto">
        {/* KPI Performance Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => handleOpenModal('إجمالي محفظتك', myPortfolio)} className="bg-slate-900 p-6 rounded-3xl text-white shadow-premium cursor-pointer hover:bg-slate-800 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <p className="text-[8px] font-black opacity-40 uppercase mb-1">إجمالي المحفظة</p>
            <p className="text-xl md:text-2xl font-black tabular-nums tracking-tight"><AnimatedCounter value={stats.totalDebt} isCurrency={true} /> <span className="text-[10px] opacity-60">SAR</span></p>
          </div>
          <div onClick={() => handleOpenModal('سدادك الفعلي', myPortfolio.filter(c => (c.paymentAmount || 0) > 0))} className="bg-teal-600 p-6 rounded-3xl text-white shadow-premium cursor-pointer hover:bg-teal-700 transition-all relative overflow-hidden">
            <p className="text-[8px] font-black opacity-50 uppercase mb-1">سدادك الفعلي</p>
            <p className="text-xl md:text-2xl font-black tabular-nums tracking-tight"><AnimatedCounter value={stats.totalPaid} isCurrency={true} /> <span className="text-[10px] opacity-60">SAR</span></p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">كفاءة التحصيل</p>
            <p className="text-xl md:text-2xl font-black text-teal-600">{(stats.totalDebt > 0 ? (stats.totalPaid / stats.totalDebt) * 100 : 0).toFixed(1)}%</p>
          </div>
          <div onClick={() => handleOpenModal('إجمالي الحسابات', myPortfolio)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft cursor-pointer hover:bg-slate-50 transition-all">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">إجمالي الحسابات</p>
            <p className="text-xl md:text-2xl font-black text-slate-800 tabular-nums"><AnimatedCounter value={stats.count} /></p>
          </div>
        </div>

        {/* Product Distribution Section */}
        <section>
          <SectionHeader>توزيع المحفظة حسب المنتجات</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={() => handleOpenModal('تمويل شخصي (BF)', stats.globalProducts.bf)} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏦</div>
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-800 uppercase">التمويل الشخصي</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">BF Portfolio</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500">العدد: <span className="text-slate-800 font-black">{stats.globalProducts.bfCount.toLocaleString()}</span></p>
                <p className="text-[10px] font-bold text-slate-500">المبلغ: <span className="text-indigo-600 font-black">SAR {stats.globalProducts.bfAmount.toLocaleString()}</span></p>
              </div>
            </div>
            <div onClick={() => handleOpenModal('تمويل تأجيري (AL)', stats.globalProducts.al)} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🚗</div>
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-800 uppercase">التمويل التأجيري</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AL Portfolio</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500">العدد: <span className="text-slate-800 font-black">{stats.globalProducts.alCount.toLocaleString()}</span></p>
                <p className="text-[10px] font-bold text-slate-500">المبلغ: <span className="text-teal-600 font-black">SAR {stats.globalProducts.alAmount.toLocaleString()}</span></p>
              </div>
            </div>
            <div onClick={() => handleOpenModal('بطاقات ائتمان (CC)', stats.globalProducts.cc)} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💳</div>
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-800 uppercase">البطاقات الإئتمانية</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">CC Portfolio</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500">العدد: <span className="text-slate-800 font-black">{stats.globalProducts.ccCount.toLocaleString()}</span></p>
                <p className="text-[10px] font-bold text-slate-500">المبلغ: <span className="text-amber-600 font-black">SAR {stats.globalProducts.ccAmount.toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Categories Section */}
        <section>
          <SectionHeader>تصنيفات المحفظة الاستراتيجية</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StrategicCard 
              title="محفظة المتوفين" 
              count={stats.deceased.totalCount} 
              amount={stats.deceased.totalAmount} 
              color="bg-slate-800"
              onClick={handleOpenModal}
              customers={stats.deceased.bf.concat(stats.deceased.al).concat(stats.deceased.cc)}
            />
            <StrategicCard 
              title="محفظة الرواتب" 
              count={stats.salary.totalCount} 
              amount={stats.salary.totalAmount} 
              color="bg-indigo-600"
              onClick={handleOpenModal}
              customers={stats.salary.bf.concat(stats.salary.al).concat(stats.salary.cc)}
            />
            <StrategicCard 
              title="حديثي التعثر (0-1)" 
              count={stats.recent01.totalCount} 
              amount={stats.recent01.totalAmount} 
              color="bg-teal-500"
              onClick={handleOpenModal}
              customers={stats.recent01.bf.concat(stats.recent01.al).concat(stats.recent01.cc)}
            />
            <StrategicCard 
              title="حديثي التعثر (1-2)" 
              count={stats.recent12.totalCount} 
              amount={stats.recent12.totalAmount} 
              color="bg-amber-500"
              onClick={handleOpenModal}
              customers={stats.recent12.bf.concat(stats.recent12.al).concat(stats.recent12.cc)}
            />
          </div>
        </section>

        {/* Top Lists Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 text-right">
            <SectionHeader>أعلى حسابات يتوفر بها أرصدة</SectionHeader>
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-soft overflow-hidden h-[320px] flex flex-col w-full">
              <div className="bg-slate-50/80 p-3 grid grid-cols-3 text-[8px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
                <div className="text-right">اسم العميل</div><div>رقم الحساب</div><div className="text-left">الرصيد المتوفر</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                {stats.topAvailableBalances.map((c, i) => (
                  <div key={c.id} onClick={() => handleOpenModal('تفاصيل العميل', [c])} className="p-3.5 grid grid-cols-3 items-center text-[10px] hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="text-right font-black text-slate-700 truncate flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[7px] shrink-0 font-black border border-emerald-100">{i+1}</span>
                      <span className="truncate group-hover:text-teal-600 transition-colors">{c.name}</span>
                    </div>
                    <div className="text-center font-bold text-slate-400 tabular-nums flex items-center justify-center gap-1">
                      {c.accountNumber}
                      <CopyButton text={c.accountNumber} />
                    </div>
                    <div className="text-left font-black text-emerald-600 tabular-nums">{c.balances.toLocaleString()} <span className="text-[8px] opacity-60 font-bold">SAR</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4 text-right">
            <SectionHeader>اكبر المديونيات القائمة</SectionHeader>
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-soft overflow-hidden h-[320px] flex flex-col w-full">
              <div className="bg-slate-50/80 p-3 grid grid-cols-3 text-[8px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
                <div className="text-right">اسم العميل</div><div>رقم الحساب</div><div className="text-left">إجمالي المديونية</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                {stats.highBalance.map((c, i) => (
                  <div key={c.id} onClick={() => handleOpenModal('تفاصيل العميل', [c])} className="p-3.5 grid grid-cols-3 items-center text-[10px] hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="text-right font-black text-slate-700 truncate flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[7px] shrink-0 font-black border border-slate-200">{i+1}</span>
                      <span className="truncate group-hover:text-rose-600 transition-colors">{c.name}</span>
                    </div>
                    <div className="text-center font-bold text-slate-400 tabular-nums flex items-center justify-center gap-1">
                      {c.accountNumber}
                      <CopyButton text={c.accountNumber} />
                    </div>
                    <div className="text-left font-black text-rose-600 tabular-nums">{c.amount.toLocaleString()} <span className="text-[8px] opacity-60 font-bold">SAR</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sabil Orders Section */}
        <section className="space-y-4 text-right">
          <SectionHeader>عملاء لديهم طلبات سابقة في سيبل</SectionHeader>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-soft overflow-hidden h-[350px] flex flex-col w-full">
            <div className="bg-slate-50/80 p-4 grid grid-cols-3 text-[9px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
              <div className="text-right">اسم العميل</div>
              <div>رقم الحساب</div>
              <div className="text-left">رقم طلب سيبل</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
              {stats.sabilData.length > 0 ? stats.sabilData.map((c, i) => (
                <div key={c.id} onClick={() => handleOpenModal('تفاصيل العميل', [c])} className="p-4 grid grid-cols-3 items-center text-[11px] hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                  <div className="text-right font-black text-slate-700 truncate flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[8px] shrink-0 font-black border border-slate-200">{i+1}</span>
                    <span className="truncate group-hover:text-indigo-600 transition-colors">{c.name}</span>
                  </div>
                  <div className="text-center font-bold text-slate-400 tabular-nums flex items-center justify-center gap-1">
                    {c.accountNumber}
                    <CopyButton text={c.accountNumber} />
                  </div>
                  <div className="text-left">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black tabular-nums border border-indigo-200">
                      {c.sabilOrderNumber}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <span className="text-5xl mb-4 opacity-10">📑</span>
                  <p className="text-xs font-black uppercase tracking-widest text-center">لا توجد طلبات سابقة مسجلة لعملائك</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Smart Assistant Activation Banner */}
        <section>
          <div 
            onClick={() => setIsAIPanelOpen?.(true)} 
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-12 rounded-[3rem] shadow-premium flex flex-col md:flex-row items-center justify-between group cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
            <div className="flex items-center gap-8 relative z-10 text-center md:text-right flex-col md:flex-row">
              <div className="w-24 h-24 bg-white/5 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl border border-white/10 group-hover:rotate-6 transition-transform">🤖</div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">فعل المساعد الذكي "ذكي" الآن</h3>
                <p className="text-teal-400 text-xs md:text-sm font-bold uppercase opacity-90 tracking-wide">
                  استخدم صوتك لتحليل أداء محفظتك، الحصول على توصيات، وإدارة التارقت بذكاء 🎤
                </p>
              </div>
            </div>
            <div className="mt-8 md:mt-0 px-10 py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase shadow-2xl group-hover:bg-teal-500 transition-all z-10 border border-teal-400/30">
              تحدث مع ذكي
            </div>
          </div>
        </section>

        {/* Full Portfolio Action Card */}
        <section>
          <div 
            onClick={() => setViewMode('portfolio')}
            className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-soft flex flex-col md:flex-row items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-6 relative z-10 text-center md:text-right flex-col md:flex-row">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-slate-800 group-hover:rotate-6 transition-transform">📂</div>
              <div className="text-right">
                <h3 className="text-xl font-black text-slate-800 leading-none mb-2">إدارة الجدول التفصيلي</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">إرسال الرسائل، تحديث الحالات، وتوثيق المتابعات 📝</p>
              </div>
            </div>
            <div className="mt-6 md:mt-0 px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all z-10 border border-slate-200">افتح المحفظة</div>
          </div>
        </section>
      </div>

      {filterModalConfig.isOpen && (
        <FilteredCustomersModal 
          isOpen={filterModalConfig.isOpen} 
          title={filterModalConfig.title} 
          customers={filterModalConfig.data} 
          onClose={() => setFilterModalConfig({ ...filterModalConfig, isOpen: false })} 
          onUpdateField={onUpdateField} 
          messageTemplate={messageTemplate}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
