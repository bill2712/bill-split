import React, { useState } from 'react';
import { Expense, Person } from '../types';
import { Plus, Sparkles, Trash2, Check, X } from 'lucide-react';
import { parseExpensesWithAI } from '../services/geminiService';

interface Props {
  people: Person[];
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2_Expenses: React.FC<Props> = ({ people, expenses, setExpenses, onNext, onBack }) => {
  // Manual Entry State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(people[0]?.id || '');
  
  // AI Modal State
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
      excludedIds: [] // Default everyone involved
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
    
    // Convert partials to full expenses
    const newExpenses = parsed.map(p => ({
      id: crypto.randomUUID(),
      description: p.description || 'Unknown Item',
      amount: p.amount || 0,
      payerId: p.payerId || people[0].id, // Default to first person if AI fails to match
      excludedIds: []
    }));

    setExpenses([...expenses, ...newExpenses]);
    setIsProcessing(false);
    setShowAI(false);
    setAiInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">開支明細</h2>
          <p className="text-gray-500 text-sm">Who paid for what?</p>
        </div>
        <button 
          onClick={() => setShowAI(true)}
          className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-full shadow hover:shadow-md transition-all"
        >
          <Sparkles size={16} />
          AI Import
        </button>
      </div>

      {/* Manual Input Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Item (e.g. Dinner at ABC)"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$ Amount"
            className="w-1/3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <select 
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {people.map(p => (
              <option key={p.id} value={p.id}>{p.name} paid</option>
            ))}
          </select>
        </div>
        <button 
          onClick={addExpense}
          className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Expense List */}
      <div className="space-y-3 max-h-[40vh] overflow-y-auto">
        {expenses.map(exp => {
          const payer = people.find(p => p.id === exp.payerId);
          return (
            <div key={exp.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{exp.description}</div>
                <div className="text-xs text-gray-500">
                  Paid by <span className="font-bold text-gray-700">{payer?.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-gray-800">${exp.amount.toFixed(2)}</span>
                <button onClick={() => removeExpense(exp.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <button onClick={onBack} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
          Back
        </button>
        <button 
          onClick={onNext}
          disabled={expenses.length === 0}
          className={`flex-1 py-3 text-white font-bold rounded-xl shadow-md transition-all ${
            expenses.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-green-600'
          }`}
        >
          Calculate
        </button>
      </div>

      {/* AI Modal */}
      {showAI && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-popIn">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-500" />
              Paste from Chat
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Paste a message like "John paid 500 for dinner, Mary paid 30 for taxi".
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="w-full h-32 p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none mb-4 text-sm"
              placeholder="Paste here..."
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAI(false)}
                className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleAISubmit}
                disabled={isProcessing}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex justify-center items-center"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Parse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2_Expenses;