import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, RotateCcw, Scale, Users, Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDistribution } from './utils/electionEngine';
import { getSeatsFromPopulation } from './utils/populationMapping';
import { CandidateList, ElectionRound, CityType } from './types';

export default function App() {
  const [population, setPopulation] = useState<number>(300);
  const [totalSeats, setTotalSeats] = useState<number>(11);
  const [exprimés, setExprimés] = useState<number>(200);
  const [round, setRound] = useState<ElectionRound>(1);
  const [cityType, setCityType] = useState<CityType>('STANDARD');
  const [showHelp, setShowHelp] = useState(false);
  const [lists, setLists] = useState<CandidateList[]>([
    { id: '1', name: 'Liste A', votes: 101 },
    { id: '2', name: 'Liste B', votes: 54 },
    { id: '3', name: 'Liste C', votes: 45 },
  ]);

  useEffect(() => {
    if (population) setTotalSeats(getSeatsFromPopulation(population));
  }, [population]);

  const sumOfVotes = useMemo(() => lists.reduce((s, l) => s + l.votes, 0), [lists]);
  const errorPopulation = exprimés > population;
  const errorVotes = sumOfVotes > exprimés;

  const result = useMemo(() => {
    return calculateDistribution(totalSeats, lists, exprimés, round, cityType);
  }, [totalSeats, lists, exprimés, round, cityType]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 text-slate-900 font-sans">
      
      {/* LIGHTBOX D'AIDE */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-8 md:p-12">
              <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
              
              <h2 className="text-3xl font-serif font-black italic mb-6 flex items-center gap-3 text-amber-500 underline decoration-slate-900 decoration-4 underline-offset-8">
                Guide Lex Publica 2026
              </h2>
              
              <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
                <section className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="font-bold text-amber-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Loi n°2025-444 du 21 mai 2025
                  </p>
                  <p className="mt-1 italic">Le mode de scrutin est désormais harmonisé : proportionnelle de liste avec prime de 50% pour TOUTES les communes de France (hors PLM).</p>
                </section>

                <div>
                  <h3 className="font-black uppercase tracking-widest text-xs text-slate-400 mb-2">1. Répartition des sièges</h3>
                  <p>La liste en tête reçoit une <strong>prime majoritaire</strong> de 50% (Standard) ou 25% (PLM). Au 1er tour, elle nécessite la majorité absolue ({'>'}50%). Au 2nd tour, la majorité relative suffit.</p>
                </div>

                <div>
                  <h3 className="font-black uppercase tracking-widest text-xs text-slate-400 mb-2">2. La règle de la moyenne (Art. L.262)</h3>
                  <p>Les sièges restants sont attribués un par un à la plus forte moyenne. <strong>Attention :</strong> La prime majoritaire est exclue du diviseur pour calculer cette moyenne.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-[10px] space-y-1">
                  <p className="font-bold text-slate-900 uppercase mb-2 italic">Exemple 300 hab. (11 sièges)</p>
                  <p>• Prime : 11 * 0.5 = 5.5 → 6 sièges (Arrondi sup. L.262)</p>
                  <p>• Reste : 5 sièges répartis au quotient puis à la moyenne.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-10 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter text-slate-950">Lex Publica</h1>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-bold italic">Réforme Municipale 2026 • Loi n°2025-444</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowHelp(true)} className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-lg hover:scale-105 transition-transform border-b-4 border-amber-600 active:border-b-0 active:translate-y-1">
            <Lightbulb className="w-6 h-6" />
          </button>
          <button onClick={() => window.location.reload()} className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-200 hover:text-slate-950 transition-colors">
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            
            {/* 1. TOUR & TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tour de scrutin</label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button onClick={() => setRound(1)} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${round === 1 ? 'bg-white shadow text-slate-900 underline decoration-slate-900 decoration-2 underline-offset-4' : 'text-slate-400'}`}>1er Tour</button>
                  <button onClick={() => setRound(2)} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${round === 2 ? 'bg-white shadow text-slate-900 underline decoration-slate-900 decoration-2 underline-offset-4' : 'text-slate-400'}`}>2nd Tour</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de ville</label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button onClick={() => setCityType('STANDARD')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${cityType === 'STANDARD' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>Standard</button>
                  <button onClick={() => setCityType('PLM')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${cityType === 'PLM' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>PLM</button>
                </div>
              </div>
            </div>

            {/* 2. CHIFFRES CLÉS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic font-serif">Population Légale</label>
                <div className="relative">
                   <input type="number" value={population} onChange={e => setPopulation(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all" />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                      <Users className="w-4 h-4" /> <span className="text-sm font-black">{totalSeats} sièges</span>
                   </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic font-serif">Suffrages Exprimés</label>
                <input type="number" value={exprimés} onChange={e => setExprimés(Number(e.target.value))} className={`w-full p-4 border rounded-2xl text-2xl font-black outline-none transition-all ${errorPopulation ? 'border-red-500 bg-red-50 text-red-900' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100'}`} />
              </div>
            </div>
            
            {errorPopulation && <p className="p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100 text-center italic animate-pulse">⚠️ Les exprimés ({exprimés}) dépassent la population ({population})</p>}
          </div>

          {/* 3. LES LISTES */}
          <div className="space-y-4">
             <div className="flex justify-between items-center px-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 italic"><Scale className="w-4 h-4"/> Saisie des voix</h2>
                <button onClick={() => setLists([...lists, {id: crypto.randomUUID(), name: `Liste ${String.fromCharCode(65 + lists.length)}`, votes: 0}])} className="text-[10px] font-black bg-slate-950 text-white px-4 py-2 rounded-xl shadow-xl hover:bg-slate-800 transition-all">Ajouter une liste</button>
             </div>
             <div className="space-y-2">
               {lists.map((l, index) => (
                 <div key={l.id} className="flex gap-3 items-center bg-white p-4 rounded-[1.5rem] border border-slate-200 group hover:border-slate-400 transition-all shadow-sm">
                   <div className={`w-2 h-8 rounded-full ${['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'][index % 4]}`} />
                   <input value={l.name} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, name: e.target.value} : item))} className="flex-grow p-1 text-sm font-black text-slate-800 outline-none uppercase tracking-tighter" />
                   <input type="number" value={l.votes} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, votes: Number(e.target.value)} : item))} className="w-24 p-2 text-right font-mono font-black text-slate-950 bg-slate-50 rounded-xl outline-none border border-slate-100" />
                   <button onClick={() => setLists(lists.filter(item => item.id !== l.id))} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
               {errorVotes && <p className="p-3 text-red-600 text-[10px] font-black text-center uppercase italic border-2 border-red-100 rounded-xl bg-red-50">⚠️ Somme des listes ({sumOfVotes}) {'>'} Exprimés ({exprimés})</p>}
             </div>
          </div>
        </section>

        {/* RÉSULTATS */}
        <section>
          <div className="bg-slate-950 text-white p-10 rounded-[4rem] shadow-2xl min-h-[600px] flex flex-col border-8 border-slate-900 sticky top-8">
            {errorPopulation || errorVotes ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <AlertCircle className="w-20 h-20 text-rose-500 animate-pulse" />
                <p className="text-3xl font-black text-white uppercase tracking-tighter italic">Saisie Invalide</p>
                <p className="text-slate-500 text-sm max-w-xs font-bold italic">Le calcul est suspendu jusqu'à correction des chiffres de population et de suffrages.</p>
              </div>
            ) : result.noMajorityInFirstRound && round === 1 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-8">
                <div className="p-8 bg-amber-500/10 rounded-full border-4 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                  <AlertTriangle className="w-16 h-16 text-amber-500" />
                </div>
                <div>
                  <p className="text-4xl font-serif font-black italic text-amber-500 tracking-tighter uppercase mb-4 underline decoration-amber-900 decoration-8 underline-offset-[-2px]">Ballotage</p>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed font-bold italic">
                    Aucune liste n'a franchi le seuil de {Math.floor(exprimés/2) + 1} voix (Majorité absolue).
                  </p>
                  <button onClick={() => setRound(2)} className="mt-10 px-10 py-4 bg-white text-slate-950 rounded-[2rem] font-black text-xs hover:scale-105 transition-transform shadow-xl">Simuler le 2nd Tour</button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-10 px-2 border-b border-white/10 pb-4">
                   <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] italic">Répartition Officielle</h2>
                   <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">Scrutin Validé</div>
                </div>
                {result.admittedLists
                  .filter(l => l.isAdmitted && l.totalSeats > 0)
                  .sort((a,b) => b.totalSeats - a.totalSeats)
                  .map((l, i) => (
                    <motion.div layout key={l.id} className={`p-8 rounded-[2.5rem] flex justify-between items-center transition-all ${i === 0 ? 'bg-emerald-500/10 border-2 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-white/5 border border-white/5'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`text-4xl font-black italic tracking-tighter ${i === 0 ? 'text-emerald-400' : 'text-slate-800'}`}>{i + 1}</div>
                        <div>
                          <p className="font-black text-2xl leading-none tracking-tight">{l.name}</p>
                          <p className="text-[10px] text-slate-500 mt-2 uppercase font-black tracking-widest italic">{l.votes} voix • {l.percentage.toFixed(2)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1.5 justify-end">
                           <span className={`text-7xl font-black tracking-tighter leading-none ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>{l.totalSeats}</span>
                           <span className={`text-[10px] font-black uppercase tracking-tighter mb-2 ${i === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>Sièges</span>
                        </div>
                        {i === 0 && <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic">+ Prime Majoritaire</p>}
                      </div>
                    </motion.div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-10 border-t border-white/5 text-[8px] text-slate-700 uppercase font-black tracking-[0.4em] text-center italic leading-loose">
              Système Proportionnel Harmonisé (Loi 2025-444) • Prime {cityType === 'PLM' ? '25%' : '50%'} • Art. L.262 du Code électoral
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Composants SVG Lucide
function Users(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function Scale(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>; }
