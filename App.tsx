
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CustomerTable from './components/CustomerTable';
import EmployeeDashboard from './components/EmployeeDashboard';
import LoginModal from './components/LoginModal';
import ImportModal from './components/ImportModal';
import MessageTemplateEditor from './components/MessageTemplateEditor';
import AIPanel from './components/AIPanel';
import DiscountCalculator from './components/DiscountCalculator';
import ExemptionPortfolio from './components/ExemptionPortfolio';
import { Customer, User, formatSaudiMobile, getWhatsAppLink } from './types';

const DB_NAME = 'SmartCollectorDB_v2';
const STORE_NAME = 'customers';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToDB = async (data: Customer[]) => {
  if (!data || data.length === 0) return;
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, 'current_portfolio');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const loadFromDB = async (): Promise<Customer[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('current_portfolio');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
};

type TabType = 'dashboard' | 'customers' | 'deceased' | 'salary' | 'new' | 'promises' | 'sabil' | 'exemption' | 'reports' | 'calculator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [customerTabSubView, setCustomerTabSubView] = useState<'selection' | 'table'>('selection');
  const [selectedPortfolioCollector, setSelectedPortfolioCollector] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);
  
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  
  // Updated Robot Logo URL
  const logoUrl = "https://h.top4top.io/p_3692pcm2r1.jpg";

  const [messageTemplate, setMessageTemplate] = useState(
    `السلام عليكم ورحمة الله وبركاته،\nالأخ / {customerFirstName}\n\nمعك / {collectorFirstName} \nمن إدارة التحصيل بالبنك الأهلي السعودي بجدة.\n\nأعتذر عن الإزعاج ، تواصلي معك بخصوص مبلغ المديونية القائم عليك \nبمبلغ : {amount} ريال.\n\nإذا حاب تستفيد من الخم المقدم لك من البنك الأهلي بموجب خطاب تسوية ، أو مناقشة بدائل أخرى لمعالجة التعثر، ومن ضمنها :\n\n✔︎ إعادة الجدولة \n✔︎ شراء المديونية،\n✔︎ تقديم طلب إعفاء من المديونية ، في حال وجود تقرير طبي يوضح العجز وعدم اللياقة الطبية للعمل.\n\nويهدف هذا التواصل إلى دراسة إمكانية معالجة التعثر والوقوف على رغبتكم ، والإستماع إلى مقترحاتكم ، والعمل معكم للوصول إلى حل مناسب لكم أولًا ، وبما ترونه أنتم ملائماً حسب وضعكم المالي وبما يتوافق مع الأنظمة المعمول بها \n\nشاكرين ومقدّرين لكم تعاونكم واهتمامكم، ونتطلع للتعاون معكم بما يحقق الحل الأنسب لكم`
  );

  useEffect(() => {
    const startApp = async () => {
      try {
        const cached = await loadFromDB();
        if (cached && cached.length > 0) {
          setCustomers(cached);
        }
        isInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 2500);
      } catch (e) {
        setIsInitialLoading(false);
      }

      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) { 
        try { 
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          if (!user.isAdmin) setActiveTab('reports');
        } catch(e) {} 
      }
    };
    startApp();
  }, []);

  useEffect(() => {
    if (!isInitialized.current || customers.length === 0) return;
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(async () => {
      await saveToDB(customers);
    }, 3000); 
    return () => { if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current); };
  }, [customers]);

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    if (['deceased', 'salary', 'new', 'promises', 'sabil'].includes(tab)) {
      setCustomerTabSubView('table');
    } else if (tab === 'customers') {
      setCustomerTabSubView('selection');
      setSelectedPortfolioCollector(null);
    }
  };

  const displayCustomers = useMemo(() => {
    let base = customers;
    
    if (currentUser && !currentUser.isAdmin) {
      base = base.filter(c => 
        (String(c.employeeId || '').trim() === String(currentUser.username || '').trim())
      );
    } else if (selectedPortfolioCollector) {
      base = base.filter(c => c.collectorName?.trim() === selectedPortfolioCollector.trim());
    }

    if (activeTab === 'deceased') return base.filter(c => String(c.isDeceased).toLowerCase() === 'yes');
    if (activeTab === 'salary') return base.filter(c => String(c.salaryClient).toLowerCase() === 'yes');
    if (activeTab === 'new') {
      return base.filter(c => {
        const age = String(c.debtAge || '').trim();
        return (
          age === '0-1' || age === '1-2' || 
          age === '0-1 سنة' || age === '1-2 سنة' || 
          age === '1' || age === '2' ||
          age.startsWith('0-1') || age.startsWith('1-2')
        );
      });
    }
    if (activeTab === 'promises') return base.filter(c => (c.status || '').includes('وعد سداد'));
    if (activeTab === 'sabil') return base.filter(c => c.sabilOrderNumber && String(c.sabilOrderNumber).trim() !== '');

    return base;
  }, [customers, currentUser, selectedPortfolioCollector, activeTab]);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return displayCustomers;
    return displayCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(term) ||
      (c.accountNumber || '').includes(term) ||
      (c.idNumber || '').includes(term)
    );
  }, [displayCustomers, searchTerm]);

  const collectorsList = useMemo(() => {
    return Array.from(new Set(customers.map(c => c.collectorName).filter(Boolean))).sort();
  }, [customers]);

  const generateAllWhatsAppLinks = () => {
    if (customers.length === 0) return;
    setIsGeneratingLinks(true);
    
    const updated = customers.map(c => {
      const link = getWhatsAppLink(c, messageTemplate);
      return { ...c, whatsAppLink: link };
    });
    
    setCustomers(updated);
    setTimeout(() => {
      setIsGeneratingLinks(false);
      alert(`تم تكوين روابط واتساب لـ ${updated.length} عميل بنجاح.`);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans rounded-none" dir="rtl">
      {isInitialLoading && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center text-slate-900 rounded-none animate-in fade-in duration-700">
          <div className="relative w-full max-w-lg h-64 mb-6 px-10 animate-pulse">
            <img 
              src={logoUrl} 
              alt="ProDebt Logo" 
              className="w-full h-full object-contain filter drop-shadow-2xl"
            />
          </div>
          <div className="text-center px-6">
            <h2 className="text-xl font-black mb-1 text-slate-800 uppercase">ProDebt Collection System</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-none animate-bounce"></span>
              <p className="text-slate-400 text-[9px] font-black uppercase">Initializing Neural Link...</p>
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-none animate-bounce delay-100"></span>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleSetActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onReset={() => {
           if(confirm('سيتم مسح الذاكرة وإعادة التحميل، هل أنت متأكد؟')) {
             indexedDB.deleteDatabase(DB_NAME);
             window.location.reload();
           }
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-none">
        <Header 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          onImportClick={() => setIsImportOpen(true)}
          onTemplateClick={() => setIsTemplateOpen(true)}
          onMenuClick={() => setIsSidebarOpen(true)}
          currentUser={currentUser}
          onLogout={() => { setCurrentUser(null); localStorage.removeItem('currentUser'); setActiveTab('dashboard'); }}
          onLoginClick={() => setIsLoginOpen(true)}
        />

        <main className="flex-1 overflow-auto bg-slate-50/50 m-0 rounded-none custom-scrollbar">
          <div className="p-0">
            {filteredData.length === 0 && currentUser && !currentUser.isAdmin && activeTab !== 'exemption' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white border border-slate-200 rounded-none m-8">
                 <span className="text-6xl mb-6">📂</span>
                 <h3 className="text-xl font-black text-slate-800 mb-2">لا توجد بيانات مرتبطة بهذا الرقم الوظيفي</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase">Employee ID: {currentUser.username}</p>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    customers={filteredData} 
                    currentUser={currentUser} 
                    setIsAIPanelOpen={setIsAIPanelOpen}
                    setActiveTab={handleSetActiveTab}
                    onUpdateField={(id, f, v) => setCustomers(prev => prev.map(c => c.id === id ? {...c, [f]: v} : c))}
                    messageTemplate={messageTemplate}
                    onGenerateLinks={generateAllWhatsAppLinks}
                    isGeneratingLinks={isGeneratingLinks}
                  />
                )}

                {activeTab === 'calculator' && (
                  <div className="max-w-6xl mx-auto p-8">
                    <DiscountCalculator customers={customers} onAskAI={() => setIsAIPanelOpen(true)} />
                  </div>
                )}

                {activeTab === 'exemption' && (
                  <ExemptionPortfolio 
                    messageTemplate={messageTemplate}
                    currentUser={currentUser}
                  />
                )}

                {['customers', 'deceased', 'salary', 'new', 'promises', 'sabil'].includes(activeTab) && (
                  <div className="h-full rounded-none p-3 md:p-8">
                    {customerTabSubView === 'selection' && activeTab === 'customers' ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 rounded-none max-w-4xl mx-auto px-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-800">اختر نوع المحفظة</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full rounded-none">
                          <button onClick={() => { setSelectedPortfolioCollector(null); setCustomerTabSubView('table'); }} className="bg-slate-900 text-white p-8 md:p-12 rounded-none border border-white/5 shadow-xl hover:bg-slate-800 transition-all text-center">
                            <h3 className="text-xl md:text-2xl font-black">المحفظة الشاملة</h3>
                            <p className="text-slate-400 text-xs mt-2 uppercase">Central Ledger Access</p>
                          </button>
                          <div className="bg-white p-8 md:p-12 rounded-none border border-slate-200 shadow-xl text-center">
                            <h3 className="text-xl md:text-2xl font-black text-slate-800">محفظة محصل محدد</h3>
                            <select onChange={(e) => { if (e.target.value) { setSelectedPortfolioCollector(e.target.value); setCustomerTabSubView('table'); }}} className="w-full mt-6 bg-slate-50 border border-slate-200 rounded-none py-4 px-6 text-xs font-black outline-none focus:ring-2 focus:ring-teal-500">
                              <option value="">اختر اسم المحصل...</option>
                              {collectorsList.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col rounded-none shadow-xl border border-slate-200">
                        <div className="flex items-center gap-4 p-4 border-b border-slate-200 bg-white">
                          {activeTab === 'customers' && (
                            <button onClick={() => setCustomerTabSubView('selection')} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-none text-[10px] font-black hover:bg-slate-200 transition-colors">🔙 رجوع</button>
                          )}
                          <h4 className="font-black text-sm text-slate-800 uppercase">Portfolio Manager</h4>
                        </div>
                        <CustomerTable customers={filteredData} onUpdateField={(id, f, v) => setCustomers(prev => prev.map(c => c.id === id ? {...c, [f]: v} : c))} messageTemplate={messageTemplate} />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reports' && currentUser && (
                   <div className="h-full max-w-7xl mx-auto">
                     <EmployeeDashboard 
                       customers={customers} 
                       currentUser={currentUser}
                       onUpdateField={(id, f, v) => setCustomers(prev => prev.map(c => c.id === id ? {...c, [f]: v} : c))}
                       messageTemplate={messageTemplate}
                       setIsAIPanelOpen={setIsAIPanelOpen}
                       setActiveTab={handleSetActiveTab}
                     />
                   </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Button */}
      {currentUser && (
        <button 
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed bottom-6 left-6 z-[100] w-14 h-14 bg-teal-600 text-white rounded-none shadow-2xl flex items-center justify-center text-2xl hover:bg-teal-500 hover:scale-110 transition-all group"
          title="تفعيل المساعد الصوتي الذكي"
        >
          <div className="absolute inset-0 rounded-none bg-teal-600 animate-ping opacity-20"></div>
          <span className="relative z-10 group-hover:animate-pulse">🎤</span>
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-none shadow-sm animate-bounce">AI</div>
        </button>
      )}

      <AIPanel isOpen={isAIPanelOpen} onClose={() => setIsAIPanelOpen(false)} customers={filteredData} currentUser={currentUser} />
      {isLoginOpen && <LoginModal onLoginSuccess={(u) => { setCurrentUser(u); localStorage.setItem('currentUser', JSON.stringify(u)); if(!u.isAdmin) setActiveTab('reports'); setIsLoginOpen(false); }} onClose={() => setIsLoginOpen(false)} />}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={(d) => { setCustomers(d); saveToDB(d); setIsImportOpen(false); }} />
      <MessageTemplateEditor isOpen={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} template={messageTemplate} onSave={setMessageTemplate} />
    </div>
  );
};

export default App;
