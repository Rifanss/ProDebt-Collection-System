
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
    <header className="h-12 bg-white border-b border-slate-200 px-3 flex items-center justify-between sticky top-0 z-[40] shrink-0 rounded-none shadow-sm">
      <div className="flex items-center gap-2 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-1.5 hover:bg-slate-100 text-slate-600 text-lg rounded-none transition-colors md:hidden"
        >
          ☰
        </button>
        
        <div className="relative group flex-1 max-w-[120px] md:max-w-xs">
          <input
            type="text"
            placeholder="بحث سريع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-none py-1.5 pr-8 pl-2 focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all outline-none text-right text-[10px] font-bold"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] group-focus-within:text-teal-500 transition-colors">🔍</div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {currentUser ? (
          <div className="flex items-center gap-2 border-l border-slate-100 pl-2 ml-0 hidden sm:flex">
             <div className="text-left">
               <p className="text-[9px] font-black text-slate-800 leading-none mb-0.5">
                 {currentUser.collectorName}
               </p>
               <p className="text-[7px] font-bold text-teal-600 uppercase leading-none">
                 {currentUser.isAdmin ? 'مدير النظام' : 'محصل معتمد'}
               </p>
             </div>
             <button 
               onClick={onLogout}
               className="w-7 h-7 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center text-[9px] font-black rounded-none border border-rose-100"
               title="تسجيل خروج"
             >
               ✕
             </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-none hover:bg-teal-100 transition-all text-[10px] font-black flex items-center gap-1"
          >
            <span className="hidden xs:inline">دخول</span>
            <span className="text-xs">🔐</span>
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <button 
            onClick={onTemplateClick}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-none transition-all border border-transparent hover:border-slate-200"
            title="تعديل قالب الرسائل"
          >
            <span className="text-sm">💬</span>
          </button>

          {(!currentUser || currentUser?.isAdmin) && (
            <button 
              onClick={onImportClick}
              className="relative group flex items-center gap-1.5 px-3 md:px-4 py-1.5 bg-slate-900 text-white rounded-none hover:bg-teal-600 active:scale-95 transition-all duration-300 text-[10px] font-black shadow-lg shadow-slate-900/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <span className="hidden md:inline relative z-10">استيراد</span>
              <span className="relative z-10 text-xs md:text-sm">📥</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
