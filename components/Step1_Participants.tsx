import React, { useState } from 'react';
import { Person } from '../types';
import { Trash2, UserPlus, Heart, Cake, X } from 'lucide-react';

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
    // If coupled, unlink partner automatically
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
     // Link linkingId and targetId
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
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">誰有份食飯?</h2>
        <p className="text-gray-500 text-sm">Add everyone. Tap <Heart className="inline w-4 h-4 text-pink-400"/> to link couples!</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          placeholder="Enter name (e.g. Alex)"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
        <button 
          onClick={addPerson}
          className="bg-primary text-white p-3 rounded-xl hover:bg-green-600 transition-colors shadow-sm"
        >
          <UserPlus size={24} />
        </button>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {people.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No participants yet. Add someone above!
          </div>
        )}
        {people.map(person => {
           const isLinking = linkingId === person.id;
           // Can link to anyone who is not self, and not already coupled
           const isTargetable = linkingId !== null && !isLinking && !person.isCoupleWith;
           const partner = person.isCoupleWith ? people.find(p => p.id === person.isCoupleWith) : null;

           return (
          <div key={person.id} className={`flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border transition-all ${isLinking ? 'border-pink-400 ring-1 ring-pink-400' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold relative ${person.isBirthday ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600'}`}>
                {person.name.charAt(0).toUpperCase()}
                {person.isCoupleWith && (
                   <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white rounded-full p-0.5 border-2 border-white">
                     <Heart size={10} fill="currentColor" />
                   </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-lg text-gray-700 leading-tight">{person.name}</span>
                {partner && <span className="text-xs text-pink-500 flex items-center gap-1"><Heart size={10} /> {partner.name}</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {linkingId !== null ? (
                 // Linking Mode Actions
                 isLinking ? (
                    <button onClick={() => setLinkingId(null)} className="p-2 text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                 ) : isTargetable ? (
                    <button onClick={() => handleLink(person.id)} className="px-3 py-1.5 bg-pink-500 text-white text-sm font-bold rounded-lg hover:bg-pink-600 animate-pulse">
                      Select
                    </button>
                 ) : (
                    <span className="text-gray-300 px-2">-</span>
                 )
              ) : (
                 // Normal Actions
                 <>
                  <button
                    onClick={() => person.isCoupleWith ? handleUnlink(person.id) : setLinkingId(person.id)}
                    className={`p-2 rounded-full transition-colors ${person.isCoupleWith ? 'text-pink-500 bg-pink-50' : 'text-gray-300 hover:text-pink-400'}`}
                    title={person.isCoupleWith ? "Unlink Couple" : "Link as Couple"}
                  >
                    <Heart size={20} fill={person.isCoupleWith ? "currentColor" : "none"} />
                  </button>

                  <button
                    onClick={() => toggleBirthday(person.id)}
                    className={`p-2 rounded-full transition-colors ${person.isBirthday ? 'text-accent bg-amber-50' : 'text-gray-300 hover:text-accent'}`}
                    title="Birthday Treat?"
                  >
                    <Cake size={20} />
                  </button>
                  
                  <button 
                    onClick={() => removePerson(person.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                 </>
              )}
            </div>
          </div>
        )})}
      </div>

      <div className="pt-4">
        {linkingId ? (
             <div className="text-center text-sm text-pink-500 font-medium animate-pulse">
               Select partner for {people.find(p => p.id === linkingId)?.name}...
             </div>
        ) : (
            <button
            onClick={onNext}
            disabled={people.length < 2}
            className={`w-full py-4 rounded-xl text-lg font-bold transition-all shadow-md ${
                people.length < 2 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-green-600 hover:shadow-lg'
            }`}
            >
            Next: Add Expenses
            </button>
        )}
      </div>
    </div>
  );
};

export default Step1_Participants;