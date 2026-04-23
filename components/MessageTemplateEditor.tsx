
import React, { useState } from 'react';

interface MessageTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  template: string;
  onSave: (newTemplate: string) => void;
}

const MessageTemplateEditor: React.FC<MessageTemplateEditorProps> = ({ isOpen, onClose, template, onSave }) => {
  const [localTemplate, setLocalTemplate] = useState(template);

  if (!isOpen) return null;

  const availableTags = [
    '{customerName}', 
    '{customerFirstName}',
    '{amount}', 
    '{product}', 
    '{collectorName}', 
    '{collectorFirstName}',
    '{settlementAmount}', 
    '{debtAge}', 
    '{freezeDate}'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">تعديل قالب رسالة التحصيل</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نص الرسالة التلقائي:</label>
              <textarea
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all font-sans leading-relaxed text-right"
                dir="rtl"
                value={localTemplate}
                onChange={(e) => setLocalTemplate(e.target.value)}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-right" dir="rtl">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest text-right">الرموز المتاحة:</h4>
              <div className="flex flex-wrap gap-2 justify-end">
                {availableTags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600">{tag}</span>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-2">استخدم الرموز أعلاه ليتم استبدالها ببيانات العميل الحقيقية عند الإرسال.</p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={() => { onSave(localTemplate); onClose(); }}
                className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-600/20"
              >
                حفظ القالب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageTemplateEditor;
