import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calculator, Info, CheckCircle2, AlertCircle, ChevronRight, ChevronDown, RotateCcw, Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateList, DistributionResult, ElectionRound, CityType } from './types';
import { calculateDistribution } from './utils/electionEngine';
import { getSeatsFromPopulation, getPopulationRangeFromSeats, formatPopulationRange } from './utils/populationMapping';

export default function App() {
  const [totalSeats, setTotalSeats] = useState<number>(19);
  const [population, setPopulation] = useState<number | undefined>(1800);
  const [round, setRound] = useState<ElectionRound>(1);
  const [cityType, setCityType] = useState<CityType>('STANDARD');
  const [plmCity, setPlmCity] = useState<string | undefined>(undefined);
  const [manualTotalVotes, setManualTotalVotes] = useState<number | undefined>(1883);
  const [lists, setLists] = useState<CandidateList[]>([
    { id: '1', name: 'Liste A', votes: 979, averageAge: undefined },
    { id: '2', name: 'Liste B', votes: 814, averageAge: undefined },
    { id: '3', name: 'Liste C', votes: 90, averageAge: undefined },
  ]);
  const [showHelp, setShowHelp] = useState(false);

  const result = useMemo(() => 
    calculateDistribution(totalSeats, lists, manualTotalVotes, round, cityType), 
    [totalSeats, lists, manualTotalVotes, round, cityType]
  );

  const handlePopulationChange = (val: number | undefined) => {
    setPopulation(val);
    if (val !== undefined && val >= 0 && cityType === 'STANDARD') {
      const seats = getSeatsFromPopulation(val);
      setTotalSeats(seats);
    }
  };

  const handleSeatsChange = (val: number) => {
    setTotalSeats(val);
    if (cityType === 'STANDARD') {
      const range = getPopulationRangeFromSeats(val);
      if (range) {
        if (population === undefined || population < range.min || population > range.max) {
          setPopulation(range.min);
        }
      }
    }
  };

  const handleCityTypeChange = (type: CityType) => {
    setCityType(type);
    if (type === 'STANDARD') {
      setPlmCity(undefined);
      if (population) {
        setTotalSeats(getSeatsFromPopulation(population));
      }
    }
  };

  const handlePlmCityChange = (city: string) => {
    setPlmCity(city);
    setCityType('PLM');
    if (city === 'PARIS') setTotalSeats(163);
    else if (city === 'LYON') setTotalSeats(73);
    else if (city === 'MARSEILLE') setTotalSeats(111);
  };

  const resetAll = () => {
    setTotalSeats(19);
    setPopulation(1800);
    setRound(1);
    setCityType('STANDARD');
    setPlmCity(undefined);
    setManualTotalVotes(1883);
    setLists([
      { id: '1', name: 'Liste A', votes: 979, averageAge: undefined },
      { id: '2', name: 'Liste B', votes: 814, averageAge: undefined },
      { id: '3', name: 'Liste C', votes: 90, averageAge: undefined },
    ]);
  };

  const populationRange = useMemo(() => getPopulationRangeFromSeats(totalSeats), [totalSeats]);

  const addList = () => {
    const newId = (Math.max(0, ...lists.map(l => parseInt(l.id))) + 1).toString();
    setLists([...lists, { id: newId, name: `Liste ${String.fromCharCode(64 + parseInt(newId))}`, votes: 0, averageAge: undefined }]);
  };

  const removeList = (id: string) => {
    setLists(lists.filter(l => l.id !== id));
  };

  const updateList = (id: string, field: keyof CandidateList, value: string | number) => {
    setLists(lists.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 md:p-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif italic tracking-tight leading-none mb-4">
              Répartition des Sièges
            </h1>
            <p className="text-sm uppercase tracking-widest opacity-60 font-mono">
              Élections Municipales • Communes de 1 000 habitants et plus
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#141414] text-[11px] uppercase tracking-widest font-mono hover:bg-yellow-400 hover:border-yellow-400 hover:text-[#141414] transition-all group"
            >
              <Lightbulb size={14} className="group-hover:scale-110 transition-transform" />
              Aide
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 border border-[#141414] text-[11px] uppercase tracking-widest font-mono hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group"
            >
              <RotateCcw size={14} className="group-hover:rotate-[-90deg] transition-transform" />
              Réinitialiser
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-[#141414] rounded-full" />
              <h2 className="font-serif italic text-xl">Type de scrutin</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-[#141414]/5 rounded-sm">
                <button
                  onClick={() => setRound(1)}
                  className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-mono transition-colors ${round === 1 ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
                >
                  1er Tour
                </button>
                <button
                  onClick={() => setRound(2)}
                  className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-mono transition-colors ${round === 2 ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
                >
                  2nd Tour
                </button>
              </div>

              <div className="flex gap-2 p-1 bg-[#141414]/5 rounded-sm">
                <button
                  onClick={() => handleCityTypeChange('STANDARD')}
                  className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-mono transition-colors ${cityType === 'STANDARD' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => handleCityTypeChange('PLM')}
                  className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-mono transition-colors ${cityType === 'PLM' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/10'}`}
                >
                  Paris, Lyon, Marseille
                </button>
              </div>

              {cityType === 'PLM' && (
                <div className="grid grid-cols-3 gap-2">
                  {['PARIS', 'LYON', 'MARSEILLE'].map(city => (
                    <button
                      key={city}
                      onClick={() => handlePlmCityChange(city)}
                      className={`py-2 text-[10px] uppercase tracking-wider font-mono border border-[#141414]/20 transition-colors ${plmCity === city ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-[#141414] rounded-full" />
              <h2 className="font-serif italic text-xl">Paramètres du scrutin</h2>
            </div>
            
            <div className="space-y-4">
              {cityType === 'STANDARD' && (
                <div className="group">
                  <label className="block text-[11px] uppercase tracking-wider opacity-50 mb-1 font-mono">
                    Population de la commune
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={population || ''}
                      onChange={(e) => handlePopulationChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Nombre d'habitants"
                      className="w-full bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none py-2 text-2xl font-mono transition-colors"
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
                      {population !== undefined && population < 1000 && (
                        <div className="text-amber-600 flex items-center gap-1 text-[10px] font-mono">
                          <AlertCircle size={12} /> Scrutin majoritaire (&lt; 1000 hab.)
                        </div>
                      )}
                      {population !== undefined && result.totalExpressedVotes > population && (
                        <div className="text-red-600 flex items-center gap-1 text-[10px] font-mono animate-pulse">
                          <AlertCircle size={12} /> Inférieur aux suffrages
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-[11px] uppercase tracking-wider opacity-50 mb-1 font-mono">
                  Nombre de sièges au conseil
                </label>
                <input
                  type="number"
                  value={totalSeats}
                  onChange={(e) => handleSeatsChange(Math.max(1, parseInt(e.target.value) || 0))}
                  disabled={cityType === 'PLM'}
                  className={`w-full bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none py-2 text-2xl font-mono transition-colors ${cityType === 'PLM' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {cityType === 'STANDARD' && populationRange && (
                  <p className="text-[9px] mt-1 opacity-40 font-mono italic">
                    {formatPopulationRange(populationRange)}
                  </p>
                )}
                {cityType === 'PLM' && plmCity && (
                  <p className="text-[9px] mt-1 opacity-40 font-mono italic">
                    Nombre de sièges fixé pour {plmCity.charAt(0) + plmCity.slice(1).toLowerCase()}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-[11px] uppercase tracking-wider opacity-50 mb-1 font-mono">
                  Total des suffrages exprimés (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={manualTotalVotes || ''}
                    onChange={(e) => setManualTotalVotes(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder={result.sumOfListVotes.toString()}
                    className="w-full bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none py-2 text-2xl font-mono transition-colors"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
                    {manualTotalVotes && manualTotalVotes < result.sumOfListVotes && (
                      <div className="text-red-600 flex items-center gap-1 text-[10px] font-mono animate-pulse">
                        <AlertCircle size={12} /> Somme des listes supérieure
                      </div>
                    )}
                    {population !== undefined && result.totalExpressedVotes > population && (
                      <div className="text-red-600 flex items-center gap-1 text-[10px] font-mono animate-pulse">
                        <AlertCircle size={12} /> Supérieur à la population
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[9px] mt-1 opacity-40 font-mono italic">
                  Si vide, la somme des listes ({result.sumOfListVotes}) sera utilisée.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#141414] rounded-full" />
                <h2 className="font-serif italic text-xl">Listes candidates</h2>
              </div>
              <button
                onClick={addList}
                className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono hover:opacity-100 opacity-60 transition-opacity"
              >
                <Plus size={14} /> Ajouter une liste
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {lists.map((list) => (
                  <motion.div
                    key={list.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-12 gap-4 items-end group"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={list.name}
                        onChange={(e) => updateList(list.id, 'name', e.target.value)}
                        placeholder="Nom de la liste"
                        className="w-full bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none py-2 font-serif italic text-lg transition-colors"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={list.votes}
                        onChange={(e) => updateList(list.id, 'votes', Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="Suffrages"
                        className="w-full bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none py-2 font-mono text-lg transition-colors"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={list.averageAge || ''}
                        onChange={(e) => updateList(list.id, 'averageAge', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Âge moy."
                        className="w-full bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none py-2 font-mono text-xs opacity-60 transition-colors"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end pb-2">
                      <button
                        onClick={() => removeList(list.id)}
                        className="text-[#141414]/20 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <div className="p-6 bg-[#141414] text-[#E4E3E0] rounded-sm space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Total Suffrages</span>
              <span className="text-2xl font-mono">{result.totalExpressedVotes}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest opacity-60 font-mono">Sièges à répartir</span>
              <span className="text-2xl font-mono">{totalSeats}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-[#141414] rounded-full" />
              <h2 className="font-serif italic text-xl">
                {result.noMajorityInFirstRound ? "Scrutin interrompu" : "Répartition finale"}
              </h2>
              {result.noMajorityInFirstRound && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  2nd Tour Requis
                </span>
              )}
            </div>

            <div className="border border-[#141414] overflow-hidden bg-white/50">
              <div className="grid grid-cols-12 bg-[#141414] text-[#E4E3E0] p-4 text-[11px] uppercase tracking-widest font-mono">
                <div className="col-span-5">Liste</div>
                <div className="col-span-2 text-right">Votes</div>
                <div className="col-span-2 text-right">%</div>
                <div className="col-span-3 text-right">Sièges</div>
              </div>
              {result.noMajorityInFirstRound ? (
                <div className="p-12 text-center space-y-6">
                  <div className="relative inline-block">
                    <AlertCircle size={48} className="mx-auto text-amber-500 opacity-40" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="font-serif italic text-2xl">Aucune majorité absolue</p>
                    <p className="text-sm opacity-60 max-w-sm mx-auto leading-relaxed">
                      Au premier tour, une liste doit obtenir plus de 50% des suffrages exprimés pour bénéficier de la prime majoritaire.
                    </p>
                  </div>
                  <button
                    onClick={() => setRound(2)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#141414] text-[#E4E3E0] text-[11px] uppercase tracking-widest font-mono hover:bg-[#141414]/90 transition-all shadow-lg"
                  >
                    Simuler le 2nd Tour <ChevronRight size={14} />
                  </button>
                </div>
              ) : result.admittedLists.map((list) => (
                <div 
                  key={list.id} 
                  className={`grid grid-cols-12 p-4 border-b border-[#141414]/10 last:border-0 items-center transition-colors ${!list.isAdmitted ? 'opacity-40 grayscale' : 'hover:bg-[#141414] hover:text-[#E4E3E0]'}`}
                >
                  <div className="col-span-5 font-serif italic text-lg flex items-center gap-2">
                    {list.name}
                    {!list.isAdmitted && <AlertCircle size={14} className="text-red-500" />}
                  </div>
                  <div className="col-span-2 text-right font-mono">{list.votes}</div>
                  <div className="col-span-2 text-right font-mono">{list.percentage.toFixed(2)}%</div>
                  <div className="col-span-3 text-right font-mono text-2xl font-bold">
                    {list.totalSeats}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-[#141414] rounded-full" />
              <h2 className="font-serif italic text-xl">Détails du calcul</h2>
            </div>

            <div className="space-y-4">
              {result.steps.map((step, idx) => (
                <details key={idx} className="group border border-[#141414]/10 rounded-sm overflow-hidden bg-white/30">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#141414]/5 transition-colors list-none">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] opacity-40">0{idx + 1}</span>
                      <h3 className="font-serif italic text-lg">{step.title}</h3>
                    </div>
                    <ChevronDown size={18} className="group-open:rotate-180 transition-transform opacity-40" />
                  </summary>
                  <div className="p-6 pt-0 border-t border-[#141414]/5 space-y-4">
                    <p className="text-sm opacity-80">{step.description}</p>
                    {step.details && (
                      <ul className="space-y-2">
                        {step.details.map((detail, dIdx) => (
                          <li key={dIdx} className="flex gap-3 text-xs font-mono opacity-60">
                            <ChevronRight size={14} className="shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto p-10 border-t border-[#141414]/10 mt-10">
        <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest font-mono opacity-40">Outil Pédagogique</p>
            <p className="text-xs italic font-serif">Conforme à l'article L. 262 du code électoral français.</p>
          </div>
          <div className="flex gap-6">
            <a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000027414969" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-mono opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1">
              Code Électoral <Info size={12} />
            </a>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#E4E3E0] border border-[#141414] shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-[#141414]/10 bg-[#141414] text-[#E4E3E0]">
                <div className="flex items-center gap-3">
                  <Lightbulb size={20} className="text-yellow-400" />
                  <h2 className="font-serif italic text-2xl">Aide au calcul</h2>
                </div>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="hover:rotate-90 transition-transform opacity-60 hover:opacity-100"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 font-sans text-[#141414]">
                <section className="space-y-3">
                  <h3 className="font-serif italic text-xl border-b border-[#141414]/10 pb-2">Les grandes lignes de la répartition</h3>
                  <p className="text-sm leading-relaxed opacity-80">
                    La répartition des sièges au conseil municipal pour les communes de 1 000 habitants et plus suit un mode de scrutin proportionnel de liste à deux tours avec prime majoritaire.
                  </p>
                </section>

                <section className="space-y-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs">01</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm uppercase tracking-wider">La Prime Majoritaire</h4>
                      <p className="text-sm opacity-70">
                        La liste arrivée en tête reçoit une prime de 50% des sièges (25% à PLM).
                      </p>
                      <ul className="text-[11px] opacity-60 list-disc pl-4 space-y-1">
                        <li><strong>1er Tour :</strong> Attribuée uniquement en cas de majorité absolue (&gt; 50%).</li>
                        <li><strong>2nd Tour :</strong> Attribuée à la liste ayant obtenu le plus de voix (majorité relative).</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs">02</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm uppercase tracking-wider">Le Seuil d'Admission</h4>
                      <p className="text-sm opacity-70">
                        Seules les listes ayant obtenu au moins 5% des suffrages exprimés participent à la répartition des sièges restants.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs">03</div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm uppercase tracking-wider">La Proportionnelle</h4>
                      <p className="text-sm opacity-70">
                        Les sièges restants sont répartis selon la règle de la plus forte moyenne.
                      </p>
                      <p className="text-[11px] opacity-60 italic">
                        Important : Pour calculer la moyenne, on divise les voix par les sièges déjà obtenus (quotient + forte moyenne), <strong>en excluant la prime majoritaire</strong>, auxquels on ajoute 1.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="p-4 bg-[#141414]/5 border-l-2 border-yellow-400 italic text-xs opacity-60 space-y-2">
                  <p>Note : En cas d'égalité de suffrages entre deux listes pour la prime majoritaire ou pour l'attribution d'un siège à la plus forte moyenne, la loi (Art. L262) prévoit que le siège est attribué à la liste dont la moyenne d'âge est la plus élevée.</p>
                  <p>Vous pouvez saisir l'âge moyen des listes dans les champs prévus à cet effet pour départager les égalités.</p>
                </div>
              </div>

              <div className="p-6 bg-[#141414]/5 border-t border-[#141414]/10 flex justify-end">
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2 bg-[#141414] text-[#E4E3E0] text-[11px] uppercase tracking-widest font-mono hover:opacity-90 transition-opacity"
                >
                  Compris
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
