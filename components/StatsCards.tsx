
import React from 'react';
import { Customer, CollectionStatus } from '../types';

interface StatsCardsProps {
  customers: Customer[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ customers }) => {
  const totalDebt = customers.reduce((acc, c) => acc + c.amount, 0);
  const totalCollected = customers.reduce((acc, c) => c.status === CollectionStatus.SETTLED ? acc + (c.paymentAmount || 0) : acc, 0);
  const target = totalDebt * 0.12;
  const progress = (totalCollected / target) * 100;

  const format = (v: number) => v >= 1000000 ? (v/1000000).toFixed(2) + 'M' : (v/1000).toFixed(1) + 'K';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">إجمالي المحفظة</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold text-slate-900">{format(totalDebt)}</p>
          <span className="text-[10px] font-bold text-slate-400">ر.س</span>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">المحصل الفعلي</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold text-emerald-600">{format(totalCollected)}</p>
          <span className="text-[10px] font-bold text-slate-400">ر.س</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">نسبة الإنجاز</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-blue-600">{progress.toFixed(1)}%</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-1000" style={{width: `${Math.min(progress, 100)}%`}} />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">إجمالي السجلات</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-900">{customers.length.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
