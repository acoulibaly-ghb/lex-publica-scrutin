import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, RotateCcw, Scale, Users, Lightbulb, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDistribution } from './utils/electionEngine';
import { POPULATION_SEATS_MAPPING } from './utils/populationMapping';
import { CandidateList, ElectionRound, CityType } from './types';

export default function App() {
  // 1. ÉTATS & STRATES
  const [rangeIndex, setRangeIndex] = useState<number>(4); // Par défaut : 2500-3499 hab
  const [population, setPopulation] = useState<number | ''>(3000);
  const [exprimés, setExprimés] = useState<number | ''>(1883);
  const [round, setRound] = useState<ElectionRound>(1);
  const [cityType, setCityType] = useState<CityType>('STANDARD');
  const [showHelp, setShowHelp] = useState(false);
  
  const [lists, setLists] = useState<CandidateList[]>([
    { id: '1', name: 'Liste A', votes: 979 },
    { id: '2', name: 'Liste B', votes: 814 },
    { id: '3', name: 'Liste C', votes: 90 },
  ]);

  // 2. SYNCHRONISATION BIDIRECTIONNELLE (Impact dans les deux sens)
  const selectedRange = POPULATION_SEATS_MAPPING[rangeIndex];
  const totalSeats = selectedRange.seats;

  const updateByRangeIndex = (idx: number) => {
    setRangeIndex(idx);
    const range = POPULATION_SEATS_MAPPING[idx];
    // On met à jour la population de référence avec le max de la strate (ou min si infini)
    setPopulation(range.max === Infinity ? range.min : range.max);
  };

  const updateBySeats = (seats: number) => {
    const idx = POPULATION_SEATS_MAPPING.findIndex(r => r.seats === seats);
    if (idx !== -1) updateByRangeIndex(idx);
  };

  // 3. SECURITÉ ANTI-BUG (On traite les chaînes vides comme 0 pour éviter NaN)
  const safePopulation = Number(population) || 0;
  const safeExprimés = Number(exprimés) || 0;
  const safeLists = lists.map(l => ({ ...l, votes: Number(l.votes) || 0 }));
  const sumOfVotes = safeLists.reduce((s, l) => s + l.votes, 0);
  
  const errorPopulation = safeExprimés > safePopulation;
  const errorVotes = sumOfVotes > safeExprimés;

  const result = useMemo(() => {
    return calculateDistribution(totalSeats, safeLists, safeExprimés, round, cityType);
  }, [totalSeats, safeLists, safeExprimés, round, cityType]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      
      {/* LIGHTBOX AIDE */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 md:p-12 shadow-2xl relative border-4 border-amber-400">
              <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full"><X /></button>
              <h2 className="text-3xl font-serif font-black italic mb-6 text-slate-900">Mémento Municipal 2026</h2>
              <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
                <p className="p-4 bg-amber-50 rounded-2xl border border-amber-100 font-bold text-amber-900 italic">
                  "Loi n°2025-444 : Le scrutin proportionnel est désormais la règle universelle pour toutes les communes de France."
                </p>
                <p><strong>Effectif Légal :</strong> Fixé par la strate de population de la commune.</p>
                <p><strong>Prime Majoritaire :</strong> 50% des sièges (Standard) ou 25% (PLM) à la liste arrivée en tête.</p>
                <p><strong>Plus forte moyenne :</strong> Les sièges restants sont attribués un par un. On divise les voix par les sièges proportionnels + 1 (la prime majoritaire ne compte pas dans le diviseur).</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-10 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter text-slate-950 leading-none">Lex Publica</h1>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-bold italic mt-2">Réforme Municipale 2026 • Loi n°2025-444</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowHelp(true)} className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-lg border-b-4 border-amber-600 hover:scale-105 transition-all"><Lightbulb /></button>
          <button onClick={() => window.location.reload()} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-200 hover:text-slate-950 transition-colors"><RotateCcw /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            
            {/* 1. SELECTION SYNCHRONISÉE POPULATION / SIÈGES */}
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center italic">1. Strate & Effectif légal</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Strate de Population</span>
                  <div className="relative">
                    <select 
                      value={rangeIndex}
                      onChange={(e) => updateByRangeIndex(parseInt(e.target.value))}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black appearance-none outline-none focus:border-slate-900 transition-colors"
                    >
                      {POPULATION_SEATS_MAPPING.map((range, idx) => (
                        <option key={idx} value={idx}>
                          {range.max === Infinity ? `Plus de ${range.min.toLocaleString()} hab.` : `De ${range.min.toLocaleString()} à ${range.max.toLocaleString()} hab.`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Effectif du Conseil</span>
                  <div className="relative">
                    <select 
                      value={totalSeats}
                      onChange={(e) => updateBySeats(parseInt(e.target.value))}
                      className="w-full p-4 bg-slate-900 border-2 border-slate-900 text-white rounded-2xl text-xs font-black appearance-none outline-none"
                    >
                      {POPULATION_SEATS_MAPPING.map((range, idx) => (
                        <option key={idx} value={range.seats}>{range.seats} sièges</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 text-center">Ajustement Population réelle (Optionnel)</label>
                <input 
                  type="number" 
                  value={population} 
                  onChange={e => setPopulation(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Population exacte..."
                  className="w-full bg-transparent text-center text-2xl font-black outline-none" 
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. EXPRIMÉS ET TOURS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block italic">2. Suffrages Exprimés</label>
                <input 
                  type="number" 
                  value={exprimés} 
                  onChange={e => setExprimés(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`w-full p-4 border-2 rounded-2xl text-2xl font-black outline-none transition-all ${errorPopulation ? 'border-rose-500 bg-rose-50 text-rose-900' : 'bg-slate-50 border-slate-100 focus:border-slate-900'}`} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block italic">3. Tour de scrutin</label>
                <div className="flex p-1 bg-slate-100 rounded-2xl h-[62px]">
                  <button onClick={() => setRound(1)} className={`flex-1 rounded-xl text-xs font-black transition-all ${round === 1 ? 'bg-white shadow text-slate-950 underline decoration-slate-950 decoration-2 underline-offset-4' : 'text-slate-400'}`}>1er Tour</button>
                  <button onClick={() => setRound(2)} className={`flex-1 rounded-xl text-xs font-black transition-all ${round === 2 ? 'bg-white shadow text-slate-950 underline decoration-slate-950 decoration-2 underline-offset-4' : 'text-slate-400'}`}>2nd Tour</button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. LES LISTES (Saisie robuste) */}
          <div className="space-y-4">
             <div className="flex justify-between items-center px-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-2"><Scale className="w-4 h-4"/> Saisie des voix</h2>
                <button onClick={() => setLists([...lists, {id: crypto.randomUUID(), name: `Liste ${String.fromCharCode(65 + lists.length)}`, votes: 0}])} className="text-[10px] font-black bg-slate-950 text-white px-4 py-2 rounded-xl shadow-xl hover:scale-105 transition-transform">Nouvelle Liste</button>
             </div>
             <div className="space-y-2">
               {lists.map((l, index) => (
                 <div key={l.id} className="flex gap-3 items-center bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm hover:border-slate-400 transition-all">
                   <div className={`w-2 h-8 rounded-full ${['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'][index % 4]}`} />
                   <input value={l.name} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, name: e.target.value} : item))} className="flex-grow p-1 text-sm font-black text-slate-800 outline-none uppercase tracking-tighter" />
                   <div className="relative">
                    <input 
                      type="number" 
                      value={l.votes || ''} 
                      onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, votes: e.target.value === '' ? 0 : Number(e.target.value)} : item))} 
                      className="w-24 p-2 text-right font-mono font-black text-slate-950 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-slate-900" 
                    />
                    {l.votes === 0 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-300 font-bold uppercase pointer-events-none">Voix</span>}
                   </div>
                   <button onClick={() => setLists(lists.filter(item => item.id !== l.id))} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
               {errorVotes && <p className="p-3 text-red-600 text-[10px] font-black text-center uppercase italic border-2 border-red-100 rounded-xl bg-red-50 animate-bounce mt-4">⚠️ Somme des voix ({sumOfVotes}) {'>'} Exprimés ({safeExprimés})</p>}
             </div>
          </div>
        </section>

        {/* RÉSULTATS */}
        <section>
          <div className="bg-slate-950 text-white p-10 rounded-[4rem] shadow-2xl min-h-[600px] flex flex-col border-8 border-slate-900 sticky top-8">
            {errorPopulation || errorVotes ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <AlertCircle className="w-20 h-20 text-rose-500 animate-pulse" />
                <p className="text-3xl font-black text-white uppercase tracking-tighter italic">Saisie Incohérente</p>
                <p className="text-slate-500 text-sm max-w-xs font-bold italic">Vérifiez les totaux (Population vs Exprimés vs Voix) pour débloquer le calcul.</p>
              </div>
            ) : result.noMajorityInFirstRound && round === 1 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-8">
                <div className="p-8 bg-amber-500/10 rounded-full border-4 border-amber-500/30">
                  <AlertTriangle className="w-16 h-16 text-amber-500" />
                </div>
                <div>
                  <p className="text-4xl font-serif font-black italic text-amber-500 tracking-tighter uppercase mb-4 underline decoration-amber-900 decoration-8 underline-offset-[-2px]">Ballotage</p>
                  <p className="text-slate-400 text-sm font-bold italic">Majorité absolue non atteinte ({Math.floor(safeExprimés/2) + 1} voix requises au 1er tour).</p>
                  <button onClick={() => setRound(2)} className="mt-10 px-10 py-4 bg-white text-slate-950 rounded-[2rem] font-black text-xs hover:scale-105 transition-transform shadow-xl">Simuler le 2nd Tour</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-10 px-2 border-b border-white/10 pb-4">
                   <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] italic">Répartition Finale</h2>
                   <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-500/30 tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Scrutin Validé</div>
                </div>
                {result.admittedLists
                  .filter(l => l.isAdmitted && l.totalSeats > 0)
                  .sort((a,b) => b.totalSeats - a.totalSeats)
                  .map((l, i) => (
                    <motion.div layout key={l.id} className={`p-8 rounded-[2.5rem] flex justify-between items-center transition-all ${i === 0 ? 'bg-emerald-500/10 border-2 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-white/5 border border-white/5'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`text-4xl font-black italic tracking-tighter ${i === 0 ? 'text-emerald-400' : 'text-slate-800'}`}>{i + 1}</div>
                        <div>
                          <p className="font-black text-2xl leading-none tracking-tight uppercase">{l.name}</p>
                          {/* POURCENTAGES HAUT CONTRASTE (SKY BLUE) */}
                          <div className="mt-3 flex items-center gap-3">
                             <span className="text-xs font-black text-sky-400 bg-sky-400/10 px-2.5 py-1 rounded-lg italic tracking-widest">{l.percentage.toFixed(2)}%</span>
                             <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{l.votes.toLocaleString()} voix</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1.5 justify-end leading-none">
                           <span className={`text-7xl font-black tracking-tighter ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>{l.totalSeats}</span>
                           <span className={`text-[10px] font-black uppercase tracking-tighter mb-2 ${i === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>Sièges</span>
                        </div>
                        {i === 0 && <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 italic leading-none">+ Prime Majoritaire</p>}
                      </div>
                    </motion.div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-10 border-t border-white/5 text-[8px] text-slate-700 uppercase font-black tracking-[0.4em] text-center italic leading-loose">
              Loi 2025-444 • Prime {cityType === 'PLM' ? '25%' : '50%'} • Art. L.262 du Code électoral
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Users(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function Scale(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>; }
