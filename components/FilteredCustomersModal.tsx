
import React, { useMemo, useState } from 'react';
import { Customer, CollectionStatus, formatSaudiMobile } from '../types.ts';
import CustomerDetailModal from './CustomerDetailModal.tsx';
import CopyButton from './CopyButton.tsx';

interface FilteredCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  title: string;
  onUpdateField?: (id: string, field: keyof Customer, value: any) => void;
  messageTemplate?: string;
}

const FilteredCustomersModal: React.FC<FilteredCustomersModalProps> = ({ isOpen, onClose, customers, title, onUpdateField, messageTemplate }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isPinned, setIsPinned] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [filters, setFilters] = useState<Partial<Record<keyof Customer, string>>>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer | null, direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  // تغيير وضع العرض الافتراضي إلى 'table' بناءً على طلب المستخدم
  const [viewMode, setViewMode] = useState<'summary' | 'table'>('table');

  const togglePin = (key: string) => {
    setIsPinned(prev => !prev);
  };

  const getStatusColor = (s: string) => {
    const status = s as CollectionStatus;
    switch(status) {
      case CollectionStatus.SETTLED: return 'bg-emerald-600 text-white border-emerald-700';
      case CollectionStatus.PROMISED: return 'bg-amber-400 text-slate-900 border-amber-500 font-black';
      case CollectionStatus.WRONG_DATA: return 'bg-rose-600 text-white border-rose-700';
      case CollectionStatus.REFUSED: return 'bg-slate-800 text-white border-slate-900';
      case CollectionStatus.UNRESOLVED: return 'bg-indigo-500 text-white border-indigo-600';
      case CollectionStatus.NO_ANSWER: return 'bg-slate-300 text-slate-700 border-slate-400';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const statusOptions = Object.values(CollectionStatus);

  const columns = [
    { key: 'name', label: 'اسم العميل', width: '180px', sticky: true },
    { key: 'accountNumber', label: 'رقم الحساب', width: '120px' },
    { key: 'amount', label: 'مبلغ المديونية', width: '110px', color: 'text-teal-600 font-black' },
    { key: 'fixation', label: 'التثبيت', width: '100px' },
    { key: 'status', label: 'الاكشن', width: '110px' },
    { key: 'followUpDate', label: 'تاريخ المتابعة', width: '100px' },
    { key: 'idNumber', label: 'رقم الهوية', width: '120px' },
    { key: 'mobile', label: 'رقم الجوال', width: '120px' },
    { key: 'whatsAppLink', label: 'زر تواصل واتساب', width: '110px' },
    { key: 'collectorName', label: 'اسم المحصل', width: '150px' },
    { key: 'employeeId', label: 'الرقم الوظيفي', width: '100px' },
    { key: 'supervisorName', label: 'اسم المشرف', width: '150px' },
    { key: 'product', label: 'نوع المنتج', width: '90px' },
    { key: 'debtAge', label: 'عمر الدين', width: '90px' },
    { key: 'businessEvaluation', label: 'حسابات تقييم أعمال', width: '130px' },
    { key: 'freezeDate', label: 'تاريخ التجميد', width: '110px' },
    { key: 'ageOver60', label: 'عمر العميل فوق 60', width: '100px' },
    { key: 'salaryClient', label: 'عميل رواتب', width: '100px' },
    { key: 'isDeceased', label: 'عميل متوفي', width: '100px' },
    { key: 'unarchivedBond', label: 'سند غير مؤرشف', width: '110px' },
    { key: 'caseNumber', label: 'رقم القضية', width: '110px', color: 'text-rose-600 font-black' },
    { key: 'executiveReferenceNumber', label: 'رقم المرجع التنفيذي', width: '130px' },
    { key: 'courtName', label: 'اسم المحكمة', width: '150px' },
    { key: 'sabilOrderNumber', label: 'رقم طلب سيبل', width: '110px' },
    { key: 'orderNotes', label: 'ملاحظات على الطلب', width: '200px' },
    { key: 'balances', label: 'الأرصدة', width: '110px', color: 'text-emerald-600 font-black' },
    { key: 'discountRate', label: 'نسبة الخصم', width: '80px' },
    { key: 'settlementAmount', label: 'مبلغ التسوية', width: '110px', color: 'text-teal-600 font-black' },
    { key: 'paymentAmount', label: 'السداد', width: '110px', bg: 'bg-yellow-100 font-black' },
  ];

  const productSummary = useMemo(() => {
    const pf = customers.filter(c => c.product === 'PF' || c.product === 'BF');
    const al = customers.filter(c => c.product === 'AL');
    const cc = customers.filter(c => c.product === 'CC');

    return [
      { 
        id: 'PF', 
        label: 'التمويل الشخصي PF', 
        count: pf.length, 
        amount: pf.reduce((s, c) => s + (c.amount || 0), 0),
        bgColor: 'bg-indigo-50/50',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-100',
        icon: '🏦'
      },
      { 
        id: 'AL', 
        label: 'التمويل التأجيري AL', 
        count: al.length, 
        amount: al.reduce((s, c) => s + (c.amount || 0), 0),
        bgColor: 'bg-teal-50/50',
        textColor: 'text-teal-600',
        borderColor: 'border-teal-100',
        icon: '🚗'
      },
      { 
        id: 'CC', 
        label: 'البطائق الإئتمانية CC', 
        count: cc.length, 
        amount: cc.reduce((s, c) => s + (c.amount || 0), 0),
        bgColor: 'bg-amber-50/50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-100',
        icon: '💳'
      }
    ];
  }, [customers]);

  const handleFilterChange = (key: keyof Customer, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let data = customers.filter(c => {
      const searchMatch = !localSearch.trim() || 
        String(c.name).toLowerCase().includes(localSearch.toLowerCase()) || 
        String(c.accountNumber).includes(localSearch) || 
        String(c.idNumber).includes(localSearch);

      const columnMatch = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return String(c[key as keyof Customer] || '').toLowerCase().includes((value as string).toLowerCase());
      });

      return searchMatch && columnMatch;
    });

    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [customers, localSearch, filters, sortConfig]);

  if (!isOpen) return null;

  const totalTableWidth = columns.reduce((acc, col) => acc + parseInt(col.width), 0);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
      <div className={`flex flex-col overflow-hidden bg-white shadow-premium transition-all duration-500 ${viewMode === 'summary' ? 'w-full md:max-w-4xl md:rounded-[2.5rem] h-full md:h-auto' : 'w-full h-full'}`}>
        
        {/* Header */}
        <div className="bg-slate-900 p-3 md:p-2 flex justify-between items-center shrink-0 border-b border-white/5" dir="rtl">
          <div className="flex items-center gap-3 pr-2">
             <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
             <h2 className="text-[10px] md:text-[11px] font-black text-white/90 uppercase tracking-widest">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center text-white/60 hover:text-white hover:bg-rose-500 rounded-xl transition-all text-2xl md:text-lg font-light">&times;</button>
        </div>

        {viewMode === 'summary' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 bg-white overflow-y-auto" dir="rtl">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mb-12">
              {productSummary.map((prod) => (
                <div key={prod.id} className={`${prod.bgColor} rounded-[2rem] p-5 md:p-6 flex flex-row items-center gap-5 shadow-soft border ${prod.borderColor} hover:scale-[1.02] transition-transform`}>
                  <div className="w-16 h-16 md:w-14 md:h-14 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl md:text-2xl shadow-sm border border-white group-hover:rotate-6 transition-transform shrink-0">
                    {prod.icon}
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <h3 className={`text-[12px] md:text-[11px] font-black ${prod.textColor} truncate uppercase mb-1 tracking-tight`}>{prod.label}</h3>
                    <div className="space-y-0.5">
                      <p className="text-[11px] md:text-[10px] font-bold text-slate-500">
                        العدد: <span className="font-black text-slate-800 tabular-nums">{prod.count.toLocaleString()} حساب</span>
                      </p>
                      <p className="text-[11px] md:text-[10px] font-bold text-slate-500">
                        المبلغ: <span className="font-black text-slate-900 tabular-nums">SAR {prod.amount.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-md px-6">
              <button 
                onClick={() => setViewMode('table')}
                className="w-full md:flex-1 py-3.5 md:py-3 bg-slate-900 text-white rounded-2xl md:rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:bg-teal-600 transition-all border border-white/10"
              >
                المحفظة كاملة
              </button>
              <button 
                onClick={onClose}
                className="w-full md:flex-1 py-3.5 md:py-3 bg-slate-50 text-slate-500 rounded-2xl md:rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-soft hover:bg-slate-100 transition-all border border-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Search/Tools Bar */}
            <div className="bg-white/80 backdrop-blur-md p-2 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2" dir="rtl">
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('summary')} className="px-4 py-1.5 bg-slate-100 text-slate-600 font-bold text-[9px] rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-widest">إحصائيات المحفظة</button>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="بحث في النتائج..." 
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none w-36 md:w-56 focus:bg-white focus:ring-2 focus:ring-teal-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="px-3 py-1 bg-slate-900/5 text-[9px] font-black text-slate-500 rounded-full border border-slate-900/10">إجمالي السجلات: {filteredAndSortedData.length}</div>
            </div>

            {/* Table View */}
            <div className="flex-1 overflow-auto custom-scrollbar relative" dir="ltr">
              <table className="text-center border-separate border-spacing-0" style={{ minWidth: `${totalTableWidth}px` }}>
                <thead className="sticky top-0 z-30 shadow-soft">
                  <tr className="bg-slate-900 text-white font-black uppercase text-[8px] whitespace-nowrap">
                    {columns.map((col) => (
                      <th 
                        key={col.key}
                        style={{ 
                          width: col.width,
                          minWidth: col.width,
                          left: col.sticky && isPinned ? 0 : 'auto'
                        }}
                        className={`px-1 py-3 border-b border-r border-white/5 transition-all cursor-pointer hover:bg-slate-800 ${col.sticky && isPinned ? 'sticky left-0 z-40 bg-slate-900 shadow-[4px_0_15px_rgba(0,0,0,0.3)]' : ''} select-none tracking-widest`}
                        onClick={() => handleSort(col.key as keyof Customer)}
                      >
                        <div className="flex items-center justify-between px-1.5 gap-1">
                          <span className="truncate">{col.label}</span>
                          {col.sticky && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); togglePin(col.key as string); }}
                              className={`w-4 h-4 rounded-lg flex items-center justify-center transition-all shrink-0 text-[7px] border ${isPinned ? 'bg-teal-600 border-teal-500' : 'bg-slate-700 border-slate-600 opacity-40 hover:opacity-100'}`}
                            >
                              📌
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[10px] font-bold text-slate-600">
                  {filteredAndSortedData.map((c, idx) => (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCustomer(c)} 
                      className={`group transition-colors hover:bg-teal-50/50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      {columns.map((col) => (
                        <td 
                          key={`${c.id}-${col.key}`}
                          style={{ 
                            left: col.sticky && isPinned ? 0 : 'auto'
                          }}
                          className={`px-2 py-2.5 border-b border-r border-slate-100 truncate transition-all ${col.sticky && isPinned ? 'sticky left-0 z-20 shadow-[4px_0_10px_rgba(0,0,0,0.03)] font-black text-slate-900' : ''} ${col.color || ''} ${col.bg || ''} ${col.sticky && isPinned ? (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30') : ''} group-hover:bg-teal-50/50`}
                        >
                          {col.key === 'paymentAmount' ? (
                            <input 
                              type="number" 
                              value={c[col.key as keyof Customer] || 0} 
                              onClick={e => e.stopPropagation()} 
                              onChange={e => onUpdateField?.(c.id, 'paymentAmount', parseFloat(e.target.value) || 0)} 
                              className="w-full bg-transparent border-none outline-none text-center font-black text-slate-900 tabular-nums py-0.5" 
                            />
                          ) : col.key === 'status' ? (
                            <select
                              value={c.status}
                              dir="rtl"
                              onClick={e => e.stopPropagation()}
                              onChange={e => onUpdateField?.(c.id, 'status', e.target.value)}
                              className={`w-full h-6 rounded-lg px-0.5 text-[8px] font-black uppercase border-none outline-none appearance-none text-center cursor-pointer shadow-sm ${getStatusColor(c.status)}`}
                            >
                              {statusOptions.map(opt => (
                                <option key={opt} value={opt} className="bg-white text-slate-900 font-bold">{opt}</option>
                              ))}
                            </select>
                          ) : col.key === 'mobile' ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="tabular-nums">{formatSaudiMobile(c.mobile) || '-'}</span>
                              {c.mobile && (
                                <a 
                                  href={`tel:${formatSaudiMobile(c.mobile)}`} 
                                  onClick={e => e.stopPropagation()}
                                  className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                  title="اتصال الآن"
                                >
                                  📞
                                </a>
                              )}
                            </div>
                          ) : col.key === 'whatsAppLink' ? (
                            <div className="flex items-center justify-center">
                              {c.mobile ? (
                                <a 
                                  href={`https://wa.me/${formatSaudiMobile(c.mobile)}${messageTemplate ? `?text=${encodeURIComponent(messageTemplate.replace(/{customerFirstName}/g, c.name.split(' ')[0]).replace(/{collectorFirstName}/g, c.collectorName || '').replace(/{amount}/g, (c.amount || 0).toLocaleString()))}` : ''}`}
                                  onClick={e => e.stopPropagation()}
                                  target="_blank"
                                  className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                  title="إرسال رسالة"
                                >
                                  <span className="text-[10px]">💬</span>
                                </a>
                              ) : (
                                <span className="text-slate-200 opacity-50">-</span>
                              )}
                            </div>
                          ) : col.key === 'name' ? (
                            <div className="flex items-center justify-between gap-1 w-full truncate">
                              <span className="truncate">{c.name}</span>
                              <CopyButton text={c.name} />
                            </div>
                          ) : col.key === 'accountNumber' ? (
                            <div className="flex items-center justify-center gap-1 w-full tabular-nums">
                              <span>{c.accountNumber}</span>
                              <CopyButton text={c.accountNumber} />
                            </div>
                          ) : (
                            ['amount', 'balances', 'settlementAmount'].includes(col.key) 
                              ? (c[col.key as keyof Customer] as number || 0).toLocaleString()
                              : (String(c[col.key as keyof Customer] || '-'))
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {selectedCustomer && (
        <CustomerDetailModal 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
          onUpdateField={onUpdateField} 
          messageTemplate={messageTemplate}
        />
      )}
    </div>
  );
};

export default FilteredCustomersModal;
