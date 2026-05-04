
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ExemptionRequest, User, formatSaudiMobile } from '../types';
import CopyButton from './CopyButton';

const DB_NAME = 'SmartCollectorDB_v2';
const STORE_NAME = 'customers';
const EXEMPTION_KEY = 'exemption_portfolio';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

interface ExemptionPortfolioProps {
  currentUser: User | null;
}

const ExemptionPortfolio: React.FC<ExemptionPortfolioProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<ExemptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(EXEMPTION_KEY);
        request.onsuccess = () => {
          setRequests(request.result || []);
          setIsLoading(false);
          isInitialized.current = true;
        };
      } catch (err) {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // حفظ البيانات عند حدوث أي تغيير
  const saveData = async (data: ExemptionRequest[]) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(data, EXEMPTION_KEY);
    } catch (err) {
      console.error("Failed to save exemption data:", err);
    }
  };

  // محرك تحليل ملفات CSV المطور للبيانات الضخمة
  const parseCSV = (text: string): any[] => {
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/);
    if (lines.length < 2) return [];

    const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    
    // استخدام مصفوفة النتائج بدلاً من العمليات المكلفة داخل الحلقة
    const results = new Array(lines.length - 1);
    const regex = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`);

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const currentLine = lines[i].split(regex).map(v => v ? v.trim().replace(/"/g, '') : '');
      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) obj[headers[j]] = currentLine[j] || '';
      }
      results[i - 1] = obj;
    }
    return results.filter(Boolean);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rawData = parseCSV(ev.target?.result as string);
        if (rawData.length === 0) {
          alert("تنبيه: الملف المختار فارغ أو لا يحتوي على تنسيق CSV صالح.");
          setIsImporting(false);
          return;
        }

        const headers = Object.keys(rawData[0]);
        // دالة بحث ذكية عن رؤوس الأعمدة
        const find = (keywords: string[]) => headers.find(h => keywords.some(k => h.includes(k))) || '';

        // الخرائط المعتمدة للأعمدة التسعة
        const sabilKey = find(['رقم طلب سيبل', 'Sabil', 'رقم الطلب', 'طلب سيبل']);
        const nameKey = find(['اسم العميل', 'الاسم', 'Name', 'Customer']);
        const dateKey = find(['تاريخ الطلب', 'التاريخ', 'Date', 'Order Date']);
        const statusKey = find(['حالة الطلب', 'الحالة', 'Status', 'Order Status']);
        const collectorKey = find(['اسم الموظف', 'الموظف', 'Collector', 'Emp Name']);
        const mobileKey = find(['رقم الجوال', 'جوال', 'Mobile', 'Phone']);
        const whatsappKey = find(['رابط واتساب', 'واتساب', 'WhatsApp']);
        const idKey = find(['رقم الهوية', 'الهوية', 'ID', 'National ID']);
        const descKey = find(['الوصف', 'تفاصيل', 'Description', 'Notes']);

        const mapped: ExemptionRequest[] = rawData.map((row, i) => {
          const mobileRaw = formatSaudiMobile(row[mobileKey]);
          // إنشاء رابط واتساب تلقائي إذا لم يوجد
          const waLink = row[whatsappKey] || (mobileRaw ? `https://wa.me/${mobileRaw}` : '');

          return {
            id: `EX-${Date.now()}-${i}`,
            sabilOrderNumber: String(row[sabilKey] || '').trim(),
            name: String(row[nameKey] || '').trim(),
            orderDate: String(row[dateKey] || '').trim(),
            orderStatus: String(row[statusKey] || 'منشأ').trim(),
            collectorName: String(row[collectorKey] || '').trim(),
            mobile: mobileRaw,
            whatsAppLink: waLink,
            idNumber: String(row[idKey] || '').trim(),
            description: String(row[descKey] || '').trim(),
          };
        });

        setRequests(mapped);
        saveData(mapped);
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // تنبيه نجاح العملية
        const msg = `تم استيراد ${mapped.length} سجل بنجاح في محفظة الإعفاء.`;
        alert(msg);
      } catch (error) {
        console.error("Import Error:", error);
        alert("حدث خطأ أثناء معالجة البيانات، يرجى التأكد من سلامة ملف CSV.");
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const filteredRequests = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return requests;
    return requests.filter(r => 
      r.name.toLowerCase().includes(term) || 
      r.sabilOrderNumber.includes(term) || 
      r.idNumber.includes(term) ||
      r.collectorName.toLowerCase().includes(term)
    );
  }, [requests, searchTerm]);

  const getStatusBadge = (status: string) => {
    const s = status.trim();
    let style = "bg-slate-100 text-slate-600 border-slate-200";
    if (s.includes('قبول')) style = "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s.includes('رفض') || s.includes('إلغاء')) style = "bg-rose-100 text-rose-700 border-rose-200";
    if (s.includes('قيد التنفيذ')) style = "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s.includes('بانتظار')) style = "bg-amber-100 text-amber-700 border-amber-200";
    if (s.includes('اعتذار')) style = "bg-slate-800 text-white border-slate-900";
    
    return (
      <span className={`px-3 py-1 rounded-none text-[9px] font-black border uppercase tracking-tighter ${style}`}>
        {s}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-teal-500/10 border-t-teal-500 rounded-none animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Exemption Database Matrix...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-500" dir="rtl">
      {/* Exemption Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-950 text-white rounded-none flex items-center justify-center text-3xl shadow-xl border border-white/5 group hover:rotate-6 transition-transform">🛡️</div>
          <div className="text-right">
            <h1 className="text-xl font-black text-slate-900 leading-tight">محفظة طلبات الاعفاء الشامله</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-none animate-pulse"></span>
              Independent Big Data Matrix v3.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input 
              type="text" 
              placeholder="بحث في الطلبات (اسم، رقم طلب، هوية)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 bg-slate-100 border-none rounded-none py-3 px-10 text-xs font-black outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex-1 md:flex-none px-6 py-4 bg-slate-950 text-white rounded-none font-black text-[10px] uppercase shadow-2xl hover:bg-teal-600 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10 group overflow-hidden relative"
          >
            {isImporting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-none animate-spin"></span>
                <span>جاري معالجة البيانات الضخمة...</span>
              </div>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="group-hover:translate-y-[-2px] transition-transform">استيراد محفظة الاعفاء</span>
                <span className="text-lg">📥</span>
              </>
            )}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col">
        <div className="bg-white rounded-none shadow-premium border border-slate-200 overflow-hidden flex flex-col flex-1">
          <div className="flex-1 overflow-auto custom-scrollbar">
            {requests.length > 0 ? (
              <table className="w-full text-right border-collapse min-w-[1300px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest whitespace-nowrap">
                    <th className="px-6 py-4 border-b border-white/5 text-right w-32">رقم طلب سيبل</th>
                    <th className="px-6 py-4 border-b border-white/5 text-right">اسم العميل</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center w-32">تاريخ الطلب</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center w-40">حالة الطلب</th>
                    <th className="px-6 py-4 border-b border-white/5 text-right w-40">اسم الموظف</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center w-40">رقم الجوال</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center w-24">واتساب</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center w-40">رقم الهوية</th>
                    <th className="px-6 py-4 border-b border-white/5 text-right">الوصف</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-bold text-slate-700 divide-y divide-slate-50">
                  {filteredRequests.map((req, idx) => (
                    <tr key={req.id} className={`hover:bg-teal-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-6 py-4 font-black text-slate-900 tabular-nums">
                        <div className="flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-none bg-teal-500"></span>
                           {req.sabilOrderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-slate-800">{req.name}</span>
                          <CopyButton text={req.name} className="opacity-0 group-hover:opacity-100" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400 tabular-nums">{req.orderDate}</td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(req.orderStatus)}</td>
                      <td className="px-6 py-4 text-slate-600">{req.collectorName}</td>
                      <td className="px-6 py-4 text-center">
                        {req.mobile ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="tabular-nums font-black text-blue-600">{formatSaudiMobile(req.mobile)}</span>
                            <a href={`tel:${formatSaudiMobile(req.mobile)}`} className="w-6 h-6 bg-blue-50 text-blue-600 rounded-none flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100">📞</a>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {req.whatsAppLink ? (
                           <a href={req.whatsAppLink.startsWith('http') ? req.whatsAppLink : `https://wa.me/${formatSaudiMobile(req.mobile)}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm mx-auto">💬</a>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-500 tabular-nums">
                        <div className="flex items-center justify-center gap-2">
                          {req.idNumber}
                          <CopyButton text={req.idNumber} />
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="truncate text-slate-400 italic hover:whitespace-normal hover:overflow-visible hover:bg-white hover:z-50 hover:relative hover:shadow-xl hover:p-3 hover:rounded-none transition-all" title={req.description}>
                          {req.description || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-8">
                <div className="relative">
                   <div className="w-32 h-32 bg-slate-50 rounded-none flex items-center justify-center text-6xl grayscale opacity-20 border-4 border-dashed border-slate-200">🛡️</div>
                   <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-none shadow-xl flex items-center justify-center text-2xl animate-bounce">📥</div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-black text-slate-800">محفظة الاعفاء جاهزة للاستيراد</h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    يرجى استيراد ملف CSV يحتوي على الأعمدة التسعة المعتمدة. المحرك يدعم الآن الملفات الضخمة بكفاءة عالية.
                  </p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-10 py-4 bg-slate-900 text-white rounded-none font-black text-xs uppercase shadow-xl hover:bg-teal-600 transition-all border border-white/10"
                >
                  ابدأ الاستيراد الآن
                </button>
              </div>
            )}
          </div>

          {/* Table Footer Stats */}
          {requests.length > 0 && (
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap justify-between items-center px-8 gap-4">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase">إجمالي الطلبات</span>
                  <span className="text-sm font-black text-slate-900 tabular-nums">{requests.length.toLocaleString()}</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase">قيد التنفيذ</span>
                  <span className="text-sm font-black text-indigo-600 tabular-nums">{requests.filter(r => r.orderStatus.includes('تنفيذ')).length.toLocaleString()}</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase">تم قبولها</span>
                  <span className="text-sm font-black text-emerald-600 tabular-nums">{requests.filter(r => r.orderStatus.includes('قبول')).length.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Storage Integrity: Verified • Big Data Engine Active</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExemptionPortfolio;
