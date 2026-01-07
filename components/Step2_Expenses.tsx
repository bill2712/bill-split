import React, { useState } from 'react';
import { Expense, Person } from '../types';
import { Plus, Sparkles, Trash2, Receipt, DollarSign } from 'lucide-react';
import { parseExpensesWithAI } from '../services/geminiService';

interface Props {
  people: Person[];
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2_Expenses: React.FC<Props> = ({ people, expenses, setExpenses, onNext, onBack }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(people[0]?.id || '');
  
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const addExpense = () => {
    if (!desc || !amount || !payerId) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: desc,
      amount: parseFloat(amount),
      payerId: payerId,
      excludedIds: [] 
    };
    setExpenses([...expenses, newExpense]);
    setDesc('');
    setAmount('');
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleAISubmit = async () => {
    if (!aiInput.trim()) return;
    setIsProcessing(true);
    const parsed = await parseExpensesWithAI(aiInput, people);
    
    const newExpenses = parsed.map(p => ({
      id: crypto.randomUUID(),
      description: p.description || '未知項目',
      amount: p.amount || 0,
      payerId: p.payerId || people[0].id,
      excludedIds: []
    }));

    setExpenses([...expenses, ...newExpenses]);
    setIsProcessing(false);
    setShowAI(false);
    setAiInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">開支明細</h2>
          <p className="text-slate-500 text-sm">邊個比左錢?</p>
        </div>
        <button 
          onClick={() => setShowAI(true)}
          className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-4 py-2 rounded-full shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
        >
          <Sparkles size={14} />
          AI 讀取
        </button>
      </div>

      {/* Input Card */}
      <div className="bg-white p-5 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-pink-500" />
        
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">項目名稱</label>
                <input
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="e.g. 晚餐, 的士"
                    className="w-full text-lg font-medium border-b-2 border-gray-100 py-2 focus:border-indigo-500 focus:outline-none bg-transparent placeholder-gray-300 transition-colors"
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">金額 ($)</label>
                    <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-2xl font-bold border-b-2 border-gray-100 py-2 pl-5 focus:border-indigo-500 focus:outline-none bg-transparent placeholder-gray-300 transition-colors text-slate-800"
                        />
                    </div>
                </div>
            </div>

            <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">邊個比錢?</label>
                 <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {people.map(p => {
                        const isSelected = payerId === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setPayerId(p.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap
                                    ${isSelected 
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}
                                `}
                            >
                                <span className="text-sm font-bold">{p.name}</span>
                                {isSelected && <DollarSign size={12} />}
                            </button>
                        )
                    })}
                 </div>
            </div>

            <button 
            onClick={addExpense}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl hover:bg-indigo-700 flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
            <Plus size={20} /> 新增項目
            </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 pb-8">
        {expenses.length === 0 && (
            <div className="text-center py-8 opacity-50">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">暫時沒有項目</p>
            </div>
        )}
        {expenses.map(exp => {
          const payer = people.find(p => p.id === exp.payerId);
          return (
            <div key={exp.id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <Receipt size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-800">{exp.description}</div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-indigo-600">{payer?.name}</span> 先付
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg text-slate-800">${exp.amount.toFixed(2)}</span>
                <button onClick={() => removeExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 z-20 flex justify-center">
         <div className="w-full max-w-md flex gap-3">
             <button onClick={onBack} className="px-6 py-4 text-slate-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors">
                返回
             </button>
            <button 
                onClick={onNext}
                disabled={expenses.length === 0}
                className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-xl transition-all ${
                    expenses.length === 0 ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                }`}
            >
                計算結果
            </button>
         </div>
      </div>

      {/* AI Modal */}
      {showAI && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800">
              <Sparkles className="text-purple-500" />
              智能讀取
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              貼上對話記錄，例如：<br/>
              "John 晚餐比左 500, Mary 的士 30"
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none mb-4 text-sm bg-gray-50"
              placeholder="貼上文字..."
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAI(false)}
                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl"
              >
                取消
              </button>
              <button 
                onClick={handleAISubmit}
                disabled={isProcessing}
                className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 flex justify-center items-center shadow-lg shadow-purple-500/20"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : '分析'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2_Expenses;