import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, RotateCcw, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDistribution } from './utils/electionEngine';
import { getSeatsFromPopulation } from './utils/populationMapping';
import { CandidateList, ElectionRound, CityType } from './types';

export default function App() {
  const [totalSeats, setTotalSeats] = useState<number>(19);
  const [population, setPopulation] = useState<number | undefined>(1800);
  const [round, setRound] = useState<ElectionRound>(1);
  const [cityType, setCityType] = useState<CityType>('STANDARD');
  const [manualTotalVotes, setManualTotalVotes] = useState<number | undefined>(1883);
  const [lists, setLists] = useState<CandidateList[]>([
    { id: '1', name: 'Liste A', votes: 979 },
    { id: '2', name: 'Liste B', votes: 814 },
    { id: '3', name: 'Liste C', votes: 90 },
  ]);

  // Sync Population -> Sièges [cite: 61]
  useEffect(() => {
    if (population) setTotalSeats(getSeatsFromPopulation(population));
  }, [population]);

  const sumOfVotes = useMemo(() => lists.reduce((s, l) => s + l.votes, 0), [lists]);
  const result = useMemo(() => calculateDistribution(totalSeats, lists, manualTotalVotes, round, cityType), [totalSeats, lists, manualTotalVotes, round, cityType]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <header className="mb-10 border-b pb-6">
        <h1 className="text-3xl font-serif font-bold italic">Répartition des Sièges</h1>
        <p className="text-sm text-slate-500 uppercase tracking-widest">Communes de 1 000 habitants et plus [cite: 35]</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-8">
          {/* Saisie Population */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <label className="block text-sm font-bold mb-2">Population de la commune</label>
            <input type="number" value={population} onChange={e => setPopulation(Number(e.target.value))} className="w-full p-3 border rounded-lg text-xl font-bold" />
            <div className="mt-4 p-3 bg-slate-100 rounded text-sm font-medium">Sièges à pourvoir : {totalSeats} [cite: 61]</div>
          </div>

          {/* Type de Scrutin */}
          <div className="flex gap-4">
            <button onClick={() => setCityType('STANDARD')} className={`flex-1 p-3 rounded-lg border font-bold ${cityType === 'STANDARD' ? 'bg-slate-900 text-white' : 'bg-white'}`}>Standard</button>
            <button onClick={() => setCityType('PLM')} className={`flex-1 p-3 rounded-lg border font-bold ${cityType === 'PLM' ? 'bg-slate-900 text-white' : 'bg-white'}`}>Paris, Lyon, Marseille</button>
          </div>

          {/* Saisie des voix */}
          <div className="space-y-3">
             <h2 className="font-bold flex justify-between">Listes candidates <button onClick={() => setLists([...lists, {id: crypto.randomUUID(), name: `Liste ${lists.length+1}`, votes: 0}])} className="text-xs bg-slate-200 px-2 py-1 rounded">+ Ajouter</button></h2>
             {lists.map(l => (
               <div key={l.id} className="flex gap-2 items-center">
                 <input value={l.name} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, name: e.target.value} : item))} className="flex-grow p-2 border rounded" />
                 <input type="number" value={l.votes} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, votes: Number(e.target.value)} : item))} className="w-24 p-2 border rounded text-right" />
                 <button onClick={() => setLists(lists.filter(item => item.id !== l.id))} className="text-red-400 p-2">×</button>
               </div>
             ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">🎯 Résultats</h2>
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl min-h-[300px]">
            {result.noMajorityInFirstRound ? (
              <div className="text-amber-400 p-4 border border-amber-900 rounded bg-amber-950/30">
                <AlertTriangle className="mb-2" />
                Pas de majorité absolue au 1er tour. [cite: 8]
              </div>
            ) : (
              <div className="space-y-4">
                {result.admittedLists.filter(l => l.isAdmitted).sort((a,b) => b.totalSeats - a.totalSeats).map((l, i) => (
                  <div key={l.id} className={`p-4 rounded-lg flex justify-between items-center ${i === 0 ? 'bg-emerald-900/50 border border-emerald-500' : 'bg-slate-800'}`}>
                    <div>
                      <span className="font-bold">{l.name}</span>
                      {i === 0 && <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Majorité [cite: 6, 44]</span>}
                    </div>
                    <span className="text-3xl font-black">{l.totalSeats}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
