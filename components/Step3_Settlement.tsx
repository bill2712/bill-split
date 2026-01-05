import React, { useEffect, useState } from 'react';
import { Person, Expense, BillSummary, SettlementStep } from '../types';
import { calculateSummary, calculateSettlements } from '../services/logic';
import { ArrowRight, Share2, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
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
    setSettledIndices(new Set()); // Reset checks on recalculation
  }, [people, expenses]);

  const generateAIContext = async () => {
    if (!steps.length) return;
    setIsGeneratingMsg(true);
    
    const stepsText = steps.map(s => `${s.fromName} pays ${s.toName} $${s.amount}`).join('\n');
    const msg = await generateShareMessage(stepsText, expenses[0]?.description || 'Event');
    
    setShareMsg(msg);
    setIsGeneratingMsg(false);
  };

  const copyToClipboard = () => {
    const textToCopy = shareMsg || steps.map(s => `${s.fromName} -> ${s.toName}: $${s.amount}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    alert('Copied to clipboard!');
  };
  
  const toggleSettled = (idx: number) => {
    const newSet = new Set(settledIndices);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setSettledIndices(newSet);
  };

  if (!summary) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">結算 Settlement</h2>
        <div className="text-3xl font-mono font-bold text-primary mt-2">
          ${summary.total.toFixed(2)}
        </div>
        <p className="text-sm text-gray-400">Total Spent</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'plan' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Payment Plan
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'details' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Full Breakdown
        </button>
      </div>

      <div className="min-h-[200px]">
        {activeTab === 'plan' ? (
          <div className="space-y-3">
            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                All settled! No one owes anything.
              </div>
            ) : (
              steps.map((step, idx) => {
                const isSettled = settledIndices.has(idx);
                return (
                <div 
                  key={idx} 
                  onClick={() => toggleSettled(idx)}
                  className={`flex items-center justify-between p-4 rounded-xl shadow-sm border cursor-pointer transition-all ${isSettled ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:shadow-md'}`}
                >
                  <div className={`flex items-center gap-3 flex-1 ${isSettled ? 'line-through text-gray-400' : ''}`}>
                    <CheckCircle2 size={20} className={isSettled ? 'text-green-400' : 'text-gray-200'} />
                    <div className="flex items-center flex-wrap gap-2 text-sm sm:text-base">
                      <span className="font-bold text-gray-700">{step.fromName}</span>
                      <ArrowRight className="text-gray-300" size={16} />
                      <span className="font-bold text-gray-700">{step.toName}</span>
                    </div>
                  </div>
                  <div className="pl-4">
                    <span className={`px-3 py-1 rounded-full font-bold text-sm ${isSettled ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                      ${step.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )})
            )}
            {steps.length > 0 && <p className="text-center text-xs text-gray-400 mt-2">Tap a row to mark as paid</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {summary.breakdown.map((b) => {
               const person = people.find(p => p.id === b.personId);
               const partner = person?.isCoupleWith ? people.find(p => p.id === person.isCoupleWith) : null;
               
               return (
                 <div key={b.personId} className="bg-white p-3 rounded-xl border border-gray-100 text-sm flex justify-between">
                   <div className="flex flex-col">
                     <span className="font-bold text-gray-700 flex items-center gap-1">
                        {person?.name} {person?.isBirthday && '🎂'}
                        {partner && <span className="text-xs font-normal text-pink-500 ml-1">(w/ {partner.name})</span>}
                     </span>
                     <span className="text-xs text-gray-400">Paid: ${b.paid.toFixed(1)}</span>
                   </div>
                   <div className="text-right">
                     <div className={`font-bold ${b.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                       {b.balance >= 0 ? '+' : ''}{b.balance.toFixed(2)}
                     </div>
                     <div className="text-xs text-gray-400">Share: ${b.share.toFixed(1)}</div>
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 space-y-3">
         {/* AI Share Message Generator */}
         {steps.length > 0 && (
           <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
             <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                  <Share2 size={16} /> Share with Friends
                </h4>
                {!shareMsg && (
                  <button 
                    onClick={generateAIContext}
                    disabled={isGeneratingMsg}
                    className="text-xs bg-white text-indigo-600 px-2 py-1 rounded shadow-sm hover:bg-indigo-50"
                  >
                    {isGeneratingMsg ? 'Writing...' : 'Generate Text'}
                  </button>
                )}
             </div>
             
             {shareMsg ? (
               <div className="relative">
                 <textarea 
                    value={shareMsg} 
                    readOnly 
                    className="w-full text-xs bg-white/60 p-2 rounded border border-indigo-100 h-24 focus:outline-none"
                 />
                 <button 
                  onClick={copyToClipboard}
                  className="absolute bottom-2 right-2 bg-indigo-600 text-white p-1.5 rounded-md hover:bg-indigo-700"
                 >
                   <Copy size={14} />
                 </button>
               </div>
             ) : (
               <p className="text-xs text-gray-500 italic">
                 Click generate to get a polite message to copy-paste to WhatsApp.
               </p>
             )}
           </div>
         )}

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
            Back
          </button>
          <button onClick={onReset} className="flex-1 py-3 border border-red-200 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={18} /> New Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3_Settlement;