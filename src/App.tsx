import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, RotateCcw, Scale, Users, PenTool } from 'lucide-react';
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
  const [lists, setLists] = useState<CandidateList[]>([
    { id: '1', name: 'Liste A', votes: 101 },
    { id: '2', name: 'Liste B', votes: 54 },
    { id: '3', name: 'Liste C', votes: 45 },
  ]);

  useEffect(() => {
    if (population) setTotalSeats(getSeatsFromPopulation(population));
  }, [population]);

  const sumOfVotes = useMemo(() => lists.reduce((s, l) => s + l.votes, 0), [lists]);
  
  // LOGIQUE DE CONTRÔLE PRÉCISE
  const errorPopulation = exprimés > population;
  const errorVotes = sumOfVotes > exprimés;

  const result = useMemo(() => {
    return calculateDistribution(totalSeats, lists, exprimés, round, cityType);
  }, [totalSeats, lists, exprimés, round, cityType]);

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900 font-sans">
      <header className="mb-10 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter text-slate-950">Lex Publica</h1>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Simulateur Électoral Conforme L.262</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-white rounded-full shadow-sm border border-slate-100">
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            
            {/* BLOC 1 : CONTEXTE LÉGAL (Population -> Sièges) */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-center">1. Base de calcul des sièges</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Population Légale</label>
                  <input type="number" value={population} onChange={e => setPopulation(Number(e.target.value))} className="w-full bg-transparent text-xl font-black outline-none" />
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sièges à pourvoir</span>
                  <span className="text-xl font-black">{totalSeats}</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* BLOC 2 : RÉSULTATS DU SCRUTIN (Exprimés) */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-center">2. Base de calcul de la majorité</label>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1 text-slate-500 italic">Suffrages Exprimés (Hors blancs/nuls)</label>
                <input 
                  type="number" 
                  value={exprimés} 
                  onChange={e => setExprimés(Number(e.target.value))} 
                  className={`w-full p-4 border rounded-2xl text-2xl font-black outline-none transition-all ${errorPopulation ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 focus:ring-4 focus:ring-slate-100'}`} 
                />
                {errorPopulation && <p className="text-[10px] text-red-600 font-bold mt-1 uppercase">⚠️ Ne peut dépasser la population ({population})</p>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setRound(1)} className={`flex-1 p-3 rounded-xl border text-xs font-black transition-all ${round === 1 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'}`}>1er Tour</button>
                <button onClick={() => setRound(2)} className={`flex-1 p-3 rounded-xl border text-xs font-black transition-all ${round === 2 ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'}`}>2nd Tour</button>
              </div>
            </div>
          </div>

          {/* BLOC 3 : LES LISTES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">3. Voix par liste</h2>
              <button onClick={() => setLists([...lists, {id: crypto.randomUUID(), name: `Liste ${String.fromCharCode(65 + lists.length)}`, votes: 0}])} className="text-[10px] font-black bg-slate-950 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-1">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {lists.map((l, index) => (
                <div key={l.id} className={`flex gap-3 items-center bg-white p-3 rounded-2xl border transition-all ${errorVotes ? 'border-red-200' : 'border-slate-200'}`}>
                  <div className={`w-1.5 h-8 rounded-full ${['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500'][index % 3]}`} />
                  <input value={l.name} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, name: e.target.value} : item))} className="flex-grow p-1 text-sm font-black text-slate-800 outline-none" />
                  <input type="number" value={l.votes} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, votes: Number(e.target.value)} : item))} className="w-24 p-2 text-right font-mono font-black text-slate-950 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-slate-900" />
                  <button onClick={() => setLists(lists.filter(item => item.id !== l.id))} className="p-2 text-slate-200 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {errorVotes && <p className="text-[10px] text-red-600 font-black text-center uppercase mt-2">⚠️ Total des listes ({sumOfVotes}) {'>'} Exprimés ({exprimés})</p>}
            </div>
          </div>
        </section>

        {/* RÉSULTATS */}
        <section className="relative">
          <div className="bg-slate-950 text-white p-8 rounded-[3rem] shadow-2xl min-h-[500px] flex flex-col border-4 border-slate-900 sticky top-8">
            
            {errorPopulation || errorVotes ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-rose-500/20 p-6 rounded-full border-2 border-rose-500/50"><AlertCircle className="w-16 h-16 text-rose-500 animate-pulse" /></div>
                <p className="text-2xl font-black text-rose-500 uppercase tracking-tighter">Erreur de saisie</p>
                <p className="text-slate-400 text-sm italic">Veuillez vérifier la cohérence entre population, exprimés et voix.</p>
              </div>
            ) : result.noMajorityInFirstRound && round === 1 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <div className="bg-amber-500/20 p-6 rounded-full border-2 border-amber-500/50"><AlertTriangle className="w-16 h-16 text-amber-500" /></div>
                <p className="text-2xl font-black text-amber-400 uppercase tracking-tighter italic">Ballotage</p>
                <p className="text-slate-400 text-sm">La liste en tête n'a pas atteint la majorité absolue ({Math.floor(exprimés/2) + 1} voix).</p>
                <button onClick={() => setRound(2)} className="mt-8 px-6 py-3 bg-white text-slate-950 rounded-2xl font-black text-xs">Passer au 2nd Tour</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-8 italic">Répartition officielle L.262</h2>
                {result.admittedLists
                  .filter(l => l.isAdmitted && l.totalSeats > 0)
                  .sort((a,b) => b.totalSeats - a.totalSeats)
                  .map((l, i) => (
                    <motion.div layout key={l.id} className={`p-6 rounded-[2rem] flex justify-between items-center ${i === 0 ? 'bg-emerald-500/10 border-2 border-emerald-500/50' : 'bg-white/5 border border-white/10'}`}>
                      <div>
                        <p className="font-black text-xl leading-none">{l.name}</p>
                        <p className="text-[10px] text-slate-500 mt-2 uppercase font-black tracking-widest italic">{l.votes} voix sur {exprimés}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-6xl font-black tracking-tighter ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>{l.totalSeats}</span>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Sièges</p>
                      </div>
                    </motion.div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-8 border-t border-white/5 text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] text-center italic">
              Conformité : Population ({population}) → Sièges ({totalSeats}) | Exprimés ({exprimés}) → Majorité
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
