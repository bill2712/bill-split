import React, { useState } from 'react';
import Step1_Participants from './components/Step1_Participants';
import Step2_Expenses from './components/Step2_Expenses';
import Step3_Settlement from './components/Step3_Settlement';
import { Person, Expense } from './types';
import { Receipt } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to start over? All data will be lost.")) {
      setPeople([]);
      setExpenses([]);
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[2rem] shadow-lg z-10 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Receipt size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">SmartSplit HK</h1>
            </div>
            <div className="text-xs font-mono text-emerald-400 bg-emerald-900/50 px-2 py-1 rounded">
              Step {step}/3
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 -mt-4 relative z-0">
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