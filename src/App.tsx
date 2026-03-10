import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, RotateCcw, Lightbulb, Users, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDistribution } from './utils/electionEngine';
import { getSeatsFromPopulation } from './utils/populationMapping';
import { CandidateList, ElectionRound, CityType } from './types';

export default function App() {
  const [totalSeats, setTotalSeats] = useState<number>(19);
  const [population, setPopulation] = useState<number | undefined>(1800);
  const [round, setRound] = useState<ElectionRound>(1);
  const [cityType, setCityType] = useState<CityType>('STANDARD');
  const [manualTotalVotes, setManualTotalVotes] = useState<number | undefined>(undefined);
  const [lists, setLists] = useState<CandidateList[]>([
    { id: '1', name: 'Liste A', votes: 101 },
    { id: '2', name: 'Liste B', votes: 54 },
    { id: '3', name: 'Liste C', votes: 45 },
  ]);

  // Synchronisation Population -> Sièges
  useEffect(() => {
    if (population) setTotalSeats(getSeatsFromPopulation(population));
  }, [population]);

  const sumOfVotes = useMemo(() => lists.reduce((s, l) => s + l.votes, 0), [lists]);
  
  // Sécurité : Vérification de cohérence voix/population
  const populationExceeded = population !== undefined && sumOfVotes > population;

  const result = useMemo(() => {
    return calculateDistribution(totalSeats, lists, manualTotalVotes || sumOfVotes, round, cityType);
  }, [totalSeats, lists, manualTotalVotes, sumOfVotes, round, cityType]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900 font-sans">
      <header className="mb-10 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter text-slate-950">Lex Publica</h1>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Répartition des sièges municipaux</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full shadow-sm border border-slate-100">
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* CONFIGURATION */}
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            
            {/* 1. Tour de scrutin */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest text-center">Étape 1 : Tour de scrutin</label>
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setRound(1)} 
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${round === 1 ? 'bg-white shadow-md text-slate-950 translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  1er Tour
                </button>
                <button 
                  onClick={() => setRound(2)} 
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${round === 2 ? 'bg-white shadow-md text-slate-950 translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  2nd Tour
                </button>
              </div>
              <p className="text-[10px] text-center mt-2 text-slate-400 font-bold italic">
                {round === 1 ? "Majorité absolue (>50%) requise pour la prime" : "Majorité relative suffisante pour la prime"} [cite: 6, 8, 41]
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* 2. Population & Ville */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-center">Étape 2 : Contexte</label>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 tracking-tighter">Population légale</label>
                <input 
                  type="number" 
                  value={population} 
                  onChange={e => setPopulation(Number(e.target.value))} 
                  className={`w-full p-4 border rounded-2xl text-2xl font-black focus:ring-4 focus:ring-slate-100 outline-none transition-all ${populationExceeded ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50'}`} 
                />
                <div className="mt-3 flex justify-between items-center px-1 text-sm font-black text-slate-900">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> {totalSeats} sièges au conseil</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter italic font-bold">Source : Code électoral [cite: 61]</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setCityType('STANDARD')} className={`flex-1 p-3 rounded-xl border text-xs font-black transition-all ${cityType === 'STANDARD' ? 'bg-slate-950 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>Commune Standard</button>
                <button onClick={() => setCityType('PLM')} className={`flex-1 p-3 rounded-xl border text-xs font-black transition-all ${cityType === 'PLM' ? 'bg-slate-950 text-white shadow-xl' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>Paris / Lyon / Marseille</button>
              </div>
            </div>
          </div>

          {/* 3. Listes */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Scale className="w-4 h-4"/> Voix par liste</h2>
              <button onClick={() => setLists([...lists, {id: crypto.randomUUID(), name: `Liste ${String.fromCharCode(65 + lists.length)}`, votes: 0}])} className="text-[10px] font-black bg-slate-950 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg flex items-center gap-1">
                <Plus className="w-3 h-3" /> Nouvelle Liste
              </button>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {lists.map((l, index) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={l.id} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm group hover:border-slate-400 transition-all">
                    <div className={`w-1.5 h-8 rounded-full ${['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500'][index % 5]}`} />
                    <input value={l.name} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, name: e.target.value} : item))} className="flex-grow p-1 text-sm font-black text-slate-800 focus:outline-none" />
                    <div className="relative">
                      <input type="number" value={l.votes} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, votes: Number(e.target.value)} : item))} className="w-28 p-2 text-right font-mono font-black text-slate-950 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none" />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">Voix</span>
                    </div>
                    <button onClick={() => setLists(lists.filter(item => item.id !== l.id))} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* RÉSULTATS */}
        <section className="relative">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-2">🎯 Répartition finale</h2>
          <div className="bg-slate-950 text-white p-8 rounded-[3rem] shadow-2xl min-h-[500px] flex flex-col border-4 border-slate-900 sticky top-8">
            
            {populationExceeded ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-rose-500/20 p-6 rounded-full border-2 border-rose-500/50"><AlertCircle className="w-16 h-16 text-rose-500 animate-pulse" /></div>
                <div>
                  <p className="text-2xl font-black text-rose-500 uppercase tracking-tighter">Incohérence majeure</p>
                  <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto font-medium">Le total des suffrages ({sumOfVotes.toLocaleString()}) dépasse la population légale ({population?.toLocaleString()}).</p>
                </div>
              </div>
            ) : result.noMajorityInFirstRound && round === 1 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-amber-500/20 p-6 rounded-full border-2 border-amber-500/50"><AlertTriangle className="w-16 h-16 text-amber-500" /></div>
                <div>
                  <p className="text-2xl font-black text-amber-400 uppercase tracking-tighter italic">Ballotage</p>
                  <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto">Aucune liste n'obtient la majorité absolue au 1er tour. Les sièges ne peuvent être répartis.</p>
                  <button onClick={() => setRound(2)} className="mt-8 px-6 py-3 bg-white text-slate-950 rounded-2xl font-black text-xs hover:scale-105 transition-transform">Simuler le 2nd Tour</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {result.admittedLists
                  .filter(l => l.isAdmitted && l.totalSeats > 0)
                  .sort((a,b) => b.totalSeats - a.totalSeats)
                  .map((l, i) => (
                    <motion.div layout key={l.id} className={`p-6 rounded-[2rem] flex justify-between items-center transition-all ${i === 0 ? 'bg-emerald-500/10 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-white/5 border border-white/10'}`}>
                      <div className="flex items-center gap-5">
                        <div className={`text-4xl font-black italic ${i === 0 ? 'text-emerald-400' : 'text-slate-700'}`}>{i + 1}</div>
                        <div>
                          <p className="font-black text-xl leading-none">{l.name}</p>
                          <p className="text-[10px] text-slate-500 mt-2 uppercase font-black tracking-widest italic">{l.votes.toLocaleString()} voix • {l.percentage.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className={`text-6xl font-black tracking-tighter ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>{l.totalSeats}</span>
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${i === 0 ? 'text-emerald-500' : 'text-slate-600'}`}>{l.totalSeats > 1 ? 'Sièges' : 'Siège'}</span>
                        </div>
                        {i === 0 && <p className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest mt-1 italic">Prime de {cityType === 'PLM' ? '25%' : '50%'} incluse</p>}
                      </div>
                    </motion.div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-8 border-t border-white/5 text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] text-center italic">
              Algorithme Lex Publica • Art. L.262 du Code électoral
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
