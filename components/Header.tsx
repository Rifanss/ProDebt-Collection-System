
import React from 'react';
import { User } from '../types.ts';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onImportClick: () => void;
  onTemplateClick: () => void;
  onMenuClick: () => void;
  currentUser: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  onImportClick, 
  onTemplateClick,
  onMenuClick,
  currentUser,
  onLogout,
  onLoginClick
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-[40] shrink-0 rounded-none shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-100 text-slate-600 text-xl rounded-xl transition-colors md:hidden"
        >
          ☰
        </button>
        
        <div className="relative group flex-1 max-w-xs md:max-w-sm">
          <input
            type="text"
            placeholder="بحث سريع (اسم، حساب، هوية)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all outline-none text-right text-[11px] font-bold"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-teal-500 transition-colors">🔍</div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {currentUser ? (
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4 ml-0 hidden sm:flex">
             <div className="text-left">
               <p className="text-[10px] font-black text-slate-800 leading-none mb-1">
                 {currentUser.collectorName}
               </p>
               <p className="text-[8px] font-bold text-teal-600 uppercase leading-none">
                 {currentUser.isAdmin ? 'مدير النظام' : 'محصل معتمد'}
               </p>
             </div>
             <button 
               onClick={onLogout}
               className="w-8 h-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center text-[10px] font-black rounded-lg border border-rose-100"
               title="تسجيل خروج"
             >
               ✕
             </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="px-4 py-2 bg-teal-50 text-teal-700 border border-teal-100 rounded-xl hover:bg-teal-100 transition-all text-[11px] font-black flex items-center gap-2"
          >
            <span>دخول</span>
            <span>🔐</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button 
            onClick={onTemplateClick}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
            title="تعديل قالب الرسائل"
          >
            <span className="text-lg">💬</span>
          </button>

          {(!currentUser || currentUser?.isAdmin) && (
            <button 
              onClick={onImportClick}
              className="relative group flex items-center gap-2.5 px-4 md:px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-teal-600 active:scale-95 transition-all duration-300 text-[11px] font-black shadow-lg shadow-slate-900/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <span className="hidden lg:inline relative z-10">استيراد المحفظة الجديدة</span>
              <span className="relative z-10 text-base md:text-lg">📥</span>
              <div className="absolute top-1 right-1 w-2 h-2 bg-teal-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
