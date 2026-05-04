
import React, { useState } from 'react';
import { User } from '../types.ts';

const USERS_DATABASE: User[] = [
  { collectorName: "مدير النظام", username: "admin", password: "admin", isAdmin: true },
  { collectorName: "موظف تحصيل", username: "972559", password: "123456", isAdmin: false },
  { collectorName: "موظف تحصيل", username: "100200", password: "123456", isAdmin: false },
  { collectorName: "موظف تحصيل", username: "300400", password: "123456", isAdmin: false }
];

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Updated Robot Logo URL
  const logoUrl = "https://h.top4top.io/p_3692pcm2r1.jpg";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      const user = USERS_DATABASE.find(u => 
        u.username.trim() === username.trim()
      );

      if (user) {
        if (user.username === "admin" && password !== "admin") {
          setError('كلمة السر الخاصة بالمدير غير صحيحة');
          setLoading(false);
          return;
        }
        onLoginSuccess(user);
      } else {
        if (username.length >= 5 && /^\d+$/.test(username)) {
           onLoginSuccess({
             collectorName: `محصل (${username})`,
             username: username,
             password: password,
             isAdmin: false
           });
        } else {
          setError('عذراً، الرقم الوظيفي غير مسجل أو غير صالح');
          setLoading(false);
        }
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300" dir="rtl">
      <div className="bg-white w-full max-w-md shadow-premium overflow-hidden rounded-none border border-slate-100 flex flex-col">
        
        <div className="pt-10 pb-6 px-10 flex flex-col items-center text-center">
          <div className="w-full h-44 mb-4 relative flex items-center justify-center bg-white">
            <img 
              src={logoUrl} 
              alt="ProDebt Robot Logo" 
              className="w-auto h-full object-contain mix-blend-multiply"
            />
          </div>
          
          <h2 className="text-xl font-black text-slate-800 uppercase mb-1">
            PRODEBT COLLECTION SYSTEM
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-6">
            SECURED ACCESS GATEWAY
          </p>
        </div>

        <form onSubmit={handleLogin} className="px-10 pb-10 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-none animate-in shake duration-300 text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">COLLECTOR ID</label>
              <label className="text-[9px] font-black text-slate-400">الرقم الوظيفي للمحصل</label>
            </div>
            <input 
              type="text" 
              inputMode="numeric"
              required
              placeholder=""
              value={username}
              onChange={(e) => {
                const val = e.target.value;
                if (val.toLowerCase() === 'admin' || /^\d*$/.test(val)) {
                   setUsername(val);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all text-center"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">PASSWORD</label>
              <label className="text-[9px] font-black text-slate-400">كلمة السر</label>
            </div>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-none py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all text-center"
            />
          </div>

          <div className="space-y-3 pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-950 text-white rounded-none font-black text-xs uppercase shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-none animate-spin"></span>
              ) : (
                <>
                  <span>دخول إلى النظام</span>
                  <span className="text-base">🔐</span>
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-slate-100 text-slate-500 rounded-none font-black text-xs uppercase hover:bg-slate-200 transition-all"
            >
              الرجوع للصفحة الرئيسية
            </button>
          </div>
        </form>

        <div className="bg-slate-50 py-4 px-10 border-t border-slate-100 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase">
            Neural Encryption Enabled • System v4.6
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
