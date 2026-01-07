import React, { useEffect, useState } from 'react';
import { Person, Expense, BillSummary, SettlementStep } from '../types';
import { calculateSummary, calculateSettlements } from '../services/logic';
import { ArrowRight, Share2, Copy, RefreshCw, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { generateShareMessage } from '../services/geminiService';

interface Props {
  people: Person[];
  expenses: Expense[];
  onBack: () => void;
  onReset: () => void;
}

const Step3_Settlement: React.FC<Props> = ({ people, expenses, onBack, onReset }) => {
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [steps, setSteps] = useState<SettlementStep[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'details'>('plan');
  const [shareMsg, setShareMsg] = useState('');
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [settledIndices, setSettledIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    const sum = calculateSummary(people, expenses);
    const settleSteps = calculateSettlements(sum, people);
    setSummary(sum);
    setSteps(settleSteps);
    setSettledIndices(new Set()); 
  }, [people, expenses]);

  const generateAIContext = async () => {
    if (!steps.length) return;
    setIsGeneratingMsg(true);
    const stepsText = steps.map(s => `${s.fromName} 比 ${s.toName} $${s.amount}`).join('\n');
    const msg = await generateShareMessage(stepsText, expenses[0]?.description || '聚會');
    setShareMsg(msg);
    setIsGeneratingMsg(false);
  };

  const copyToClipboard = () => {
    const textToCopy = shareMsg || steps.map(s => `${s.fromName} -> ${s.toName}: $${s.amount}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    alert('已複製!');
  };
  
  const toggleSettled = (idx: number) => {
    const newSet = new Set(settledIndices);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setSettledIndices(newSet);
  };

  if (!summary) return <div>計算中...</div>;

  return (
    <div className="space-y-6">
      {/* Total Card */}
      <div className="text-center bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20 relative overflow-hidden">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse pointer-events-none" />
        <p className="text-slate-400 text-sm font-medium mb-1">總開支</p>
        <div className="text-4xl font-bold tracking-tight">
          ${summary.total.toFixed(2)}
        </div>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs text-slate-300">
           <User size={12} />
           人均約 ${summary.perPerson.toFixed(1)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'plan' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-400 hover:text-gray-600'}`}
        >
          過數方案
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'details' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-400 hover:text-gray-600'}`}
        >
          詳細收支
        </button>
      </div>

      <div className="min-h-[200px] animate-fade-in">
        {activeTab === 'plan' ? (
          <div className="space-y-3">
            {steps.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                <CheckCircle2 size={48} className="mx-auto mb-3 text-green-400" />
                <p>完美！無人需要夾錢。</p>
              </div>
            ) : (
              steps.map((step, idx) => {
                const isSettled = settledIndices.has(idx);
                return (
                <div 
                  key={idx} 
                  onClick={() => toggleSettled(idx)}
                  className={`
                    relative flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden
                    ${isSettled 
                        ? 'bg-gray-50 border-gray-100 opacity-60 grayscale' 
                        : 'bg-white border-gray-100 shadow-lg shadow-indigo-500/5 hover:border-indigo-100 hover:shadow-indigo-500/10'}
                  `}
                >
                  {isSettled && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="border-4 border-green-500 text-green-500 font-black text-2xl uppercase opacity-20 rotate-[-15deg] px-4 py-2 rounded-lg">PAID</span></div>}
                  
                  <div className="flex items-center gap-4 flex-1 z-10">
                    <div className="flex flex-col items-center">
                        <div className="font-bold text-slate-700 text-lg">{step.fromName}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">GIVES</div>
                    </div>
                    
                    <div className="flex-1 flex justify-center">
                        <ArrowRight className="text-indigo-200" size={24} />
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="font-bold text-slate-700 text-lg">{step.toName}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">RECEIVES</div>
                    </div>
                  </div>

                  <div className="pl-6 border-l border-dashed border-gray-200 ml-4 z-10 min-w-[80px] text-right">
                    <span className="block font-black text-xl text-indigo-600">
                      ${step.amount.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-400">HKD</span>
                  </div>
                </div>
              )})
            )}
            {steps.length > 0 && <p className="text-center text-xs text-gray-300 mt-2">點擊卡片標記為已付款</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {summary.breakdown.map((b) => {
               const person = people.find(p => p.id === b.personId);
               const partner = person?.isCoupleWith ? people.find(p => p.id === person.isCoupleWith) : null;
               
               return (
                 <div key={b.personId} className="bg-white p-4 rounded-2xl border border-gray-100 text-sm flex justify-between items-center shadow-sm">
                   <div className="flex flex-col">
                     <span className="font-bold text-slate-700 text-base flex items-center gap-1">
                        {person?.name} {person?.isBirthday && '🎂'}
                        {partner && <span className="px-1.5 py-0.5 bg-pink-100 text-pink-600 text-[10px] rounded-full">Couple</span>}
                     </span>
                     <span className="text-xs text-gray-400 mt-0.5">已付: ${b.paid.toFixed(1)}</span>
                   </div>
                   <div className="text-right">
                     <div className={`font-bold text-lg ${b.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                       {b.balance >= 0 ? '+' : ''}{b.balance.toFixed(2)}
                     </div>
                     <div className="text-xs text-gray-400">應付: ${b.share.toFixed(1)}</div>
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>

      {/* Share Section */}
      {steps.length > 0 && (
           <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1 rounded-2xl shadow-lg mt-8">
             <div className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Share2 size={16} className="text-indigo-500" /> WhatsApp 訊息
                    </h4>
                    {!shareMsg && (
                    <button 
                        onClick={generateAIContext}
                        disabled={isGeneratingMsg}
                        className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-bold hover:bg-slate-200 transition-colors"
                    >
                        {isGeneratingMsg ? '撰寫中...' : 'AI 生成'}
                    </button>
                    )}
                </div>
                
                {shareMsg ? (
                <div className="relative group">
                    <textarea 
                        value={shareMsg} 
                        readOnly 
                        className="w-full text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 h-24 focus:outline-none resize-none text-slate-600"
                    />
                    <button 
                    onClick={copyToClipboard}
                    className="absolute bottom-3 right-3 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 shadow-lg flex items-center gap-1"
                    >
                    <Copy size={12} /> 複製
                    </button>
                </div>
                ) : (
                <p className="text-xs text-gray-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                    點擊按鈕，AI 會幫你寫一段禮貌的訊息傳給朋友。
                </p>
                )}
             </div>
           </div>
      )}

      <div className="flex gap-3 pt-4 pb-20">
          <button onClick={onBack} className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-2xl transition-all">
            返回
          </button>
          <button onClick={onReset} className="flex-1 py-3.5 border border-red-100 text-red-400 font-bold hover:bg-red-50 hover:text-red-500 rounded-2xl transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={18} /> 重置
          </button>
      </div>
    </div>
  );
};

export default Step3_Settlement;