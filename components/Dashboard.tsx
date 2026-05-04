
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Customer, User, getWhatsAppLink } from '../types.ts';
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
    <div className="flex items-center gap-2 mb-4 pr-1.5 border-r-[3px] border-teal-500">
      <h2 className="section-title text-[11px] font-black text-slate-500 uppercase tracking-wider">
        {children}
      </h2>
      <div className="flex-1 h-[1px] bg-gradient-to-l from-slate-200 to-transparent"></div>
    </div>
  );



  return (
    <div className="space-y-6 pb-12 bg-slate-50/50" dir="rtl">
      {/* Slider Section */}
      <section className="w-full h-[200px] md:h-[350px] relative overflow-hidden shadow-xl border-b border-slate-200 bg-slate-900">
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
            <div className="absolute inset-0 z-20 flex flex-col items-start justify-center px-6 md:px-20">
              <div className="max-w-4xl text-right">
                <h1 className="text-xl md:text-3xl font-black text-white mb-3 drop-shadow-lg animate-in slide-in-from-right-12 duration-700 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-[10px] md:text-base text-white/95 font-bold drop-shadow-md animate-in slide-in-from-right-16 duration-1000 max-w-xl leading-relaxed">
                  {slide.description}
                </p>
              </div>
            </div>
          </div>
        ))}
        {/* Slider Indicators */}
        <div className="absolute bottom-4 right-6 md:right-20 z-30 flex gap-1.5">
           {slides.map((_, i) => (
             <button 
               key={i} 
               onClick={() => setCurrentSlide(i)}
               className={`h-1 rounded-none transition-all duration-300 ${i === currentSlide ? 'w-10 bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
             ></button>
           ))}
        </div>
      </section>

      <div className="px-3 md:px-10 space-y-8">
        {/* About Section */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-5xl text-right space-y-4">
            <div className="space-y-1">
               <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-none">
                 ProDebt Collection System
               </h3>
               <div className="w-16 h-1 bg-teal-500 rounded-none"></div>
            </div>
            
            <div className="space-y-3 text-slate-700 font-bold text-xs md:text-sm leading-relaxed">
              <p>
                يُعد موقع ProDebt Collection System منصة رقمية متخصصة لدعم وإدارة عمليات التحصيل بشكل احترافي وذكي، من خلال توفير أدوات تحليلية متقدمة، ولوحات تحكم تفاعلية، وتقارير فورية تساعد على فهم محفظة الديون واتخاذ قرارات دقيقة مبنية على البيانات.
              </p>
            </div>

            {/* Disclaimer Section */}
            <div className="mt-6 space-y-2 pt-4 border-t border-slate-100">
               <h4 className="text-rose-600 font-black text-[10px] uppercase mb-1">التنويه :</h4>
               <div className="text-rose-600/80 font-bold text-[9px] md:text-[10px] leading-relaxed space-y-2 text-justify">
                 <p>
                   نظام ProDebt Collection System والمحتوى المقدم من خلاله، بما في ذلك التحليلات، التقارير، الأدوات الذكية، والمساعد الافتراضي، يُعد اجتهادًا مهنيًا وتقنيًا مبنيًا على الخبرة العملية في مجال تحليل البيانات وإدارة عمليات التحصيل.
                 </p>
                 <p>
                   ولا يُمثل هذا النظام، أو أي من مخرجاته أو محتواه، أي جهة مالية أو مصرفية أو تنظيمية، ولا يُعد إفادة رسمية أو التزامًا نظاميًا أو قرارًا ملزمًا، كما لا يُغني عن الرجوع إلى الأنظمة والتعليمات الصادرة من الجهات المختصة.
                 </p>
               </div>
            </div>
          </div>
        </section>

        {/* Basic Analytics */}
        <section>
          <SectionHeader>التحليلات الأساسية للمحفظة الشاملة</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div onClick={() => handleOpenModal('إجمالي المحفظة', customers)} className="bg-slate-900 p-5 rounded-none text-white shadow-premium cursor-pointer hover:bg-slate-800 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-none -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <p className="text-[9px] font-black opacity-50 uppercase mb-1">اجمالي رصيد المحفظة</p>
              <p className="text-xl md:text-3xl font-black tabular-nums tracking-tight"><AnimatedCounter value={stats.totalDebt} isCurrency={true} /> <span className="text-[11px] opacity-60">SAR</span></p>
            </div>
            <div onClick={() => handleOpenModal('عدد الحسابات', customers)} className="bg-white p-5 rounded-none border border-slate-200 shadow-soft cursor-pointer hover:bg-slate-50 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">اجمالي عدد الحساب</p>
              <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums"><AnimatedCounter value={stats.count} /></p>
            </div>
          </div>
        </section>

        {/* Product Distribution Section */}
        <section>
          <SectionHeader>توزيع المحفظة حسب المنتجات</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              onClick={() => handleOpenModal('محفظة التمويل الشخصي (BF)', stats.globalProducts.bf)}
              className="bg-white p-5 rounded-none border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-indigo-50 rounded-none flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🏦</div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">التمويل الشخصي PF</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد الحسابات</p>
                  <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums">{stats.globalProducts.bfCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                  <p className="text-xl md:text-3xl font-black text-indigo-600 tabular-nums">{stats.globalProducts.bfAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleOpenModal('محفظة التمويل التأجيري (AL)', stats.globalProducts.al)}
              className="bg-white p-5 rounded-none border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-teal-50 rounded-none flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🚗</div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">التمويل التأجيري AL</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد الحسابات</p>
                  <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums">{stats.globalProducts.alCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                  <p className="text-xl md:text-3xl font-black text-teal-600 tabular-nums">{stats.globalProducts.alAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleOpenModal('محفظة البطاقات الإئتمانية (CC)', stats.globalProducts.cc)}
              className="bg-white p-5 rounded-none border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-amber-50 rounded-none flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💳</div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">البطاقات الإئتمانية CC</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد الحسابات</p>
                  <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums">{stats.globalProducts.ccCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                  <p className="text-xl md:text-3xl font-black text-amber-600 tabular-nums">{stats.globalProducts.ccAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator & Search Group */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <SectionHeader>حاسبة الخصم الذكية</SectionHeader>
            <DiscountCalculator customers={customers} />
          </div>

          <div className="space-y-4">
            <SectionHeader>البحث السريع المتقدم</SectionHeader>
            <div className="bg-white p-4 rounded-none border border-slate-200 shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase pr-1">البحث عن طريق</label>
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-1.5 px-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">اختر نوع البحث...</option>
                    <option value="accountNumber">🏦 رقم الحساب</option>
                    <option value="idNumber">💳 رقم الهوية</option>
                    <option value="mobile">📱 رقم الجوال</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase pr-1">إدخال البيانات</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="أدخل الأرقام..."
                    value={searchValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*$/.test(val)) {
                        setSearchValue(val);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-1.5 px-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-teal-500/10 focus:bg-white transition-all text-center tabular-nums"
                  />
                </div>
              </div>

              {quickSearchResult ? (
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-none flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-none flex items-center justify-center text-sm shadow-sm border border-teal-100">👤</div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-800 truncate max-w-[120px]">{quickSearchResult.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[7px] font-bold text-teal-600 uppercase">حساب: {quickSearchResult.accountNumber}</p>
                        {quickSearchResult.mobile && (
                          <a 
                            href={getWhatsAppLink(quickSearchResult, messageTemplate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded-none text-[6px] font-black flex items-center gap-0.5 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <span>واتساب</span>
                            <span>💬</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedQuickCustomer(quickSearchResult)}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-none text-[8px] font-black uppercase hover:bg-teal-600 transition-all shadow-md"
                  >
                    فتح الملف
                  </button>
                </div>
              ) : searchValue.length >= 3 ? (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-none text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase italic">لا توجد نتائج مطابقة...</p>
                </div>
              ) : (
                <div className="py-4 border-2 border-dashed border-slate-100 rounded-none flex flex-col items-center justify-center text-slate-300">
                  <span className="text-lg opacity-20">🔍</span>
                  <p className="text-[7px] font-black uppercase tracking-widest leading-none mt-1">بانتظار البيانات</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Strategic Portfolios */}
        <section>
          <SectionHeader>تصنيفات المحفظة الاستراتيجية</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div 
              onClick={() => handleOpenModal('محفظة العملاء المتوفين', stats.deceased.bf.concat(stats.deceased.al).concat(stats.deceased.cc))}
              className="bg-white p-5 rounded-none border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-slate-100 rounded-none flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💀</div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">محفظة العملاء المتوفين</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد الحسابات</p>
                  <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums">{stats.deceased.totalCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                  <p className="text-xl md:text-3xl font-black text-slate-900 tabular-nums">{stats.deceased.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleOpenModal('محفظة عملاء الرواتب', stats.salary.bf.concat(stats.salary.al).concat(stats.salary.cc))}
              className="bg-white p-5 rounded-none border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-indigo-50 rounded-none flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💰</div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">محفظة عملاء الرواتب</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد الحسابات</p>
                  <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums">{stats.salary.totalCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                  <p className="text-xl md:text-3xl font-black text-indigo-600 tabular-nums">{stats.salary.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleOpenModal('عملاء حديثي التعثر (0-1)', stats.recent01.bf.concat(stats.recent01.al).concat(stats.recent01.cc))}
              className="bg-white p-5 rounded-none border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-teal-50 rounded-none flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⏳</div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">عملاء حديثي التعثر (0-1)</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد الحسابات</p>
                  <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums">{stats.recent01.totalCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                  <p className="text-xl md:text-3xl font-black text-teal-600 tabular-nums">{stats.recent01.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleOpenModal('عملاء حديثي التعثر (1-2)', stats.recent12.bf.concat(stats.recent12.al).concat(stats.recent12.cc))}
              className="bg-white p-5 rounded-none border border-slate-200 shadow-soft hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-amber-50 rounded-none flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⚠️</div>
                <div className="text-right">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">عملاء حديثي التعثر (1-2)</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد الحسابات</p>
                  <p className="text-xl md:text-3xl font-black text-slate-800 tabular-nums">{stats.recent12.totalCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                  <p className="text-xl md:text-3xl font-black text-amber-600 tabular-nums">{stats.recent12.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Lists */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="space-y-3">
            <SectionHeader>أعلى أرصدة متوفرة</SectionHeader>
            <div className="bg-white rounded-none border border-slate-200 shadow-soft overflow-hidden h-[250px] flex flex-col w-full">
              <div className="bg-slate-50/80 p-2 grid grid-cols-3 text-[7px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
                <div className="text-right">العميل</div><div>رقم الحساب</div><div className="text-left">الرصيد</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                {stats.topAvailableBalances.map((c, i) => (
                  <div key={c.id} onClick={() => setSelectedQuickCustomer(c)} className="p-2 grid grid-cols-3 items-center text-[9px] hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="text-right font-black text-slate-700 truncate flex items-center gap-1 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center text-[6px] shrink-0 font-black border border-emerald-100">{i+1}</span>
                      <span className="truncate group-hover:text-teal-600 transition-colors uppercase">{c.name}</span>
                    </div>
                    <div className="text-center font-bold text-slate-400 tabular-nums flex items-center justify-center gap-1">
                      {c.accountNumber}
                      <CopyButton text={c.accountNumber} />
                      {c.mobile && (
                        <a 
                          href={getWhatsAppLink(c, messageTemplate)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-none hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                          title="واتساب"
                        >
                          <span className="text-[8px]">💬</span>
                        </a>
                      )}
                    </div>
                    <div className="text-left font-black text-emerald-600 tabular-nums">{c.balances.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <SectionHeader>اكبر الديون القائمة</SectionHeader>
            <div className="bg-white rounded-none border border-slate-200 shadow-soft overflow-hidden h-[250px] flex flex-col w-full">
              <div className="bg-slate-50/80 p-2 grid grid-cols-3 text-[7px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
                <div className="text-right">العميل</div><div>رقم الحساب</div><div className="text-left">المديونية</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                {stats.highBalance.map((c, i) => (
                  <div key={c.id} onClick={() => setSelectedQuickCustomer(c)} className="p-2 grid grid-cols-3 items-center text-[9px] hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="text-right font-black text-slate-700 truncate flex items-center gap-1 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-none bg-slate-100 text-slate-500 flex items-center justify-center text-[6px] shrink-0 font-black border border-slate-200">{i+1}</span>
                      <span className="truncate group-hover:text-rose-600 transition-colors uppercase">{c.name}</span>
                    </div>
                    <div className="text-center font-bold text-slate-400 tabular-nums flex items-center justify-center gap-1">
                      {c.accountNumber}
                      <CopyButton text={c.accountNumber} />
                      {c.mobile && (
                        <a 
                          href={getWhatsAppLink(c, messageTemplate)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-none hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                          title="واتساب"
                        >
                          <span className="text-[8px]">💬</span>
                        </a>
                      )}
                    </div>
                    <div className="text-left font-black text-rose-600 tabular-nums">{c.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sabil Orders Section */}
        <section className="space-y-3">
          <SectionHeader>طلبات سيبل السابقة</SectionHeader>
          <div className="bg-white rounded-none border border-slate-200 shadow-soft overflow-hidden h-[300px] flex flex-col w-full">
            <div className="bg-slate-50/80 p-2 grid grid-cols-3 text-[7px] font-black text-slate-400 text-center uppercase border-b border-slate-100">
              <div className="text-right">اسم العميل</div>
              <div>رقم الحساب</div>
              <div className="text-left">رقم الطلب</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
              {stats.sabilData.length > 0 ? stats.sabilData.map((c, i) => (
                <div key={c.id} onClick={() => setSelectedQuickCustomer(c)} className="p-2 grid grid-cols-3 items-center text-[9px] hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                  <div className="text-right font-black text-slate-700 truncate flex items-center gap-1 min-w-0">
                    <span className="w-4 h-4 rounded-none bg-slate-100 text-slate-500 flex items-center justify-center text-[6px] shrink-0 font-black border border-slate-200">{i+1}</span>
                    <span className="truncate group-hover:text-indigo-600 transition-colors uppercase">{c.name}</span>
                  </div>
                  <div className="text-center font-bold text-slate-400 tabular-nums flex items-center justify-center gap-1">
                    {c.accountNumber}
                    <CopyButton text={c.accountNumber} />
                    {c.mobile && (
                      <a 
                        href={getWhatsAppLink(c, messageTemplate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-none hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                        title="واتساب"
                      >
                        <span className="text-[8px]">💬</span>
                      </a>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-none text-[8px] font-black tabular-nums border border-indigo-200">
                      {c.sabilOrderNumber}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <span className="text-3xl mb-1 opacity-10">📑</span>
                  <p className="text-[8px] font-black uppercase tracking-widest">لا توجد طلبات سابقة</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Assistant Banner */}
        <section>
          <div onClick={() => setIsAIPanelOpen?.(true)} className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 md:p-8 rounded-none shadow-premium flex flex-col sm:flex-row items-center justify-between group cursor-pointer hover:scale-[1.01] transition-all relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-teal-500/10 rounded-none blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
            <div className="flex items-center gap-4 relative z-10 text-center md:text-right flex-col md:flex-row">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-xl rounded-none flex items-center justify-center text-2xl md:text-3xl shadow-2xl border border-white/10 group-hover:rotate-6 transition-transform">🤖</div>
              <div>
                <h3 className="text-base md:text-xl font-black text-white leading-none mb-1">تحدث مع "ذكي"</h3>
                <p className="text-teal-300 text-[9px] md:text-[10px] font-bold uppercase opacity-80 italic leading-none">حلل محفظتك بذكاء الآن 🎤</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 px-6 py-2.5 bg-white text-slate-900 rounded-none font-black text-[9px] uppercase shadow-xl group-hover:bg-teal-50 transition-all z-10">ابدأ المحادثة</div>
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
