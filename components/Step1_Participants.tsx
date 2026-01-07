import React, { useState } from 'react';
import { Person } from '../types';
// Fixed: Added 'Users' to imports
import { Trash2, Plus, Heart, Cake, Link2, X, Users } from 'lucide-react';

interface Props {
  people: Person[];
  setPeople: (p: Person[]) => void;
  onNext: () => void;
}

const Step1_Participants: React.FC<Props> = ({ people, setPeople, onNext }) => {
  const [newName, setNewName] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const addPerson = () => {
    if (!newName.trim()) return;
    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      isBirthday: false
    };
    setPeople([...people, newPerson]);
    setNewName('');
  };

  const removePerson = (id: string) => {
    const person = people.find(p => p.id === id);
    if (person?.isCoupleWith) {
       setPeople(people.filter(p => p.id !== id).map(p => 
         p.id === person.isCoupleWith ? { ...p, isCoupleWith: undefined } : p
       ));
    } else {
       setPeople(people.filter(p => p.id !== id));
    }
  };

  const toggleBirthday = (id: string) => {
    setPeople(people.map(p => p.id === id ? { ...p, isBirthday: !p.isBirthday } : p));
  };

  const handleLink = (targetId: string) => {
     if (!linkingId) return;
     setPeople(people.map(p => {
       if (p.id === linkingId) return { ...p, isCoupleWith: targetId };
       if (p.id === targetId) return { ...p, isCoupleWith: linkingId };
       return p;
     }));
     setLinkingId(null);
  };

  const handleUnlink = (id: string) => {
     const person = people.find(p => p.id === id);
     if (!person || !person.isCoupleWith) return;
     const partnerId = person.isCoupleWith;
     
     setPeople(people.map(p => {
       if (p.id === id || p.id === partnerId) return { ...p, isCoupleWith: undefined };
       return p;
     }));
  };

  // Sort people to keep couples together visually
  const sortedPeople = [...people].sort((a, b) => {
    // If a is coupled with b, they should be adjacent.
    // This is a simple heuristic sorting
    if (a.isCoupleWith === b.id) return -1;
    if (b.isCoupleWith === a.id) return 1;
    return 0;
  });
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-800">誰有份食飯?</h2>
        <p className="text-slate-500 text-sm">輸入名字。點擊 <Heart className="inline w-3 h-3 text-pink-500"/> 設定情侶 (Couple) 計算。</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          placeholder="輸入名字 (e.g. Alex)"
          className="w-full pl-5 pr-14 py-4 rounded-2xl bg-white border-0 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg transition-all"
        />
        <button 
          onClick={addPerson}
          disabled={!newName.trim()}
          className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white aspect-square rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {people.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl">
             <div className="inline-block p-4 bg-gray-50 rounded-full mb-3">
                <Users size={32} className="text-gray-300" />
             </div>
            <p className="text-gray-400 font-medium">還沒有人，請在上方新增！</p>
          </div>
        )}

        {sortedPeople.map(person => {
           const isLinking = linkingId === person.id;
           const isTargetable = linkingId !== null && !isLinking && !person.isCoupleWith;
           const partner = person.isCoupleWith ? people.find(p => p.id === person.isCoupleWith) : null;
           // Determine if this is the "second" part of a couple visually to style differently or group? 
           // For simplicity, we just style them individually but show the link.

           return (
          <div 
            key={person.id} 
            className={`
                group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300
                ${isLinking ? 'bg-indigo-50 ring-2 ring-indigo-500 scale-[1.02] shadow-lg z-10' : 'bg-white shadow-sm hover:shadow-md'}
                ${partner ? 'border-l-4 border-pink-400 bg-pink-50/30' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm relative transition-transform
                ${person.isBirthday ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white' : 'bg-white text-slate-700 ring-1 ring-gray-100'}
              `}>
                {person.name.charAt(0).toUpperCase()}
                {person.isCoupleWith && (
                   <div className="absolute -bottom-1.5 -right-1.5 bg-white text-pink-500 rounded-full p-1 shadow-sm ring-1 ring-gray-100">
                     <Heart size={10} fill="currentColor" />
                   </div>
                )}
                {person.isBirthday && (
                    <div className="absolute -top-1.5 -right-1.5 bg-white text-amber-500 rounded-full p-1 shadow-sm">
                        <Cake size={10} />
                    </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 text-lg leading-tight">{person.name}</span>
                {partner ? (
                    <span className="text-xs text-pink-500 font-medium flex items-center gap-1">
                        與 {partner.name} 一對 (2份錢)
                    </span>
                ) : (
                    <span className="text-xs text-gray-400">1 人份</span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              {linkingId !== null ? (
                 // Linking Mode
                 isLinking ? (
                    <button onClick={() => setLinkingId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium">取消</button>
                 ) : isTargetable ? (
                    <button onClick={() => handleLink(person.id)} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/30 animate-pulse">
                      選擇
                    </button>
                 ) : (
                    <span className="text-gray-300 px-2 opacity-20">不可選</span>
                 )
              ) : (
                 // Normal Mode
                 <>
                  <button
                    onClick={() => person.isCoupleWith ? handleUnlink(person.id) : setLinkingId(person.id)}
                    className={`p-2.5 rounded-xl transition-colors ${
                        person.isCoupleWith 
                        ? 'bg-pink-100 text-pink-500' 
                        : 'text-gray-300 hover:bg-pink-50 hover:text-pink-500'
                    }`}
                  >
                    <Heart size={20} fill={person.isCoupleWith ? "currentColor" : "none"} />
                  </button>

                  <button
                    onClick={() => toggleBirthday(person.id)}
                    className={`p-2.5 rounded-xl transition-colors ${
                        person.isBirthday 
                        ? 'bg-amber-100 text-amber-600' 
                        : 'text-gray-300 hover:bg-amber-50 hover:text-amber-500'
                    }`}
                  >
                    <Cake size={20} />
                  </button>
                  
                  <button 
                    onClick={() => removePerson(person.id)}
                    className="p-2.5 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                 </>
              )}
            </div>
          </div>
        )})}
      </div>
      
      {linkingId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-slide-up flex items-center gap-3">
            <span className="text-sm">選擇另一半...</span>
            <button onClick={() => setLinkingId(null)} className="bg-white/20 rounded-full p-1"><X size={14}/></button>
        </div>
      )}

      <div className="pt-4 pb-8">
        {!linkingId && (
            <button
            onClick={onNext}
            disabled={people.length < 2}
            className={`w-full py-4 rounded-2xl text-lg font-bold transition-all shadow-xl transform active:scale-95 ${
                people.length < 2 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700'
            }`}
            >
            下一步：輸入開支
            </button>
        )}
      </div>
    </div>
  );
};

export default Step1_Participants;