import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  CPMKCalculationResult,
  CPLCalculationResult,
  OBEAssessmentData,
} from '../types/obe';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface VisualChartsProps {
  data: OBEAssessmentData;
  cpmkResults: CPMKCalculationResult[];
  cplResults: CPLCalculationResult[];
  componentTotalAverages: Record<string, number>;
  targetBenchmark?: number;
}

export const VisualCharts: React.FC<VisualChartsProps> = ({
  data,
  cpmkResults,
  cplResults,
  componentTotalAverages,
  targetBenchmark = 75.0,
}) => {
  const [activeTab, setActiveTab] = useState<'cpmk' | 'cpl' | 'radar' | 'unit' | 'gap'>('cpmk');
  const [filterMode, setFilterMode] = useState<'all' | 'achieved' | 'unachieved'>('all');

  if (cpmkResults.length === 0 && cplResults.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-8 text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">Visualisasi Grafik Recharts</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Grafik batang capaian CPMK/CPL dan radar kompetensi akan otomatis aktif setelah berkas RPS & Nilai diunggah.
        </p>
      </div>
    );
  }

  // Filtered data for CPMK
  const cpmkChartData = cpmkResults
    .filter((item) => {
      if (filterMode === 'achieved') return item.capaianAkhir >= targetBenchmark;
      if (filterMode === 'unachieved') return item.capaianAkhir < targetBenchmark;
      return true;
    })
    .map((item) => ({
      code: item.cpmkCode,
      name: item.cpmkCode,
      fullTitle: `${item.cpmkCode}: ${item.description.slice(0, 40)}...`,
      description: item.description,
      capaian: item.capaianAkhir,
      target: targetBenchmark,
      gap: item.gap,
      isAchieved: item.isAchieved,
      persentase: item.persentaseCPMK,
    }));

  // Filtered data for CPL
  const cplChartData = cplResults
    .filter((item) => {
      if (filterMode === 'achieved') return item.capaianAkhir >= targetBenchmark;
      if (filterMode === 'unachieved') return item.capaianAkhir < targetBenchmark;
      return true;
    })
    .map((item) => ({
      code: item.cplCode,
      name: item.cplCode,
      category: item.category,
      fullTitle: `${item.cplCode} (${item.category}): ${item.description.slice(0, 45)}...`,
      description: item.description,
      capaian: item.capaianAkhir,
      target: targetBenchmark,
      gap: item.gap,
      isAchieved: item.isAchieved,
    }));

  // Radar Data (Combined CPMK & CPL)
  const radarData = [
    ...cpmkResults.map((c) => ({
      subject: c.cpmkCode,
      capaian: c.capaianAkhir,
      target: targetBenchmark,
      type: 'CPMK',
    })),
    ...cplResults.map((c) => ({
      subject: c.cplCode,
      capaian: c.capaianAkhir,
      target: targetBenchmark,
      type: 'CPL',
    })),
  ];

  // Unit Classes Component Comparison Data
  const unitComparisonData = data.components.map((comp) => {
    const item: Record<string, any> = {
      name: comp.name.length > 20 ? comp.name.slice(0, 18) + '...' : comp.name,
      fullName: comp.name,
      Gabungan: componentTotalAverages[comp.id] ?? 0,
    };
    data.unitClasses.forEach((unit, idx) => {
      item[unit.name || `Unit ${idx + 1}`] = unit.componentAverages[comp.id] ?? 0;
    });
    return item;
  });

  const unitColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

  // Metrics summary
  const cpmkAchievedCount = cpmkResults.filter((c) => c.isAchieved).length;
  const cplAchievedCount = cplResults.filter((c) => c.isAchieved).length;
  const maxGapItem = [...cpmkResults].sort((a, b) => b.gap - a.gap)[0];
  const minGapItem = [...cpmkResults].sort((a, b) => a.gap - b.gap)[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      {/* Header Visualizer */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Modul Visualisasi Recharts • OBE Analytics</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Analisis Ketercapaian CPL & CPMK vs Target {targetBenchmark.toFixed(2)}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Visualisasi gap kinerja capaian pembelajaran mata kuliah terhadap target mutu kelulusan (Default: 75.00).
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-300 block">Ketercapaian CPMK</span>
              <span className="text-base font-bold text-emerald-400">
                {cpmkAchievedCount}/{cpmkResults.length}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({((cpmkAchievedCount / Math.max(1, cpmkResults.length)) * 100).toFixed(0)}% Lulus)
              </span>
            </div>
            <div className="text-center px-2 border-l border-white/10">
              <span className="text-[11px] text-slate-300 block">Ketercapaian CPL</span>
              <span className="text-base font-bold text-sky-400">
                {cplAchievedCount}/{cplResults.length}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({((cplAchievedCount / Math.max(1, cplResults.length)) * 100).toFixed(0)}% Lulus)
              </span>
            </div>
            <div className="text-center px-2 border-l border-white/10">
              <span className="text-[11px] text-slate-300 block">Gap Tertinggi</span>
              <span className="text-base font-bold text-emerald-300 flex items-center justify-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {maxGapItem ? `${maxGapItem.gap > 0 ? '+' : ''}${maxGapItem.gap}%` : '-'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[80px]">
                {maxGapItem?.cpmkCode}
              </span>
            </div>
            <div className="text-center px-2 border-l border-white/10">
              <span className="text-[11px] text-slate-300 block">Defisit Terendah</span>
              <span
                className={`text-base font-bold flex items-center justify-center gap-0.5 ${
                  minGapItem && minGapItem.gap < 0 ? 'text-rose-400' : 'text-emerald-300'
                }`}
              >
                {minGapItem && minGapItem.gap < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                {minGapItem ? `${minGapItem.gap > 0 ? '+' : ''}${minGapItem.gap}%` : '-'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[80px]">
                {minGapItem?.cpmkCode}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
          <div className="flex flex-wrap gap-1 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('cpmk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'cpmk'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Diagram Batang CPMK</span>
            </button>
            <button
              onClick={() => setActiveTab('cpl')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'cpl'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Diagram Batang CPL</span>
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Radar Kompetensi OBE</span>
            </button>
            <button
              onClick={() => setActiveTab('unit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'unit'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Komparasi Antar Unit</span>
            </button>
            <button
              onClick={() => setActiveTab('gap')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'gap'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Matriks Gap Analisis</span>
            </button>
          </div>

          {/* Filter Chips (for CPMK and CPL) */}
          {(activeTab === 'cpmk' || activeTab === 'cpl') && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1 text-[11px]">Filter:</span>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterMode === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterMode('achieved')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  filterMode === 'achieved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ≥ {targetBenchmark}
              </button>
              <button
                onClick={() => setFilterMode('unachieved')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  filterMode === 'unachieved'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-300" />
                &lt; {targetBenchmark}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-6">
        {/* Tab 1: CPMK Bar Chart */}
        {activeTab === 'cpmk' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  Capaian Akhir Setiap CPMK vs Garis Target Benchmark ({targetBenchmark.toFixed(2)})
                </h4>
                <p className="text-xs text-slate-500">
                  Warna hijau menunjukkan CPMK mencapai/melampaui target. Warna merah/amber menunjukkan CPMK belum memenuhi target (memerlukan tindakan CQI).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                  Tercapai (≥ {targetBenchmark})
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                  Belum Tercapai (&lt; {targetBenchmark})
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500 inline-block" />
                  Target ({targetBenchmark})
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cpmkChartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    label={{
                      value: 'Persentase Nilai (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#64748b', fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs max-w-xs border border-slate-700">
                            <p className="font-bold text-sm text-indigo-300">{d.code}</p>
                            <p className="text-slate-300 mt-1 line-clamp-2">{d.description}</p>
                            <div className="mt-3 pt-2 border-t border-slate-700 space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Skor Capaian:</span>
                                <span className="font-bold text-white text-sm">{d.capaian}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Target Mutu:</span>
                                <span className="font-semibold text-slate-300">{d.target}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Gap (Selisih):</span>
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                    d.gap >= 0
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                                      : 'bg-rose-950 text-rose-400 border border-rose-700'
                                  }`}
                                >
                                  {d.gap > 0 ? `+${d.gap}` : d.gap}%
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400">Status Mutu:</span>
                                <span
                                  className={`font-semibold ${
                                    d.isAchieved ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {d.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={targetBenchmark}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `Target: ${targetBenchmark.toFixed(2)}%`,
                      position: 'top',
                      fill: '#dc2626',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar
                    dataKey="capaian"
                    name="Capaian Tiap CPMK"
                    radius={[6, 6, 0, 0]}
                    barSize={48}
                  >
                    {cpmkChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.capaian >= targetBenchmark ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: CPL Bar Chart */}
        {activeTab === 'cpl' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  Agregasi Ketercapaian Capaian Pembelajaran Lulusan (CPL) vs Target {targetBenchmark.toFixed(2)}
                </h4>
                <p className="text-xs text-slate-500">
                  Nilai akumulatif dari seluruh CPMK yang dibebankan pada masing-masing rumusan CPL prodi.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                  CPL Memenuhi Target (≥ {targetBenchmark})
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                  CPL Di Bawah Target (&lt; {targetBenchmark})
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500 inline-block" />
                  Target ({targetBenchmark})
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cplChartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    label={{
                      value: 'Persentase Capaian CPL (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: '#64748b', fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs max-w-xs border border-slate-700">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-sky-400">{d.code}</span>
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                {d.category}
                              </span>
                            </div>
                            <p className="text-slate-300 mt-1 line-clamp-2">{d.description}</p>
                            <div className="mt-3 pt-2 border-t border-slate-700 space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Skor Capaian CPL:</span>
                                <span className="font-bold text-white text-sm">{d.capaian}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Target Mutu:</span>
                                <span className="font-semibold text-slate-300">{d.target}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Gap Delta:</span>
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                    d.gap >= 0
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                                      : 'bg-rose-950 text-rose-400 border border-rose-700'
                                  }`}
                                >
                                  {d.gap > 0 ? `+${d.gap}` : d.gap}%
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400">Status Mutu:</span>
                                <span
                                  className={`font-semibold ${
                                    d.isAchieved ? 'text-emerald-400' : 'text-amber-400'
                                  }`}
                                >
                                  {d.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={targetBenchmark}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `Target: ${targetBenchmark.toFixed(2)}%`,
                      position: 'top',
                      fill: '#dc2626',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar
                    dataKey="capaian"
                    name="Capaian CPL"
                    radius={[6, 6, 0, 0]}
                    barSize={54}
                  >
                    {cplChartData.map((entry, index) => (
                      <Cell
                        key={`cell-cpl-${index}`}
                        fill={entry.capaian >= targetBenchmark ? '#3b82f6' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: Radar Chart */}
        {activeTab === 'radar' && (
          <div>
            <div className="mb-4">
              <h4 className="text-base font-semibold text-slate-900">
                Peta Radar Spider Web: Kompetensi CPMK & CPL vs Poligon Target Mutu
              </h4>
              <p className="text-xs text-slate-500">
                Membandingkan profil ketercapaian seluruh parameter kompetensi sekaligus untuk melihat keseimbangan kurikulum dan titik defisit.
              </p>
            </div>

            <div className="h-88 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Capaian Riil Mahasiswa (%)"
                    dataKey="capaian"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name={`Target Standar (${targetBenchmark.toFixed(2)}%)`}
                    dataKey="target"
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    fill="#ef4444"
                    fillOpacity={0.1}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '15px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4: Multi-Unit Class Comparison */}
        {activeTab === 'unit' && (
          <div>
            <div className="mb-4">
              <h4 className="text-base font-semibold text-slate-900">
                Komparasi Kinerja Penilaian Antar Unit / Kelas Mahasiswa
              </h4>
              <p className="text-xs text-slate-500">
                Evaluasi konsistensi nilai antar kelas paralel ({data.unitClasses.length} Unit Kelas) terhadap rata-rata gabungan pada setiap unsur penilaian.
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={unitComparisonData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <ReferenceLine
                    y={targetBenchmark}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Target: ${targetBenchmark}%`,
                      position: 'top',
                      fill: '#dc2626',
                      fontSize: 11,
                    }}
                  />
                  {data.unitClasses.map((unit, idx) => (
                    <Bar
                      key={unit.id}
                      dataKey={unit.name || `Unit ${idx + 1}`}
                      fill={unitColors[idx % unitColors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                  <Bar
                    dataKey="Gabungan"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth={1}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5: Detailed Gap Matrix Table */}
        {activeTab === 'gap' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-base font-semibold text-slate-900">
                Matriks Analisis Gap & Disparitas Capaian (CPMK & CPL)
              </h4>
              <p className="text-xs text-slate-500">
                Rincian numerik selisih (Delta Gap) terhadap target {targetBenchmark.toFixed(2)}. Selisih negatif menunjukkan area prioritas perbaikan (CQI).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPMK Gap Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                  <span>Tabel Gap Capaian CPMK</span>
                  <span className="text-[11px] text-slate-500">Target: {targetBenchmark}%</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Kode CPMK</th>
                        <th className="py-2.5 px-3 text-center">Bobot</th>
                        <th className="py-2.5 px-3 text-right">Capaian</th>
                        <th className="py-2.5 px-3 text-center">Delta Gap</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cpmkResults.map((c) => (
                        <tr key={c.cpmkCode} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {c.cpmkCode}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500">
                            {c.persentaseCPMK}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                            {c.capaianAkhir.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                c.gap >= 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {c.gap > 0 ? `+${c.gap}` : c.gap}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                c.isAchieved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {c.isAchieved ? 'Tercapai' : 'Perlu CQI'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CPL Gap Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
                  <span>Tabel Gap Capaian CPL</span>
                  <span className="text-[11px] text-slate-500">Target: {targetBenchmark}%</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Kode CPL</th>
                        <th className="py-2.5 px-3">Ranah</th>
                        <th className="py-2.5 px-3 text-right">Capaian</th>
                        <th className="py-2.5 px-3 text-center">Delta Gap</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cplResults.map((c) => (
                        <tr key={c.cplCode} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{c.cplCode}</td>
                          <td className="py-2.5 px-3 text-slate-500">{c.category}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                            {c.capaianAkhir.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                c.gap >= 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {c.gap > 0 ? `+${c.gap}` : c.gap}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                c.isAchieved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.isAchieved ? 'Tercapai' : 'Di Bawah Target'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Insight */}
      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Target Acuan OBE: <strong>{targetBenchmark.toFixed(2)}%</strong> (Standar Akreditasi Internasional & Nasional)
          </span>
        </div>
        <div className="text-slate-500 italic">
          Data visual disinkronkan langsung dari hasil kalkulasi 6 tahap asesmen.
        </div>
      </div>
    </div>
  );
};
