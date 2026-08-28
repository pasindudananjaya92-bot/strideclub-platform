import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Heart,
  Timer,
  Flame,
  Droplets,
  Footprints,
  Compass,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const SportsScienceLab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'vdot' | 'hr' | 'riegel' | 'shoes' | 'fueling'>('vdot');

  // VDOT Calculator State
  const [vdotDistance, setVdotDistance] = useState<'5k' | '10k' | 'half' | 'marathon'>('5k');
  const [vdotMinutes, setVdotMinutes] = useState<number>(24);
  const [vdotSeconds, setVdotSeconds] = useState<number>(30);

  // Heart Rate Calculator State
  const [age, setAge] = useState<number>(28);
  const [restingHr, setRestingHr] = useState<number>(55);
  const [customMaxHr, setCustomMaxHr] = useState<number | null>(null);

  // Race Predictor State
  const [baseDistanceKm, setBaseDistanceKm] = useState<number>(5);
  const [baseTimeMinutes, setBaseTimeMinutes] = useState<number>(24);
  const [tempCelsius, setTempCelsius] = useState<number>(25);

  // Fueling Planner State
  const [eventDurationHours, setEventDurationHours] = useState<number>(2);
  const [eventDurationMins, setEventDurationMins] = useState<number>(0);
  const [runnerWeightKg, setRunnerWeightKg] = useState<number>(68);
  const [sweatRateProfile, setSweatRateProfile] = useState<'low' | 'moderate' | 'heavy'>('moderate');

  // Shoe Lifespan State
  const [shoeName, setShoeName] = useState<string>('Nike Pegasus 41');
  const [shoeLoggedKm, setShoeLoggedKm] = useState<number>(385);
  const [shoeMaxKm, setShoeMaxKm] = useState<number>(750);
  const [wearPattern, setWearPattern] = useState<'neutral' | 'overpronation' | 'supination'>('neutral');

  // --- CALCULATIONS ---

  // 1. VDOT & Training Paces Estimation
  const calculateVdotScore = () => {
    let distKm = 5;
    if (vdotDistance === '10k') distKm = 10;
    if (vdotDistance === 'half') distKm = 21.0975;
    if (vdotDistance === 'marathon') distKm = 42.195;

    const totalMinutes = vdotMinutes + vdotSeconds / 60;
    if (totalMinutes <= 0) return 40;

    const velocityMPerMin = (distKm * 1000) / totalMinutes;
    // Jack Daniels formula approximation for VO2 / VDOT
    const vo2 = -4.6 + 0.182258 * velocityMPerMin + 0.000104 * Math.pow(velocityMPerMin, 2);
    const percentMax =
      0.8 +
      0.1894393 * Math.exp(-0.012778 * totalMinutes) +
      0.2989558 * Math.exp(-0.1932605 * totalMinutes);
    const vdot = vo2 / percentMax;

    return Math.max(30, Math.min(85, Math.round(vdot * 10) / 10));
  };

  const currentVdot = calculateVdotScore();

  const getPacesFromVdot = (vdot: number) => {
    // Pace formulas in sec/km
    const easyPaceSec = Math.round(18000 / (vdot * 0.95));
    const marathonPaceSec = Math.round(15500 / (vdot * 0.95));
    const thresholdPaceSec = Math.round(14100 / (vdot * 0.95));
    const intervalPaceSec = Math.round(12800 / (vdot * 0.95));
    const repetitionPaceSec = Math.round(11600 / (vdot * 0.95));

    const formatPace = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.round(sec % 60);
      return `${m}:${s < 10 ? '0' : ''}${s} /km`;
    };

    return {
      easy: formatPace(easyPaceSec),
      marathon: formatPace(marathonPaceSec),
      threshold: formatPace(thresholdPaceSec),
      interval: formatPace(intervalPaceSec),
      repetition: formatPace(repetitionPaceSec),
    };
  };

  const trainingPaces = getPacesFromVdot(currentVdot);

  // 2. Karvonen Heart Rate Zones
  const computedMaxHr = customMaxHr || Math.round(207 - 0.7 * age);
  const heartRateReserve = Math.max(20, computedMaxHr - restingHr);

  const getKarvonenZone = (lowerPct: number, upperPct: number) => {
    const minBpm = Math.round(restingHr + heartRateReserve * lowerPct);
    const maxBpm = Math.round(restingHr + heartRateReserve * upperPct);
    return `${minBpm} - ${maxBpm} bpm`;
  };

  // 3. Pete Riegel Race Predictor with Heat Index
  const predictTime = (targetDistanceKm: number) => {
    const baseTotalMins = baseTimeMinutes;
    if (baseTotalMins <= 0) return '0:00';

    // Riegel formula: T2 = T1 * (D2/D1)^1.06
    let predictedMins = baseTotalMins * Math.pow(targetDistanceKm / baseDistanceKm, 1.06);

    // Heat penalty: above 20°C, ~1.5% slowdown per 3°C
    if (tempCelsius > 20) {
      const heatPenaltyFactor = 1 + ((tempCelsius - 20) / 3) * 0.015;
      predictedMins *= heatPenaltyFactor;
    }

    const hours = Math.floor(predictedMins / 60);
    const mins = Math.floor(predictedMins % 60);
    const secs = Math.round((predictedMins * 60) % 60);

    if (hours > 0) {
      return `${hours}h ${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // 4. Fueling calculations
  const totalEventMinutes = eventDurationHours * 60 + eventDurationMins;
  const carbsPerHour = totalEventMinutes < 75 ? 30 : totalEventMinutes < 150 ? 60 : 85;
  const totalCarbsNeeded = Math.round((carbsPerHour * totalEventMinutes) / 60);
  const gelsCount = Math.ceil(totalCarbsNeeded / 25);
  const fluidsMlPerHour = sweatRateProfile === 'low' ? 450 : sweatRateProfile === 'moderate' ? 650 : 850;
  const totalFluidsLitres = ((fluidsMlPerHour * totalEventMinutes) / 60 / 1000).toFixed(1);
  const sodiumMgPerHour = sweatRateProfile === 'low' ? 350 : sweatRateProfile === 'moderate' ? 550 : 850;

  // 5. Shoe Wear Status
  const shoePercentage = Math.min(100, Math.round((shoeLoggedKm / shoeMaxKm) * 100));
  const shoeRemainingKm = Math.max(0, shoeMaxKm - shoeLoggedKm);

  return (
    <div id="sports-science-lab-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sports Science & <span className="text-emerald-400">Biomechanics Lab</span>
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Precision physiological calculators built on peer-reviewed endurance protocols: Jack Daniels VDOT,
              Karvonen Heart Rate Reserves, Pete Riegel race predictors, and shoe biomechanics.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded-xl border border-emerald-500/30">
              Elite Lab Engine
            </span>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 flex overflow-x-auto space-x-2 border-t border-slate-800/80 pt-4 scrollbar-none">
          {[
            { id: 'vdot', label: 'VDOT Paces (Jack Daniels)', icon: Zap },
            { id: 'hr', label: 'Heart Rate Zones (Karvonen)', icon: Heart },
            { id: 'riegel', label: 'Race Predictor (Pete Riegel)', icon: Timer },
            { id: 'shoes', label: 'Shoe Wear & Biomechanics', icon: Footprints },
            { id: 'fueling', label: 'Hydration & Carb Fueling', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: VDOT & Training Paces */}
      {activeSubTab === 'vdot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-5">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-white text-base">Race Performance Input</h3>
            </div>
            <p className="text-xs text-slate-400">
              Enter your most recent personal best or benchmark race time to compute your exact physiological VDOT
              score.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Benchmark Event Distance</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '5k', label: '5 Kilometers (5K)' },
                    { id: '10k', label: '10 Kilometers (10K)' },
                    { id: 'half', label: 'Half Marathon (21.1K)' },
                    { id: 'marathon', label: 'Marathon (42.2K)' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setVdotDistance(d.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        vdotDistance === d.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Minutes</label>
                  <input
                    type="number"
                    min="10"
                    max="360"
                    value={vdotMinutes}
                    onChange={(e) => setVdotMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={vdotSeconds}
                    onChange={(e) => setVdotSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* VDOT Score Display */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                    Computed VDOT Index
                  </p>
                  <p className="text-3xl font-black text-emerald-400 font-mono">{currentVdot}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">
                    {currentVdot >= 60 ? '⚡ Elite / Sub-Elite' : currentVdot >= 48 ? '🏃 Advanced Runner' : currentVdot >= 38 ? '🥉 Intermediate' : '🌱 Emerging Runner'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results: Exact 5 Paces Card */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">Prescribed Training Paces</h3>
                <p className="text-xs text-slate-400">Scientific pace zones for each specific workout stimulus</p>
              </div>
              <span className="text-xs text-emerald-400 font-mono">Jack Daniels Formula</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  code: 'E',
                  name: 'Easy / Recovery Pace',
                  pace: trainingPaces.easy,
                  hr: '65-79% HRmax',
                  purpose: 'Builds capillary density, mitochondria, and aerobic endurance base.',
                  color: 'border-emerald-500/40 bg-emerald-500/5',
                },
                {
                  code: 'M',
                  name: 'Marathon Pace',
                  pace: trainingPaces.marathon,
                  hr: '80-87% HRmax',
                  purpose: 'Teaches glycogen preservation and race day rhythm efficiency.',
                  color: 'border-teal-500/40 bg-teal-500/5',
                },
                {
                  code: 'T',
                  name: 'Threshold / Tempo Pace',
                  pace: trainingPaces.threshold,
                  hr: '88-92% HRmax',
                  purpose: 'Elevates lactate threshold velocity; sustainable for 50-60 minutes.',
                  color: 'border-amber-500/40 bg-amber-500/5',
                },
                {
                  code: 'I',
                  name: 'Interval / VO2 Max Pace',
                  pace: trainingPaces.interval,
                  hr: '93-97% HRmax',
                  purpose: 'Maximizes maximal aerobic capacity. 3-5 minute hard repeats with rest.',
                  color: 'border-orange-500/40 bg-orange-500/5',
                },
                {
                  code: 'R',
                  name: 'Repetition / Speed Pace',
                  pace: trainingPaces.repetition,
                  hr: '98-100% HRmax',
                  purpose: 'Neuromuscular speed, economy, and stride mechanics (200m/400m reps).',
                  color: 'border-rose-500/40 bg-rose-500/5 sm:col-span-2',
                },
              ].map((p, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${p.color} transition-all hover:scale-[1.01]`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-950 text-white font-mono text-xs font-black flex items-center justify-center border border-slate-800">
                        {p.code}
                      </span>
                      <h4 className="text-xs font-bold text-white">{p.name}</h4>
                    </div>
                    <span className="text-base font-black text-white font-mono">{p.pace}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span className="font-mono text-emerald-400 font-bold">{p.hr}</span>
                    <span className="text-slate-500 truncate max-w-[60%]">{p.purpose}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Karvonen Heart Rate Zones */}
      {activeSubTab === 'hr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <h3 className="font-extrabold text-white text-base">Heart Rate Parameters</h3>
            </div>
            <p className="text-xs text-slate-400">
              The Karvonen formula accounts for Resting Heart Rate (HRR) for significantly higher accuracy than simple
              220-age calculations.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Runner Age ({age} yrs)</label>
                <input
                  type="range"
                  min="16"
                  max="75"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Resting Heart Rate ({restingHr} bpm)
                </label>
                <input
                  type="range"
                  min="35"
                  max="90"
                  value={restingHr}
                  onChange={(e) => setRestingHr(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between text-xs">
                <div>
                  <span className="text-slate-400">Max Heart Rate</span>
                  <p className="font-mono text-lg font-bold text-rose-400">{computedMaxHr} bpm</p>
                </div>
                <div>
                  <span className="text-slate-400">HR Reserve (HRR)</span>
                  <p className="font-mono text-lg font-bold text-emerald-400">{heartRateReserve} bpm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-white text-base">Karvonen Physiological Zones</h3>
            <div className="space-y-3">
              {[
                {
                  zone: 'Zone 1 (50-60% HRR)',
                  title: 'Active Recovery',
                  range: getKarvonenZone(0.5, 0.6),
                  desc: 'Flushes metabolic waste, post-race recovery runs, warm-ups.',
                  color: 'bg-emerald-500',
                },
                {
                  zone: 'Zone 2 (60-70% HRR)',
                  title: 'Aerobic Base & Fat Oxidation',
                  range: getKarvonenZone(0.6, 0.7),
                  desc: '80% of weekly volume should sit here. Maximizes mitochondrial density without neuromuscular fatigue.',
                  color: 'bg-teal-500',
                },
                {
                  zone: 'Zone 3 (70-80% HRR)',
                  title: 'Aerobic Tempo & Rhythm',
                  range: getKarvonenZone(0.7, 0.8),
                  desc: 'Marathon pace endurance, builds mental stamina and steady-state cardiac output.',
                  color: 'bg-amber-500',
                },
                {
                  zone: 'Zone 4 (80-90% HRR)',
                  title: 'Lactate Threshold (Anaerobic)',
                  range: getKarvonenZone(0.8, 0.9),
                  desc: 'Hard sustained intervals (20-40 mins). Teaches blood buffer clearance.',
                  color: 'bg-orange-500',
                },
                {
                  zone: 'Zone 5 (90-100% HRR)',
                  title: 'VO2 Max & Peak Power',
                  range: getKarvonenZone(0.9, 1.0),
                  desc: 'Sprint repeats and finishing kick. High neuromuscular fatigue.',
                  color: 'bg-rose-500',
                },
              ].map((z, i) => (
                <div key={i} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-3 h-10 rounded-full ${z.color}`}></span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{z.zone} - {z.title}</h4>
                      <p className="text-[11px] text-slate-400">{z.desc}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-black text-emerald-400 whitespace-nowrap ml-3">
                    {z.range}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Pete Riegel Race Predictor */}
      {activeSubTab === 'riegel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-teal-400" />
              <h3 className="font-extrabold text-white text-base">Pete Riegel Formula Parameters</h3>
            </div>
            <p className="text-xs text-slate-400">
              Uses the world standard formula $T_2 = T_1 \times (D_2/D_1)^{1.06}$ with ambient thermal compensation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Known Race Distance ({baseDistanceKm} km)
                </label>
                <input
                  type="range"
                  min="1"
                  max="42"
                  value={baseDistanceKm}
                  onChange={(e) => setBaseDistanceKm(parseInt(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Known Finish Time ({baseTimeMinutes} mins)
                </label>
                <input
                  type="range"
                  min="3"
                  max="300"
                  value={baseTimeMinutes}
                  onChange={(e) => setBaseTimeMinutes(parseInt(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Race Day Temperature ({tempCelsius}°C / {Math.round((tempCelsius * 9) / 5 + 32)}°F)
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={tempCelsius}
                  onChange={(e) => setTempCelsius(parseInt(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  {tempCelsius > 24 ? '⚠️ High heat penalty applied to predicted times' : '✅ Optimal thermal window'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-white text-base">Predicted Equivalent Finish Times</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: '5K Road Race', dist: 5, icon: '⚡' },
                { name: '10K Road Race', dist: 10, icon: '🔥' },
                { name: '15K Challenge', dist: 15, icon: '🏃' },
                { name: 'Half Marathon (21.1 km)', dist: 21.0975, icon: '🥉' },
                { name: 'Full Marathon (42.2 km)', dist: 42.195, icon: '🥇' },
                { name: '50K Ultra Marathon', dist: 50, icon: '⛰️' },
              ].map((race, i) => (
                <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <span>{race.icon}</span>
                      <span>{race.name}</span>
                    </span>
                    <p className="text-lg font-black text-white font-mono mt-0.5">{predictTime(race.dist)}</p>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-1 rounded-lg">
                    {race.dist} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Shoe Wear & Biomechanics */}
      {activeSubTab === 'shoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2">
              <Footprints className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-white text-base">Shoe Profile & Mileage</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Shoe Model</label>
                <input
                  type="text"
                  value={shoeName}
                  onChange={(e) => setShoeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Logged Mileage ({shoeLoggedKm} km / {shoeMaxKm} km)
                </label>
                <input
                  type="range"
                  min="0"
                  max={shoeMaxKm}
                  value={shoeLoggedKm}
                  onChange={(e) => setShoeLoggedKm(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Observed Tread Wear Pattern</label>
                <select
                  value={wearPattern}
                  onChange={(e: any) => setWearPattern(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="neutral">Neutral (Lateral heel + center/medial forefoot)</option>
                  <option value="overpronation">Overpronation (Heavy inner edge medial wear)</option>
                  <option value="supination">Underpronation / Supination (Heavy outer lateral wear)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">{shoeName} Health & Degradation</h3>
              <span className="font-mono text-xs text-emerald-400">{shoeRemainingKm} km remaining</span>
            </div>

            {/* Mileage Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    shoePercentage > 85 ? 'bg-rose-500' : shoePercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${shoePercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 km (Fresh Out of Box)</span>
                <span>{shoePercentage}% Lifespan Expended</span>
                <span>{shoeMaxKm} km (Retirement)</span>
              </div>
            </div>

            {/* Biomechanical Diagnostic */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Biomechanical Wear Analysis</span>
              </h4>
              {wearPattern === 'neutral' && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  ✅ <strong>Neutral Biomechanics:</strong> Your foot lands on the outer heel and rolls naturally inward
                  (~15%) to absorb shock evenly. Recommended shoes: Standard neutral daily trainers (Nike Pegasus, Saucony
                  Ride, Brooks Ghost, Asics Novablast).
                </p>
              )}
              {wearPattern === 'overpronation' && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  ⚠️ <strong>Excessive Pronation Detected:</strong> The foot rolls excessively inward on push-off,
                  increasing stress on the tibia and plantar fascia. Recommended shoes: Mild-to-moderate stability trainers
                  with medial posting or guide rails (Asics Kayano, Saucony Guide, Brooks Adrenaline).
                </p>
              )}
              {wearPattern === 'supination' && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  ⚠️ <strong>Underpronation / Supination:</strong> Impact force remains on the rigid outer rim of the
                  foot. Recommended shoes: High-cushion neutral trainers with maximum shock attenuation (Nike Invincible,
                  Asics Nimbus, Hoka Clifton).
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Hydration & Carb Fueling Planner */}
      {activeSubTab === 'fueling' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-sky-400" />
              <h3 className="font-extrabold text-white text-base">Fueling Demand Input</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={eventDurationHours}
                    onChange={(e) => setEventDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={eventDurationMins}
                    onChange={(e) => setEventDurationMins(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sweat Rate Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'moderate', 'heavy'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSweatRateProfile(s)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        sweatRateProfile === s
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-white text-base">Race Day Nutrition & Electrolyte Protocol</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-amber-400 font-bold">Carbohydrates</span>
                <p className="text-2xl font-black text-white font-mono mt-1">{carbsPerHour}g <span className="text-xs text-slate-400">/hr</span></p>
                <p className="text-[11px] text-slate-400 mt-1">Total {totalCarbsNeeded}g (~{gelsCount} energy gels)</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-sky-400 font-bold">Fluid Intake</span>
                <p className="text-2xl font-black text-white font-mono mt-1">{fluidsMlPerHour}ml <span className="text-xs text-slate-400">/hr</span></p>
                <p className="text-[11px] text-slate-400 mt-1">Total {totalFluidsLitres} Liters target</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Sodium Electrolytes</span>
                <p className="text-2xl font-black text-white font-mono mt-1">{sodiumMgPerHour}mg <span className="text-xs text-slate-400">/hr</span></p>
                <p className="text-[11px] text-slate-400 mt-1">Prevents hyponatremia & cramps</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-white mb-2">Recommended Intake Timeline</h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span><strong>T-15 mins:</strong> 1 Energy gel + 200ml water before start.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span><strong>Every 20 mins:</strong> 150ml-200ml electrolyte fluid sips.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span><strong>Every 40-45 mins:</strong> 1 Energy gel with water (never with sports drink to prevent GI distress).</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
