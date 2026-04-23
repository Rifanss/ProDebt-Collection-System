
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onReset?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onReset, isOpen, onClose }) => {
  // Updated Robot Logo URL
  const logoUrl = "https://h.top4top.io/p_3692pcm2r1.jpg";
  
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم العامة', icon: '📊' },
    { id: 'customers', label: 'المحفظة الشاملة', icon: '📁' },
    { id: 'calculator', label: 'حاسبة الخصم المعتمدة', icon: '🧮' },
    { id: 'deceased', label: 'محفظة العملاء المتوفين', icon: '🕊️' },
    { id: 'salary', label: 'محفظة عملاء الرواتب', icon: '🏦' },
    { id: 'new', label: 'محفظة حديثي التعثّر (0-2)', icon: '✨' },
    { id: 'promises', label: 'محفظة وعود السداد', icon: '🤝' },
    { id: 'sabil', label: 'محفظة عملاء طلبات سيبل', icon: '📑' },
    { id: 'exemption', label: 'محفظة طلبات الاعفاء الشامله', icon: '🛡️' },
    { id: 'reports', label: 'تحليل الأداء الإجمالي', icon: '📈' },
  ] as const;

  const handleMenuItemClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onClose) onClose(); 
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90] md:hidden rounded-none"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 right-0 z-[100] w-64 bg-slate-950 text-white flex flex-col border-l border-slate-800 shrink-0 transition-transform duration-300 transform rounded-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 flex flex-col gap-4 border-b border-white/5 bg-slate-950 rounded-none">
          <div className="flex items-center justify-between gap-2">
            <div className="relative w-full h-20 shrink-0 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="ProDebt Logo" 
                className="w-full h-full object-contain filter drop-shadow-lg scale-125"
              />
            </div>
            
            <button 
              onClick={onClose}
              className="md:hidden w-8 h-8 bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors rounded-none"
            >
              <span className="text-slate-400 text-lg">&times;</span>
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-[12px] font-bold text-white uppercase leading-none">ProDebt System</h1>
          </div>
        </div>
        
        <nav className="p-0 space-y-0 mt-2 flex-1 overflow-y-auto custom-scrollbar rounded-none">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 transition-all relative overflow-hidden group rounded-none border-b border-white/5 ${
                activeTab === item.id 
                  ? 'bg-teal-600 text-white shadow-none' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="font-bold text-[12px] text-right flex-1">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-3 rounded-none">
          <button 
            onClick={() => {
              if (onReset) onReset();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-[11px] font-bold rounded-none"
          >
            <span>🗑️</span>
            <span>إعادة ضبط قاعدة البيانات</span>
          </button>
        </div>

        <div className="p-5 border-t border-white/5 bg-black/20 rounded-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center text-[11px] font-bold border border-slate-700 rounded-none">PD</div>
            <div className="text-right">
              <p className="text-[12px] font-bold text-slate-100 leading-none mb-1">بوابة الموظف</p>
              <p className="text-[10px] font-bold text-teal-500 uppercase leading-none">اتصال آمن نشط</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
