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

  // Synchronisation Population -> Sièges selon le barème légal 
  useEffect(() => {
    if (population) setTotalSeats(getSeatsFromPopulation(population));
  }, [population]);

  const sumOfVotes = useMemo(() => lists.reduce((s, l) => s + l.votes, 0), [lists]);
  
  // Vérification de cohérence : les voix ne peuvent pas dépasser la population
  const populationExceeded = population !== undefined && sumOfVotes > population;

  const result = useMemo(() => {
    return calculateDistribution(totalSeats, lists, manualTotalVotes, round, cityType);
  }, [totalSeats, lists, manualTotalVotes, round, cityType]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <header className="mb-10 border-b pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold italic tracking-tighter">Lex Publica</h1>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Répartition des sièges municipaux</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* CONFIGURATION */}
        <section className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-slate-400"/> Paramètres</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Population de la commune</label>
                <input 
                  type="number" 
                  value={population} 
                  onChange={e => setPopulation(Number(e.target.value))} 
                  className={`w-full p-3 border rounded-xl text-xl font-black ${populationExceeded ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:ring-2 focus:ring-slate-900'}`} 
                />
                <p className="mt-2 text-sm font-medium text-slate-600 italic">
                  Conseil municipal : <span className="text-slate-900 font-bold">{totalSeats} sièges</span> 
                </p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setCityType('STANDARD')} className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${cityType === 'STANDARD' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Standard</button>
                <button onClick={() => setCityType('PLM')} className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${cityType === 'PLM' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Paris / Lyon / Marseille</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><Scale className="w-5 h-5 text-slate-400"/> Voix par liste</h2>
              <button onClick={() => setLists([...lists, {id: crypto.randomUUID(), name: `Liste ${String.fromCharCode(65 + lists.length)}`, votes: 0}])} className="text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {lists.map((l, index) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={l.id} className="flex gap-3 items-center bg-white p-2 rounded-xl border border-slate-200 group">
                    <div className={`w-1 h-10 rounded-full ${['bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-amber-500'][index % 4]}`} />
                    <input value={l.name} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, name: e.target.value} : item))} className="flex-grow p-2 text-sm font-medium focus:outline-none" />
                    <input type="number" value={l.votes} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, votes: Number(e.target.value)} : item))} className="w-24 p-2 text-right font-mono font-bold text-slate-700 bg-slate-50 rounded-lg" />
                    <button onClick={() => setLists(lists.filter(item => item.id !== l.id))} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* RÉSULTATS */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-950">🎯 Résultats de la répartition</h2>
          <div className="bg-slate-950 text-white p-8 rounded-[2rem] shadow-2xl min-h-[400px] flex flex-col border border-slate-800">
            
            {populationExceeded ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-red-500/20 p-4 rounded-full"><AlertCircle className="w-12 h-12 text-red-500 animate-pulse" /></div>
                <div>
                  <p className="text-xl font-black text-red-400">Incohérence majeure</p>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto italic">Le nombre de suffrages exprimés ({sumOfVotes}) ne peut être supérieur à la population ({population}).</p>
                </div>
              </div>
            ) : result.noMajorityInFirstRound ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-amber-500/20 p-4 rounded-full"><AlertTriangle className="w-12 h-12 text-amber-500" /></div>
                <div>
                  <p className="text-xl font-black text-amber-400">Ballotage</p>
                  <p className="text-slate-400 text-sm mt-2">Aucune liste n'obtient la majorité absolue au premier tour. Un second tour est nécessaire.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {result.admittedLists
                  .filter(l => l.isAdmitted && l.totalSeats > 0)
                  .sort((a,b) => b.totalSeats - a.totalSeats)
                  .map((l, i) => (
                    <motion.div layout key={l.id} className={`p-5 rounded-2xl flex justify-between items-center ${i === 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-black ${i === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{i + 1}</div>
                        <div>
                          <p className="font-bold text-lg leading-none">{l.name}</p>
                          <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">{l.votes.toLocaleString()} voix • {l.percentage.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-5xl font-black ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>{l.totalSeats}</span>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Sièges</p>
                      </div>
                    </motion.div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-8 border-t border-white/5 text-[10px] text-slate-600 uppercase font-bold tracking-widest text-center">
              Mode de scrutin proportionnel • Prime majoritaire incluse
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Composants Lucide manquants dans l'import précédent
function Users(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function Scale(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>; }
