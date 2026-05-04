
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Customer, CollectionStatus, formatSaudiMobile, getWhatsAppLink } from '../types.ts';
import CustomerDetailModal from './CustomerDetailModal.tsx';
import CopyButton from './CopyButton.tsx';

interface CustomerTableProps {
  customers: Customer[];
  onUpdateField: (id: string, field: keyof Customer, value: any) => void;
  messageTemplate: string;
}

const ROW_HEIGHT = 56; 
const VISIBLE_ROWS = 25; 
const BUFFER_ROWS = 10; 

interface TableColumn {
  key: keyof Customer;
  label: string;
  width: string;
  pin?: boolean; 
  color?: string;
  bg?: string;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onUpdateField, messageTemplate }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filters, setFilters] = useState<Partial<Record<keyof Customer, string>>>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer | null, direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  const [scrollTop, setScrollTop] = useState(0);
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(['name']); 
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = (field: keyof Customer, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    if (containerRef.current) containerRef.current.scrollTop = 0;
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

  const togglePin = (key: string) => {
    setPinnedKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const initialColumns: TableColumn[] = [
    { key: 'name', label: 'اسم العميل', width: '180px' },
    { key: 'accountNumber', label: 'رقم الحساب', width: '120px' },
    { key: 'amount', label: 'مبلغ المديونية', width: '110px', color: 'text-teal-600 font-black' },
    { key: 'fixation', label: 'التثبيت', width: '100px' },
    { key: 'status', label: 'الاكشن', width: '110px' },
    { key: 'followUpDate', label: 'تاريخ المتابعة', width: '100px' },
    { key: 'idNumber', label: 'رقم الهوية', width: '120px' },
    { key: 'mobile', label: 'رقم الجوال', width: '120px' },
    { key: 'whatsAppLink', label: 'زر تواصل واتساب', width: '100px' },
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
    { key: 'paymentAmount', label: 'السداد', width: '110px', bg: 'bg-yellow-50 font-black' },
  ];

  const activeColumns = useMemo(() => {
    const pinned = initialColumns.filter(c => pinnedKeys.includes(c.key as string));
    const unpinned = initialColumns.filter(c => !pinnedKeys.includes(c.key as string));
    const reordered = [...pinned, ...unpinned];
    let currentLeft = 0;
    return reordered.map(col => {
      const isPinned = pinnedKeys.includes(col.key as string);
      const leftValue = isPinned ? currentLeft : undefined;
      if (isPinned) currentLeft += parseInt(col.width);
      return { ...col, isPinned, leftValue };
    });
  }, [pinnedKeys]);

  const filteredAndSortedData = useMemo(() => {
    let result = customers.filter(c => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const fieldKey = key as keyof Customer;
        const fieldValue = String(c[fieldKey] || '').toLowerCase();
        return fieldValue.includes((value as string).toLowerCase());
      });
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
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

    return result;
  }, [customers, filters, sortConfig]);

  const totalHeight = filteredAndSortedData.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIndex = Math.min(filteredAndSortedData.length, Math.floor(scrollTop / ROW_HEIGHT) + VISIBLE_ROWS + BUFFER_ROWS);
  const visibleData = filteredAndSortedData.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    requestAnimationFrame(() => {
      setScrollTop(currentScrollTop);
    });
  }, []);

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
  const totalTableWidth = initialColumns.reduce((acc, col) => acc + parseInt(col.width), 0);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative border-r border-slate-200">
      <div 
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 overflow-auto custom-scrollbar relative" 
        dir="ltr"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative', width: 'max-content' }}>
          <table 
            className="text-[9px] text-center border-separate border-spacing-0 table-fixed"
            style={{ width: `${totalTableWidth}px`, position: 'absolute', top: 0, left: 0 }}
          >
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-950 text-white font-black uppercase whitespace-nowrap">
                {activeColumns.map(col => (
                  <th 
                    key={col.key}
                    style={{ 
                      width: col.width, 
                      left: col.leftValue !== undefined ? col.leftValue : 'auto',
                      zIndex: col.isPinned ? 40 : 'auto'
                    }} 
                    className={`px-1 py-3 border-b border-r border-white/10 transition-all ${col.isPinned ? 'sticky bg-slate-950 shadow-[4px_0_10px_rgba(0,0,0,0.4)]' : ''} cursor-pointer hover:bg-slate-900 select-none`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center justify-between px-1 gap-1">
                      <div className="flex items-center gap-1 truncate">
                        <span className="truncate">{col.label}</span>
                        <span className="text-[7px] text-teal-400 inline-block w-2">
                          {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePin(col.key as string); }}
                        className={`w-4 h-4 rounded-none flex items-center justify-center transition-all active:scale-90 text-[8px] shrink-0 border border-white/10 ${col.isPinned ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        📌
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-900 shadow-lg">
                {activeColumns.map(col => (
                  <th 
                    key={`filter-${col.key}`}
                    style={{ 
                      left: col.leftValue !== undefined ? col.leftValue : 'auto',
                      zIndex: col.isPinned ? 40 : 'auto'
                    }}
                    className={`px-1 py-2 border-b border-r border-white/10 transition-all ${col.isPinned ? 'sticky bg-slate-900 shadow-[4px_0_10px_rgba(0,0,0,0.4)]' : ''}`}
                  >
                    <input 
                      type="text"
                      placeholder={`...`}
                      value={filters[col.key] || ''}
                      onChange={e => handleFilterChange(col.key, e.target.value)}
                      className="w-full bg-slate-800/60 text-white border border-white/10 rounded-none px-1.5 py-1 text-[8px] outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-600 text-center transition-all"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ transform: `translateY(${offsetY}px)`, willChange: 'transform' }}>
              {visibleData.map((c, idx) => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCustomer(c)} 
                  style={{ height: `${ROW_HEIGHT}px` }} 
                  className={`cursor-pointer border-b border-slate-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-teal-50/80 group`}
                >
                  {activeColumns.map((col) => {
                    const isName = col.key === 'name';
                    const isAccount = col.key === 'accountNumber';
                    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-100';
                    return (
                      <td 
                        key={`${c.id}-${col.key}`}
                        style={{ 
                          left: col.leftValue !== undefined ? col.leftValue : 'auto',
                          zIndex: col.isPinned ? 10 : 'auto'
                        }}
                        className={`px-1.5 py-0 border-r border-slate-100 truncate transition-all ${col.isPinned ? `sticky shadow-[4px_0_10px_rgba(0,0,0,0.05)] ${rowBg}` : ''} ${isName ? 'text-left px-2 font-black' : ''} ${col.color || ''} ${col.bg || ''} group-hover:bg-teal-50`}
                      >
                        {col.key === 'paymentAmount' ? (
                          <input 
                            type="number" 
                            value={c.paymentAmount} 
                            onClick={e => e.stopPropagation()} 
                            onChange={e => onUpdateField(c.id, 'paymentAmount', parseFloat(e.target.value) || 0)} 
                            className="w-full bg-transparent border-none outline-none text-center font-black text-slate-900 text-[9px] focus:bg-yellow-200 rounded py-1 transition-all tabular-nums" 
                          />
                        ) : col.key === 'status' ? (
                          <select
                            value={c.status}
                            dir="rtl"
                            onClick={e => e.stopPropagation()}
                            onChange={e => onUpdateField(c.id, 'status', e.target.value)}
                            className={`w-full h-7 rounded-none px-0.5 text-[8px] font-black border transition-all outline-none appearance-none text-center cursor-pointer ${getStatusColor(c.status)}`}
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
                                 className="w-5 h-5 bg-teal-50 text-teal-600 rounded-none flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-teal-100"
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
                                href={getWhatsAppLink(c, messageTemplate)}
                                onClick={e => e.stopPropagation()}
                                target="_blank"
                                className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                title="إرسال رسالة مخصصة"
                              >
                                <span className="text-[10px]">💬</span>
                              </a>
                            ) : (
                              <span className="text-slate-200 opacity-50">-</span>
                            )}
                          </div>
                        ) : ['amount', 'balances', 'settlementAmount'].includes(col.key) ? (
                          <span className="font-black tabular-nums">{(c[col.key] as number || 0).toLocaleString()}</span>
                        ) : isName ? (
                          <div className="flex items-center justify-between gap-1 w-full truncate">
                            <span className="truncate">{c.name}</span>
                            <CopyButton text={c.name} />
                          </div>
                        ) : isAccount ? (
                          <div className="flex items-center justify-center gap-1 w-full tabular-nums">
                            <span>{c.accountNumber}</span>
                            <CopyButton text={c.accountNumber} />
                          </div>
                        ) : (
                          <span className="truncate">{c[col.key] || '-'}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {visibleData.length === 0 && (
                <tr>
                  <td colSpan={initialColumns.length} className="p-10 text-slate-400 font-bold italic text-center text-xs">لا توجد نتائج مطابقة لبحثك.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

export default CustomerTable;
