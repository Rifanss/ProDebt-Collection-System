
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Customer, User } from '../types.ts';
import FilteredCustomersModal from './FilteredCustomersModal.tsx';
import DiscountCalculator from './DiscountCalculator.tsx';
import CustomerDetailModal from './CustomerDetailModal.tsx';
import CopyButton from './CopyButton.tsx';

const AnimatedCounter: React.FC<{ value: number; duration?: number; isCurrency?: boolean }> = ({ value, duration = 2500, isCurrency = false }) => {
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
      {isCurrency 
        ? Math.floor(displayValue).toLocaleString() 
        : Math.floor(displayValue).toLocaleString()}
    </span>
  );
};

interface DashboardProps {
  customers: Customer[];
  currentUser: User | null;
  setIsAIPanelOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: any) => void;
  onUpdateField: (id: string, field: keyof Customer, value: any) => void;
  messageTemplate: string;
  onGenerateLinks?: () => void;
  isGeneratingLinks?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  customers = [], 
  currentUser, 
  setIsAIPanelOpen, 
  setActiveTab, 
  onUpdateField, 
  messageTemplate,
  onGenerateLinks,
  isGeneratingLinks
}) => {
  const [filterModalConfig, setFilterModalConfig] = useState<{ isOpen: boolean; title: string; data: Customer[] }>({
    isOpen: false, title: '', data: []
  });

  const [selectedQuickCustomer, setSelectedQuickCustomer] = useState<Customer | null>(null);
  const [searchType, setSearchType] = useState<string>(''); 
  const [searchValue, setSearchValue] = useState('');
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000",
      title: "نظام ProDebt Collection System المتكامل",
      description: "حل ذكي واحترافي لإدارة عمليات التحصيل ، يهدف إلى تقليل نسب التعثر ورفع كفاءة فرق التحصيل، وتحسين نتائج المحافظ."
    },
    {
      image: "https://images.unsplash.com/photo-1551288049-bbbda5366a71?auto=format&fit=crop&q=80&w=2000",
      title: "تحليلات بيانات متقدمة",
      description: "نظرة شاملة على محفظة الديون ، أعمارها، تصنيفاتها ، ومؤشراتها الرئيسية، لضمان قراءة دقيقة واتخاذ قرارات مبنية على أرقام حقيقية."
    },
    {
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000",
      title: "أمان وحماية البيانات",
      description: "تطبيق أعلى معايير الأمان والتشفير ، لضمان سرية بيانات العملاء وحماية العمليات المالية وفق أفضل الممارسات المعتمدة."
    },
    {
      image: "https://images.unsplash.com/photo-1518186239717-2e9b69d7744a?auto=format&fit=crop&q=80&w=2000",
      title: "لوحة تحكم ذكية",
      description: "واجهة تفاعلية مودارة للمحفظة متابعة وعود السداد وتسجيل الملاحظات ، وتحليل الأداء بشكل لحظي."
    },
    {
      image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=2000",
      title: "تقارير أداء دورية",
      description: "نظرة شمولية على محفظة الديون ، أعمارها ، وتصنيفاتها ، مؤشراتها الرئيسية لضمان اتخاذ قرارات دقيقة."
    },
    {
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2000",
      title: "المساعد الذكي 'ذكي'",
      description: "تقنيات ذكاء متقدمة لتحليل سلوك العملاء ، ودعم المحصلين باتخاذ قرارات ذكية قائمة على البيانات ، ورفع جودة الأداء اليومي."
    },
    {
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000",
      title: "كفاءة أعلى… نتائج أفضل",
      description: "أتمتة للمهام اليومية ، تنظيم للعمل ، وتقليل الهدر الزمني لتمكين المحصل من التركيز على التحصيل الفعلي."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const quickSearchResult = useMemo(() => {
    if (!searchValue || searchValue.length < 3 || !searchType) return null;
    return customers.find(c => String(c[searchType as keyof Customer] || '').includes(searchValue));
  }, [customers, searchType, searchValue]);

  const stats = useMemo(() => {
    const isYes = (val: any) => {
      const s = String(val || '').toLowerCase().trim();
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

    const salaryData = customers.filter(c => isYes(c.salaryClient));
    const deceasedData = customers.filter(c => isYes(c.isDeceased));
    const sabilData = customers.filter(c => c.sabilOrderNumber && String(c.sabilOrderNumber).trim() !== '');
    
    const recent01Data = customers.filter(c => {
      const age = String(c.debtAge || '').trim();
      return age === '0-1' || age === '1' || age.includes('0-1');
    });
    
    const recent12Data = customers.filter(c => {
      const age = String(c.debtAge || '').trim();
      return age === '1-2' || age === '2' || age.includes('1-2');
    });

    return {
      totalDebt: customers.reduce((s, c) => s + (c.amount || 0), 0),
      totalPaid: customers.reduce((s, c) => s + (c.paymentAmount || 0), 0),
      count: customers.length,
      globalProducts: getProductStats(customers),
      salary: getProductStats(salaryData),
      deceased: getProductStats(deceasedData),
      recent01: getProductStats(recent01Data),
      recent12: getProductStats(recent12Data),
      sabilCount: sabilData.length,
      sabilData: sabilData,
      highBalance: [...customers].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 10),
      topAvailableBalances: [...customers].sort((a, b) => (b.balances || 0) - (a.balances || 0)).slice(0, 10)
    };
  }, [customers]);

  const handleOpenModal = (title: string, data: Customer[]) => {
    if (data.length === 0) return;
    setFilterModalConfig({ isOpen: true, title, data });
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
      className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-100 shadow-soft relative overflow-hidden flex items-center justify-between cursor-pointer group hover:shadow-md hover:border-teal-100 transition-all h-40"
    >
      <div className={`absolute right-0 top-0 bottom-0 w-2 ${color}`}></div>
      <div className="flex-1 pr-4 text-right">
        <h3 className="text-[13px] md:text-sm font-black text-slate-800 mb-3 group-hover:text-teal-600 transition-colors">{title}</h3>
        <div className="space-y-1">
          <p className="text-[10px] md:text-[11px] font-bold text-slate-500">
            عدد الحسابات : <span className="tabular-nums font-black text-slate-800">{count.toLocaleString()}</span> حساب
          </p>
          <p className="text-[10px] md:text-[11px] font-bold text-slate-500">
            إجمالي المبلغ : <span className="tabular-nums font-black text-indigo-600">SAR {amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </p>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-center gap-1">
        <div className="relative">
          <div className="w-14 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-2 border border-slate-100 shadow-inner group-hover:bg-teal-50 group-hover:border-teal-200 transition-colors">
            <span className="text-[7px] font-black text-rose-800 leading-tight uppercase text-center">عرض الملف</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-16 bg-slate-50/50" dir="rtl">
      {/* Slider Section */}
      <section className="w-full h-[280px] md:h-[420px] relative overflow-hidden shadow-2xl border-b border-slate-200 bg-slate-900">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-slate-950/80 via-slate-950/40 to-transparent z-10"></div>
            <img 
              src={slide.image} 
              alt={slide.title} 
              className={`w-full h-full object-cover transform transition-transform duration-[6000ms] ${index === currentSlide ? 'scale-100' : 'scale-110'}`}
            />
            <div className="absolute inset-0 z-20 flex flex-col items-start justify-center px-8 md:px-24">
              <div className="max-w-4xl text-right">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-6 drop-shadow-lg animate-in slide-in-from-right-12 duration-700 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-sm md:text-xl text-white/95 font-bold drop-shadow-md animate-in slide-in-from-right-16 duration-1000 max-w-2xl leading-relaxed">
                  {slide.description}
                </p>
              </div>
            </div>
          </div>
        ))}
        {/* Slider Indicators */}
        <div className="absolute bottom-8 right-8 md:right-24 z-30 flex gap-2">
           {slides.map((_, i) => (
             <button 
               key={i} 
               onClick={() => setCurrentSlide(i)}
               className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-12 bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]' : 'w-3 bg-white/30 hover:bg-white/60'}`}
             ></button>
           ))}
        </div>
      </section>

      <div className="px-4 md:px-12 space-y-12">
        {/* About Section */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 mb-8 pr-2 border-r-4 border-teal-500">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نبذة عن الموقع</h2>
          </div>
          <div className="max-w-5xl text-right space-y-8">
            <div className="space-y-2">
               <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-none">
                 ProDebt Collection System
               </h3>
               <div className="w-24 h-1.5 bg-teal-500 rounded-full"></div>
            </div>
            
            <div className="space-y-6 text-slate-700 font-bold text-base md:text-lg leading-relaxed">
              <p>
                يُعد موقع ProDebt Collection System منصة رقمية متخصصة لدعم وإدارة عمليات التحصيل بشكل احترافي وذكي، من خلال توفير أدوات تحليلية متقدمة، ولوحات تحكم تفاعلية، وتقارير فورية تساعد على فهم محفظة الديون واتخاذ قرارات دقيقة مبنية على البيانات.
              </p>
              <p>
                يركّز النظام على رفع كفاءة فرق التحصيل، وتنظيم سير العمل اليومي، وتقليل نسب التعثر، عبر أتمتة المهام، وتحليل أعمار الديون، وتتبع وعود السداد، وتقديم توصيات ذكية داعمة لعملية التحصيل.
              </p>
            </div>

            {/* Disclaimer Section */}
            <div className="mt-12 space-y-4 pt-8 border-t border-slate-100">
               <h4 className="text-rose-600 font-black text-xs uppercase mb-2">التنويه :</h4>
               <div className="text-rose-600/80 font-bold text-[11px] md:text-xs leading-relaxed space-y-3">
                 <p>
                   نظام ProDebt Collection System والمحتوى المقدم من خلاله، بما في ذلك التحليلات، التقارير، الأدوات الذكية، والمساعد الافتراضي، يُعد اجتهادًا مهنيًا وتقنيًا مبنيًا على الخبرة العملية في مجال تحليل البيانات وإدارة عمليات التحصيل.
                 </p>
                 <p>
                   ولا يُمثل هذا النظام، أو أي من مخرجاته أو محتواه، أي جهة مالية أو مصرفية أو تنظيمية، ولا يُعد إفادة رسمية أو التزامًا نظاميًا أو قرارًا ملزمًا، كما لا يُغني عن الرجوع إلى الأنظمة والتعليمات الصادرة من الجهات المختصة.
                 </p>
                 <p>
                   يُستخدم النظام كأداة دعم وتحليل داخلي، بهدف تحسين كفاءة العمل، وتنظيم العمليات، ودعم متخذي القرار بالمعلومات، دون التدخل في الصلاحيات نظامية أو الإجراءات المعتمدة لدى الجهات الرسمية أو المؤسسات المالية.
                 </p>
                 <p>
                   وتخضع جميع البيانات المعروضة داخل النظام لآليات حماية وأمن معلومات، ويتم التعامل معها وفق أعلى معايير السرية، مع التزام المستخدم الكامل بالحفاظ على خصوصية البيانات وعدم إساءة استخدامها.
                 </p>
               </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <SectionHeader>إجراءات سريعة</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft flex flex-col justify-between group hover:border-green-100 transition-all">
              <div>
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📱</div>
                <h3 className="text-lg font-black text-slate-800 mb-2">تكوين روابط واتساب</h3>
                <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                  سيتم تكوين روابط واتساب لجميع العملاء في المحفظة الحالية بناءً على قالب الرسالة النشط.
                </p>
              </div>
              <button
                onClick={onGenerateLinks}
                disabled={isGeneratingLinks || customers.length === 0}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 transition-all ${
                  isGeneratingLinks || customers.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 active:scale-95'
                }`}
              >
                {isGeneratingLinks ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>جاري التكوين...</span>
                  </>
                ) : (
                  <>
                    <span>تكوين الروابط الآن</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft flex flex-col justify-between group hover:border-indigo-100 transition-all">
              <div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                <h3 className="text-lg font-black text-slate-800 mb-2">تحديث حالة السداد</h3>
                <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                  انتقل إلى جدول العملاء لتحديث حالات السداد والمتابعة بشكل يدوي أو جماعي.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('customers')}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <span>جدول العملاء</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft flex flex-col justify-between group hover:border-slate-800 transition-all">
              <div>
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">✨</div>
                <h3 className="text-lg font-black text-slate-800 mb-2">تحليل المحفظة</h3>
                <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                  احصل على رؤى وتوصيات ذكية حول أفضل استراتيجيات التحصيل لمحفظتك الحالية.
                </p>
              </div>
              <button
                onClick={() => setIsAIPanelOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <span>بدء التحليل الذكي</span>
              </button>
            </div>
          </div>
        </section>

        {/* Basic Analytics */}
        <section>
          <SectionHeader>التحليلات الأساسية للمحفظة</SectionHeader>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div onClick={() => handleOpenModal('إجمالي المحفظة', customers)} className="bg-slate-900 p-5 md:p-6 rounded-3xl text-white shadow-premium cursor-pointer hover:bg-slate-800 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <p className="text-[8px] font-black opacity-50 uppercase mb-1">إجمالي رصيد المحفظة</p>
              <p className="text-xl md:text-2xl font-black tabular-nums tracking-tight"><AnimatedCounter value={stats.totalDebt} isCurrency={true} /> <span className="text-[10px] opacity-60">SAR</span></p>
            </div>
            <div onClick={() => handleOpenModal('المحصل الفعلي', customers.filter(c => (c.paymentAmount || 0) > 0))} className="bg-teal-600 p-5 md:p-6 rounded-3xl text-white shadow-premium cursor-pointer hover:bg-teal-700 transition-all relative overflow-hidden">
              <p className="text-[8px] font-black opacity-60 uppercase mb-1">المحصل الفعلي</p>
              <p className="text-xl md:text-2xl font-black tabular-nums tracking-tight"><AnimatedCounter value={stats.totalPaid} isCurrency={true} /> <span className="text-[10px] opacity-60">SAR</span></p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-soft">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">كفاءة التحصيل</p>
              <p className="text-xl md:text-2xl font-black text-teal-600 tabular-nums">{(stats.totalDebt > 0 ? (stats.totalPaid / stats.totalDebt) * 100 : 0).toFixed(1)}%</p>
            </div>
            <div onClick={() => handleOpenModal('عدد الحسابات', customers)} className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-soft cursor-pointer hover:bg-slate-50 transition-all">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">إجمالي الحسابات</p>
              <p className="text-xl md:text-2xl font-black text-slate-800 tabular-nums"><AnimatedCounter value={stats.count} /></p>
            </div>
          </div>
        </section>

        {/* Product Distribution Section */}
        <section>
          <SectionHeader>توزيع المحفظة حسب المنتجات</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => handleOpenModal('محفظة التمويل الشخصي (BF)', stats.globalProducts.bf)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏦</div>
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">التمويل الشخصي</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Personal Finance (BF)</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500">عدد الحسابات: <span className="text-slate-800 font-black">{stats.globalProducts.bfCount.toLocaleString()}</span></p>
                <p className="text-[10px] font-bold text-slate-500">إجمالي المبلغ: <span className="text-indigo-600 font-black">SAR {stats.globalProducts.bfAmount.toLocaleString()}</span></p>
              </div>
            </div>

            <div 
              onClick={() => handleOpenModal('محفظة التمويل التأجيري (AL)', stats.globalProducts.al)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🚗</div>
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">التمويل التأجيري</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Auto Lease (AL)</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500">عدد الحسابات: <span className="text-slate-800 font-black">{stats.globalProducts.alCount.toLocaleString()}</span></p>
                <p className="text-[10px] font-bold text-slate-500">إجمالي المبلغ: <span className="text-teal-600 font-black">SAR {stats.globalProducts.alAmount.toLocaleString()}</span></p>
              </div>
            </div>

            <div 
              onClick={() => handleOpenModal('محفظة البطاقات الإئتمانية (CC)', stats.globalProducts.cc)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💳</div>
                <div className="text-right">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">البطاقات الإئتمانية</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Credit Cards (CC)</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500">عدد الحسابات: <span className="text-slate-800 font-black">{stats.globalProducts.ccCount.toLocaleString()}</span></p>
                <p className="text-[10px] font-bold text-slate-500">إجمالي المبلغ: <span className="text-amber-600 font-black">SAR {stats.globalProducts.ccAmount.toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator & Search Group */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <SectionHeader>حاسبة الخصم الذكية</SectionHeader>
            <DiscountCalculator customers={customers} />
          </div>

          <div className="space-y-6">
            <SectionHeader>البحث السريع المتقدم</SectionHeader>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-soft space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase pr-1">البحث عن طريق</label>
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">اختر نوع البحث...</option>
                    <option value="accountNumber">🏦 رقم حساب التمويل</option>
                    <option value="idNumber">💳 رقم الهوية الوطنية</option>
                    <option value="mobile">📱 رقم الجوال المسجل</option>
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase pr-1">إدخال البيانات</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="أدخل الأرقام هنا..."
                    value={searchValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setSearchValue(val);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all text-center tabular-nums"
                  />
                </div>
              </div>

              {quickSearchResult ? (
                <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-teal-100">👤</div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-800">{quickSearchResult.name}</p>
                      <p className="text-[9px] font-bold text-teal-600 mt-1 uppercase">حساب: {quickSearchResult.accountNumber}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedQuickCustomer(quickSearchResult)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-teal-600 transition-all shadow-md active:scale-95"
                  >
                    فتح ملف العميل
                  </button>
                </div>
              ) : searchValue.length >= 3 ? (
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase italic">لا توجد نتائج مطابقة لبحثك الحالي...</p>
                </div>
              ) : (
                <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                  <span className="text-3xl mb-2 opacity-20">🔍</span>
                  <p className="text-[9px] font-black uppercase tracking-widest">بانتظار إدخال بيانات البحث</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Strategic Portfolios */}
        <section>
          <SectionHeader>تصنيفات المحفظة الاستراتيجية</SectionHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
            <StrategicCard 
              title="محفظة العملاء المتوفين" 
              count={stats.deceased.totalCount} 
              amount={stats.deceased.totalAmount} 
              color="bg-slate-800"
              onClick={handleOpenModal}
              customers={stats.deceased.bf.concat(stats.deceased.al).concat(stats.deceased.cc)}
            />
            <StrategicCard 
              title="محفظة عملاء الرواتب" 
              count={stats.salary.totalCount} 
              amount={stats.salary.totalAmount} 
              color="bg-indigo-600"
              onClick={handleOpenModal}
              customers={stats.salary.bf.concat(stats.salary.al).concat(stats.salary.cc)}
            />
            <StrategicCard 
              title="عملاء حديثي التعثر (0-1)" 
              count={stats.recent01.totalCount} 
              amount={stats.recent01.totalAmount} 
              color="bg-teal-500"
              onClick={handleOpenModal}
              customers={stats.recent01.bf.concat(stats.recent01.al).concat(stats.recent01.cc)}
            />
            <StrategicCard 
              title="عملاء حديثي التعثر (1-2)" 
              count={stats.recent12.totalCount} 
              amount={stats.recent12.totalAmount} 
              color="bg-amber-500"
              onClick={handleOpenModal}
              customers={stats.recent12.bf.concat(stats.recent12.al).concat(stats.recent12.cc)}
            />
          </div>
        </section>

        {/* Detailed Lists */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
          <div className="space-y-4">
            <SectionHeader>أعلى حسابات يتوفر بها أرصدة</SectionHeader>
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-soft overflow-hidden h-[300px] flex flex-col w-full">
              <div className="bg-slate-50/80 p-3 grid grid-cols-3 text-[8px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
                <div className="text-right">العميل</div><div>رقم الحساب</div><div className="text-left">الرصيد المتوفر</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                {stats.topAvailableBalances.map((c, i) => (
                  <div key={c.id} onClick={() => handleOpenModal('تفاصيل العميل', [c])} className="p-3.5 grid grid-cols-3 items-center text-[10px] hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="text-right font-black text-slate-700 truncate flex items-center gap-1 min-w-0">
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
          <div className="space-y-4">
            <SectionHeader>اكبر المديونيات القائمة</SectionHeader>
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-soft overflow-hidden h-[300px] flex flex-col w-full">
              <div className="bg-slate-50/80 p-3 grid grid-cols-3 text-[8px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
                <div className="text-right">العميل</div><div>رقم الحساب</div><div className="text-left">إجمالي المديونية</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                {stats.highBalance.map((c, i) => (
                  <div key={c.id} onClick={() => handleOpenModal('تفاصيل العميل', [c])} className="p-3.5 grid grid-cols-3 items-center text-[10px] hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="text-right font-black text-slate-700 truncate flex items-center gap-1 min-w-0">
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
        <section className="space-y-4">
          <SectionHeader>عملاء لديهم طلبات سابقة في سيبل</SectionHeader>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-soft overflow-hidden h-[400px] flex flex-col w-full">
            <div className="bg-slate-50/80 p-4 grid grid-cols-3 text-[9px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
              <div className="text-right">اسم العميل</div>
              <div>رقم الحساب</div>
              <div className="text-left">رقم طلب سيبل</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
              {stats.sabilData.length > 0 ? stats.sabilData.map((c, i) => (
                <div key={c.id} onClick={() => handleOpenModal('تفاصيل العميل', [c])} className="p-4 grid grid-cols-3 items-center text-[11px] hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                  <div className="text-right font-black text-slate-700 truncate flex items-center gap-2 min-w-0">
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
                  <p className="text-xs font-black uppercase tracking-widest">لا توجد طلبات سابقة مسجلة في النظام</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Assistant Banner */}
        <section>
          <div onClick={() => setIsAIPanelOpen?.(true)} className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-10 rounded-[2.5rem] shadow-premium flex flex-col md:flex-row items-center justify-between group cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
            <div className="flex items-center gap-6 relative z-10 text-center md:text-right flex-col md:flex-row">
              <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border border-white/10 group-hover:rotate-6 transition-transform">🤖</div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white leading-none mb-2">تحدث مع "ذكي" - مساعدك التحصيلي</h3>
                <p className="text-teal-300 text-[10px] md:text-xs font-bold uppercase opacity-80">حلل محفظتك بذكاء، احصل على توصيات فورية الآن 🎤</p>
              </div>
            </div>
            <div className="mt-8 md:mt-0 px-8 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase shadow-xl group-hover:bg-teal-50 transition-all z-10">ابدأ المحادثة</div>
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

      {selectedQuickCustomer && (
        <CustomerDetailModal 
          customer={selectedQuickCustomer} 
          onClose={() => setSelectedQuickCustomer(null)} 
          onUpdateField={onUpdateField}
          messageTemplate={messageTemplate}
        />
      )}
    </div>
  );
};

export default Dashboard;
