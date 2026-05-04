
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Customer, User, TARGET_AMOUNT, CollectionStatus } from '../types.ts';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  currentUser: User | null;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, customers, currentUser }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const resolvedName = (customers.length > 0) 
    ? (customers[0].collectorName.split(' ')[0]) 
    : (currentUser?.collectorName?.split(' ')[0] || 'زميلي');

  const stopConversation = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    activeSourcesRef.current.clear();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
  };

  const startConversation = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextInRef.current) {
        audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!audioContextOutRef.current) {
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // إعداد البيانات المالية والتحصيلية العميقة بناءً على الأوامر الموحدة (v5.7)
      const totalCollected = customers.reduce((s, c) => s + (c.paymentAmount || 0), 0);
      const totalDebt = customers.reduce((s, c) => s + (c.amount || 0), 0);
      const totalBalances = customers.reduce((s, c) => s + (c.balances || 0), 0);

      // تحضير قاعدة بيانات لحظية للبحث الصوتي
      const portfolioMatrixSummary = customers.slice(0, 300).map(c => ({
        n: c.name,
        acc: c.accountNumber,
        id: c.idNumber,
        amt: c.amount,
        bal: c.balances,
        prod: c.product,
        age: c.debtAge,
        case: c.caseNumber,
        salary: c.salaryClient,
        deceased: c.isDeceased
      }));

      const systemInstruction = `
        أنت "ذكي" (Zaki)، المساعد الصوتي الرقمي المعتمد والخبير الاستراتيجي لإدارة محفظة ديون ProDebt.
        بموجب "الأوامر الموحدة"، أنت تمتلك صلاحية التحليل الكامل لبيانات المحفظة (29 عموداً).

        أهدافك الرئيسية في هذه الجلسة:
        1. الإجابة الفورية على "اسأل ذكي عن مبلغ تسوية العميل":
           - عند سماع رقم حساب، رقم هوية، أو اسم عميل، ابحث فوراً في المصفوفة المرفقة.
           - طبق "حاسبة الخصم الذكية" آلياً:
             * BF/CC: عمر الدين 10+ سنوات (70%)، 5-10 سنوات (60%)، 1-2 سنة (20-30%).
             * AL: عمر الدين 10+ سنوات (60%)، 5-10 سنوات (45%).
           - قدّم الرد بصيغة: "مبلغ التسوية للعميل [الاسم] هو [المبلغ] ريال بعد خصم [النسبة]٪."

        2. تحليل أداء المحصلين:
           - عند السؤال عن أي محصل، اعرض مديونية محفظته، إنجازه، والعملاء ذوي المخاطر العالية.
        
        3. توجيه الاستهداف الذكي:
           - ركز دائماً على "المكاسب السريعة" (Quick Wins) من خلال العملاء الذين لديهم "أرصدة متوفرة" (Balances).

        صلاحياتك المعرفية:
        - إجمالي مديونية المحفظة: ${totalDebt.toLocaleString()} ريال.
        - الأرصدة المتوفرة الكلية: ${totalBalances.toLocaleString()} ريال.
        - المحصل الفعلي: ${totalCollected.toLocaleString()} ريال.
        - عدد السجلات: ${customers.length}.

        المصفوفة الحالية (البيانات المرجعية):
        ${JSON.stringify(portfolioMatrixSummary)}

        الأسلوب السلوكي:
        - لهجة سعودية بيضاء، احترافية، وواثقة.
        - أنت "محلل" ولست مجرد قارئ بيانات.
        - ابدأ بـ: "هلا والله ${resolvedName}، أنا ذكي ومعك لإصدار التسويات وتحليل المحفظة. من تبي نبحث عنه اليوم؟"
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }, 
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
            setIsListening(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const outCtx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) setIsSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => {
            console.error('AI Neural Link Error:', e);
            stopConversation();
          },
          onclose: () => {
            setIsConnected(false);
          },
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('AI Activation Failed:', err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    return () => stopConversation();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end bg-slate-950/90 backdrop-blur-3xl transition-all" dir="rtl">
      <div className="w-full max-w-lg h-full bg-slate-900 flex flex-col animate-in slide-in-from-left duration-500 overflow-hidden border-l border-white/10 shadow-2xl">
        {/* Top Header */}
        <div className="p-6 bg-slate-950 text-white flex justify-between items-center shrink-0 border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-none -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-3 h-3 rounded-none ${isConnected ? 'bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,1)] animate-pulse' : 'bg-slate-600'}`}></div>
            <div>
              <h2 className="text-lg font-black tracking-tight">المساعد التحليلي "ذكي" v5.7</h2>
              <p className="text-[9px] text-teal-400 font-black uppercase tracking-widest">Official Portfolio AI Auditor</p>
            </div>
          </div>
          <button 
            onClick={() => { stopConversation(); onClose(); }}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-rose-500 hover:text-white transition-all text-2xl rounded-none border border-white/5 relative z-10"
          >
            &times;
          </button>
        </div>

        {/* AI Interaction Core */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-14 relative">
          <div className="relative">
            {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-80 h-80 border-2 border-teal-500/30 rounded-none animate-[ping_1.5s_infinite]"></div>
                <div className="w-96 h-96 border border-teal-500/10 rounded-none animate-[ping_2.5s_infinite]"></div>
              </div>
            )}
            
            <div className={`relative w-72 h-72 rounded-none flex items-center justify-center transition-all duration-700 bg-slate-950/80 border border-white/10 ${isSpeaking ? 'scale-110 shadow-[0_0_100px_rgba(20,184,166,0.3)]' : 'scale-100 shadow-3xl'}`}>
              <div className="flex items-end gap-3 h-32">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3.5 bg-teal-500 rounded-none transition-all duration-300 ${isSpeaking ? 'animate-[bounce_1s_infinite]' : 'h-14 opacity-20'}`}
                    style={{ 
                      height: isSpeaking ? `${Math.random() * 8 + 2}rem` : '3.5rem',
                      animationDelay: `${i * 0.1}s` 
                    }}
                  ></div>
                ))}
              </div>
              
              {!isConnected && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl rounded-none flex flex-col items-center justify-center z-20">
                   <div className="w-24 h-24 border-2 border-white/5 border-t-teal-500 rounded-none animate-spin mb-8 shadow-inner"></div>
                   <div className="text-white text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Initializing Data Stream...</div>
                </div>
              )}
            </div>

            <div className="absolute -bottom-12 left-0 right-0 flex justify-center z-30">
              {isConnected && (
                <div className={`px-12 py-5 rounded-none text-[10px] font-black uppercase border transition-all shadow-3xl ${isSpeaking ? 'bg-teal-600 text-white border-teal-400 scale-105' : 'bg-slate-800 text-slate-400 border-white/10'}`}>
                  {isSpeaking ? (
                    <div className="flex items-center gap-4">
                      <span className="w-2.5 h-2.5 bg-white rounded-none animate-pulse shadow-[0_0_8px_white]"></span>
                      <span className="tracking-widest">ذكي يقوم بتحليل الحساب الآن...</span>
                    </div>
                  ) : (
                    <span className="uppercase tracking-[0.2em] opacity-80">اسأل ذكي عن أي تسوية أو حساب يا {resolvedName}...</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-center space-y-8 max-w-sm pt-4">
            {isConnected ? (
              <div className="space-y-5 animate-in fade-in duration-1000">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-teal-500/10 rounded-none border border-teal-500/20 text-[10px] font-black text-teal-500 uppercase tracking-[0.2em]">Matrix v5.7 Compliance Active</div>
                <h3 className="text-3xl font-black text-white tracking-tight">بوابة التسويات الذكية</h3>
                <p className="text-[14px] text-slate-400 font-bold leading-relaxed px-6">
                   تم ربط المحفظة بالكامل. يمكنك طلب مبالغ التسوية، الاستعلام عن الهويات، أو طلب تحليل لأداء المحصلين صوتياً.
                </p>
              </div>
            ) : (
              <div className="space-y-6 opacity-30">
                <h3 className="text-3xl font-black text-slate-500 uppercase tracking-tighter">بوابة الذكاء الاصطناعي</h3>
                <p className="text-xs text-slate-600 font-black uppercase tracking-[0.4em]">
                  ProDebt Neural Interface Standby
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Action Button */}
        <div className="p-10 bg-slate-950 border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          {!isConnected ? (
            <button 
              onClick={startConversation}
              className="w-full bg-teal-600 text-white py-14 rounded-none font-black text-sm uppercase hover:bg-teal-500 transition-all flex items-center justify-center gap-10 group shadow-3xl border border-teal-400/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="w-24 h-24 bg-white/10 rounded-none flex items-center justify-center text-5xl group-hover:scale-110 transition-transform shadow-inner border border-white/5">🎤</div>
              <div className="text-right relative z-10">
                <p className="text-2xl leading-none mb-2 font-black">تفعيل الارتباط الصوتي</p>
                <p className="text-[11px] opacity-60 font-black tracking-[0.3em] uppercase">Connect to ProDebt Intelligence</p>
              </div>
            </button>
          ) : (
            <button 
              onClick={stopConversation}
              className="w-full bg-rose-600 text-white py-14 rounded-none font-black text-sm uppercase hover:bg-rose-500 transition-all flex items-center justify-center gap-10 shadow-3xl border border-rose-400/30 group"
            >
              <div className="w-24 h-24 bg-white/10 rounded-none flex items-center justify-center text-5xl shadow-inner border border-white/5 group-hover:scale-95 transition-transform">⏹️</div>
              <div className="text-right">
                <p className="text-2xl leading-none mb-2 font-black">إنهاء جلسة ذكي</p>
                <p className="text-[11px] opacity-60 font-black tracking-[0.3em] uppercase">Disconnect Data Matrix</p>
              </div>
            </button>
          )}
        </div>
        
        <div className="bg-slate-950 py-6 px-10 text-center border-t border-white/5">
           <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.7em]">Official ProDebt Looker Interface v5.7 • SECURED</p>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
