import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, RotateCcw, Scale, Users, Lightbulb, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { calculateDistribution } from './utils/electionEngine';
import { POPULATION_SEATS_MAPPING } from './utils/populationMapping';
import { CandidateList, ElectionRound, CityType } from './types';

const PLM_CITIES = {
  Paris: 163, 
  Marseille: 111, 
  Lyon: 73 
};

// --- DÉTECTION AUTOMATIQUE AU DÉMARRAGE ---
const START_POPULATION = 300000;
// L'appli cherche toute seule la bonne strate pour 300 000 habitants
const detectedIndex = POPULATION_SEATS_MAPPING.findIndex(r => START_POPULATION >= r.min && START_POPULATION <= r.max);
const START_INDEX = detectedIndex !== -1 ? detectedIndex : POPULATION_SEATS_MAPPING.length - 1;

export default function App() {
  const [cityType, setCityType] = useState<CityType>('STANDARD');
  
  // La Trinité démarre parfaitement synchronisée
  const [rangeIndex, setRangeIndex] = useState<number>(START_INDEX); 
  const [population, setPopulation] = useState<number | ''>(START_POPULATION);
  const [totalSeats, setTotalSeats] = useState<number>(POPULATION_SEATS_MAPPING[START_INDEX].seats);
  
  const [plmCity, setPlmCity] = useState<keyof typeof PLM_CITIES>('Paris');

  const [exprimés, setExprimés] = useState<number | ''>(200);
  const [round, setRound] = useState<ElectionRound>(1);
  const [showHelp, setShowHelp] = useState(false);
  
  const [lists, setLists] = useState<CandidateList[]>([
    { id: '1', name: 'Liste A', votes: 101 },
    { id: '2', name: 'Liste B', votes: 54 },
    { id: '3', name: 'Liste C', votes: 45 },
  ]);

  // --- LA TRINITÉ SYNCHRONISÉE ---
  
  // 1. Entrée par la STRATE
  const updateByRangeIndex = (idx: number) => {
    setRangeIndex(idx);
    const range = POPULATION_SEATS_MAPPING[idx];
    setPopulation(range.min); // On aligne la population sur le minimum de la strate
    setTotalSeats(range.seats);
  };

  // 2. Entrée par la POPULATION RÉELLE
  const handlePopulationChange = (val: string) => {
    if (val === '') {
      setPopulation('');
      return;
    }
    const num = Number(val);
    setPopulation(num);
    
    if (cityType === 'STANDARD') {
      const newIdx = POPULATION_SEATS_MAPPING.findIndex(r => num >= r.min && num <= r.max);
      if (newIdx !== -1 && newIdx !== rangeIndex) {
        setRangeIndex(newIdx);
        setTotalSeats(POPULATION_SEATS_MAPPING[newIdx].seats);
      }
    }
  };

  // 3. Entrée par les SIÈGES
  const updateBySeats = (seats: number) => {
    const newIdx = POPULATION_SEATS_MAPPING.findIndex(r => r.seats === seats);
    if (newIdx !== -1) {
      setRangeIndex(newIdx);
      setTotalSeats(seats);
      setPopulation(POPULATION_SEATS_MAPPING[newIdx].min); // On aligne sur le minimum
    }
  };

  // Effet pour forcer le nombre de sièges en mode PLM
  useEffect(() => {
    if (cityType === 'PLM') {
      setTotalSeats(PLM_CITIES[plmCity]);
    } else {
      // Retour au standard : on resynchronise par rapport à la strate actuelle
      setTotalSeats(POPULATION_SEATS_MAPPING[rangeIndex].seats);
    }
  }, [cityType, plmCity, rangeIndex]);

  // SECURITÉ ANTI-BUG
  const safePopulation = Number(population) || 0;
  const safeExprimés = Number(exprimés) || 0;
  const safeLists = lists.map(l => ({ ...l, votes: Number(l.votes) || 0 }));
  const sumOfVotes = safeLists.reduce((s, l) => s + l.votes, 0);
  
  const errorPopulation = cityType === 'STANDARD' && safeExprimés > safePopulation;
  const errorVotes = sumOfVotes > safeExprimés;
  const errorNoAdmitted = safeExprimés > 0 && safeLists.every(l => l.votes < safeExprimés * 0.05);

  const result = useMemo(() => {
    if (errorNoAdmitted || errorPopulation || errorVotes) return null;
    return calculateDistribution(totalSeats, safeLists, safeExprimés, round, cityType);
  }, [totalSeats, safeLists, safeExprimés, round, cityType, errorNoAdmitted, errorPopulation, errorVotes]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      
      {/* LIGHTBOX AIDE */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 md:p-12 shadow-2xl relative border-4 border-amber-400 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full"><X /></button>
              <h2 className="text-3xl font-serif font-black italic mb-6 text-slate-900">Mémento Municipal 2026</h2>
              <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <h3 className="font-black text-amber-900 uppercase tracking-widest text-xs mb-2">Droit Commun</h3>
                  <p>Harmonisation pour toutes les communes. <strong>Prime majoritaire de 50%</strong> (Art. L.262) avec arrondi supérieur si {'>'} 4 sièges.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="font-black text-blue-900 uppercase tracking-widest text-xs mb-2">Régime Spécial PLM</h3>
                  <p><strong>Loi n°2025-795 du 11 août 2025</strong> : La prime pour Paris, Lyon et Marseille est réduite au <strong>quart (25%)</strong> des sièges à pourvoir (Art. L.272-4-1).</p>
                </div>
                <p><strong>Règle de la Moyenne :</strong> Les sièges restants sont attribués à la plus forte moyenne (Art. L.262).</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-10 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter text-slate-950 leading-none">Lex Publica</h1>
          <p className="text-sm text-slate-500 uppercase tracking-widest font-bold italic mt-2">Simulateur Électoral • L.262 & L.272-4-1</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowHelp(true)} className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-lg border-b-4 border-amber-600 hover:scale-105 transition-all"><Lightbulb /></button>
          <button onClick={() => window.location.reload()} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-200 hover:text-slate-950 transition-colors"><RotateCcw /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center italic">1. Régime Juridique</label>
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                <button onClick={() => setCityType('STANDARD')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${cityType === 'STANDARD' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Droit Commun</button>
                <button onClick={() => setCityType('PLM')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${cityType === 'PLM' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:text-slate-600'}`}>Statut PLM</button>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-6">
              {cityType === 'STANDARD' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Strate de Population</span>
                    <div className="relative">
                      <select value={rangeIndex} onChange={(e) => updateByRangeIndex(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black appearance-none outline-none focus:ring-4 focus:ring-slate-100 transition-all">
                        {POPULATION_SEATS_MAPPING.map((range, idx) => (
                          <option key={idx} value={idx}>{range.max === Infinity ? `Plus de ${range.min.toLocaleString()} hab.` : `De ${range.min.toLocaleString()} à ${range.max.toLocaleString()} hab.`}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Population & Sièges</span>
                    <div className="flex gap-2">
                      <input type="number" value={population} onChange={e => handlePopulationChange(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black outline-none focus:ring-4 focus:ring-slate-100 transition-all" placeholder="Population" />
                      
                      {/* LE SELECTEUR DE SIÈGES SYNCHRONISÉ */}
                      <div className="relative shrink-0 w-32">
                        <select 
                          value={totalSeats} 
                          onChange={(e) => updateBySeats(Number(e.target.value))}
                          className="w-full h-full bg-slate-900 text-white px-2 rounded-2xl text-lg font-black appearance-none outline-none focus:ring-4 focus:ring-slate-400 transition-all text-center"
                        >
                          {POPULATION_SEATS_MAPPING.map((range, idx) => (
                            <option key={idx} value={range.seats}>{range.seats} sièges</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase ml-1">Ville PLM (Loi 2025-795)</span>
                  <div className="relative">
                    <select value={plmCity} onChange={(e) => setPlmCity(e.target.value as keyof typeof PLM_CITIES)} className="w-full p-4 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-2xl text-lg font-black appearance-none outline-none">
                      <option value="Paris">Paris (163 sièges)</option>
                      <option value="Marseille">Marseille (111 sièges)</option>
                      <option value="Lyon">Lyon (73 sièges)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block italic">2. Suffrages Exprimés</label>
                <input type="number" value={exprimés} onChange={e => setExprimés(e.target.value === '' ? '' : Number(e.target.value))} className={`w-full p-4 border-2 rounded-2xl text-2xl font-black outline-none transition-all ${errorPopulation ? 'border-rose-500 bg-rose-50 text-rose-900' : 'bg-slate-50 border-slate-100 focus:border-slate-900'}`} />
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

          <div className="space-y-4">
             <div className="flex justify-between items-center px-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-2"><Scale className="w-4 h-4"/> Saisie des voix</h2>
                <button onClick={() => setLists([...lists, {id: crypto.randomUUID(), name: `Liste ${String.fromCharCode(65 + lists.length)}`, votes: 0}])} className="text-[10px] font-black bg-slate-950 text-white px-4 py-2 rounded-xl shadow-xl hover:scale-105 transition-transform">Nouvelle Liste</button>
             </div>
             <div className="space-y-2">
               {lists.map((l, index) => (
                 <div key={l.id} className="flex gap-3 items-center bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm hover:border-slate-400 transition-all">
                   <div className={`w-2 h-8 rounded-full ${['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'][index % 4]}`} />
                   <input value={l.name} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, name: e.target.value} : item))} className="flex-grow p-1 text-xs md:text-sm font-black text-slate-800 outline-none uppercase tracking-tighter" />
                   <div className="relative">
                    <input type="number" value={l.votes || ''} onChange={e => setLists(lists.map(item => item.id === l.id ? {...item, votes: e.target.value === '' ? 0 : Number(e.target.value)} : item))} className="w-28 md:w-36 p-3 text-right font-mono font-black text-slate-950 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-slate-900" />
                   </div>
                   <button onClick={() => setLists(lists.filter(item => item.id !== l.id))} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                 </div>
               ))}
             </div>
          </div>
        </section>

        <section>
          <div className="bg-slate-950 text-white p-8 md:p-10 rounded-[4rem] shadow-2xl min-h-[600px] flex flex-col border-8 border-slate-900 sticky top-8">
            
            <div className="flex justify-between items-center mb-8 px-2 border-b border-white/10 pb-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] italic">
                {cityType === 'STANDARD' ? 'Droit Commun' : 'Régime PLM (L.272-4-1)'}
              </h2>
              <div className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Users className="w-3 h-3"/> {totalSeats} Sièges
              </div>
            </div>

            {errorPopulation || errorVotes || errorNoAdmitted ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6">
                <AlertCircle className="w-20 h-20 text-rose-500 animate-pulse" />
                <p className="text-3xl font-black text-white uppercase tracking-tighter italic">Saisie Incohérente</p>
                {errorNoAdmitted && <p className="text-rose-400 text-sm max-w-xs font-bold italic">Calcul bloqué : Aucune liste n'atteint le seuil légal de 5% des exprimés.</p>}
                {(errorPopulation || errorVotes) && <p className="text-slate-500 text-sm max-w-xs font-bold italic">Vérifiez la cohérence mathématique des totaux.</p>}
              </div>
            ) : !result ? null : result.noMajorityInFirstRound && round === 1 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-8">
                <div className="p-8 bg-amber-500/10 rounded-full border-4 border-amber-500/30">
                  <AlertTriangle className="w-16 h-16 text-amber-500" />
                </div>
                <div>
                  <p className="text-4xl font-serif font-black italic text-amber-500 tracking-tighter uppercase mb-4 underline decoration-amber-900 decoration-8 underline-offset-[-2px]">Ballotage</p>
                  <p className="text-slate-400 text-sm font-bold italic">La majorité absolue de {Math.floor(safeExprimés/2) + 1} voix n'est pas atteinte.</p>
                  <button onClick={() => setRound(2)} className="mt-8 px-10 py-4 bg-white text-slate-950 rounded-[2rem] font-black text-xs hover:scale-105 transition-transform shadow-xl">Simuler le 2nd Tour</button>
                </div>
              </div>
            ) : (
              <>
                {result.admittedLists && result.admittedLists.length > 0 && (
                  <div className="h-48 w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={result.admittedLists.filter(l => l.totalSeats > 0)} dataKey="totalSeats" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                          {result.admittedLists.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]} stroke="rgba(15, 23, 42, 0.5)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-4">
                  {result.admittedLists.filter(l => l.isAdmitted && l.totalSeats > 0).sort((a,b) => b.totalSeats - a.totalSeats).map((l, i) => (
                    <motion.div layout key={l.id} className={`p-6 rounded-[2rem] flex justify-between items-center transition-all ${i === 0 ? 'bg-emerald-500/10 border-2 border-emerald-500/30' : 'bg-white/5 border border-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`text-3xl font-black italic tracking-tighter ${i === 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{i + 1}</div>
                        <div>
                          <p className="font-black text-lg md:text-xl leading-none uppercase">{l.name}</p>
                          <div className="mt-2 flex items-center gap-2">
                             <span className="text-[10px] font-black text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md italic">{l.percentage.toFixed(2)}%</span>
                             <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">{l.votes.toLocaleString()} voix</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1.5 justify-end">
                           <span className={`text-4xl md:text-5xl font-black tracking-tighter ${i === 0 ? 'text-emerald-400' : 'text-white'}`}>{l.totalSeats}</span>
                           <span className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${i === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{l.totalSeats > 1 ? 'Sièges' : 'Siège'}</span>
                        </div>
                        {i === 0 && <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic leading-none">+ Prime {cityType === 'PLM' ? '25%' : '50%'}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-auto pt-8 border-t border-white/5 text-[8px] text-slate-700 uppercase font-black tracking-[0.2em] text-center italic">
              Algorithme Conforme au Code électoral • {cityType === 'PLM' ? 'Art. L.272-4-1' : 'Art. L.262'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Users(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function Scale(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>; }
