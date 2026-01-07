import React, { useState } from 'react';
import Step1_Participants from './components/Step1_Participants';
import Step2_Expenses from './components/Step2_Expenses';
import Step3_Settlement from './components/Step3_Settlement';
import { Person, Expense } from './types';
import { Receipt, Users, Calculator, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const handleReset = () => {
    if (window.confirm("清除所有資料重新開始?")) {
      setPeople([]);
      setExpenses([]);
      setStep(1);
    }
  };

  const steps = [
    { num: 1, title: '成員', icon: Users },
    { num: 2, title: '開支', icon: Receipt },
    { num: 3, title: '結算', icon: Calculator },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background Blob */}
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[40%] bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[30%] bg-pink-200/50 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md pt-safe-top pb-2 px-6 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primaryDark rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Receipt size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SmartSplit</h1>
              <span className="text-xs text-slate-500 font-medium">HK Edition</span>
            </div>
          </div>
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mt-4 mb-2 relative px-2">
          {/* Progress Bar Background */}
          <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full" />
          {/* Active Progress Bar */}
          <div 
            className="absolute left-0 top-1/2 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />

          {steps.map((s) => {
            const isActive = step >= s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-1">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2 ${
                    isActive 
                      ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  {isActive ? <s.icon size={14} /> : s.num}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 ${isCurrent ? 'text-indigo-600' : 'text-gray-300'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-6 pb-24">
        <div className="animate-fade-in">
          {step === 1 && (
            <Step1_Participants 
              people={people} 
              setPeople={setPeople} 
              onNext={() => setStep(2)} 
            />
          )}
          {step === 2 && (
            <Step2_Expenses 
              people={people} 
              expenses={expenses} 
              setExpenses={setExpenses}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3_Settlement 
              people={people} 
              expenses={expenses}
              onBack={() => setStep(2)}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;