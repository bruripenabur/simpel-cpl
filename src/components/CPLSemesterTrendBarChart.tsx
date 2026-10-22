import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface SemesterCPLData {
  semesterId: string;
  semesterLabel: string;
  cpl01: number; // Sikap
  cpl02: number; // Pengetahuan
  cpl03: number; // Keterampilan Umum
  cpl04: number; // Keterampilan Khusus
  cpl05: number; // Inovasi / Wirausaha
  agregat: number; // Rata-rata keseluruhan
}

interface CPLSemesterTrendBarChartProps {
  studyProgramName?: string;
  targetBenchmark?: number;
}

export const CPLSemesterTrendBarChart: React.FC<CPLSemesterTrendBarChartProps> = ({
  studyProgramName = 'S1 Budidaya Perairan',
  targetBenchmark = 75.0,
}) => {
  // Default data tren 5 semester terakhir
  const initialSemesterData: SemesterCPLData[] = [
    {
      semesterId: '2024-1',
      semesterLabel: 'Ganjil 2024/2025',
      cpl01: 72.4,
      cpl02: 68.5,
      cpl03: 74.0,
      cpl04: 70.2,
      cpl05: 66.0,
      agregat: 70.2,
    },
    {
      semesterId: '2024-2',
      semesterLabel: 'Genap 2024/2025',
      cpl01: 74.0,
      cpl02: 71.0,
      cpl03: 75.5,
      cpl04: 72.8,
      cpl05: 69.5,
      agregat: 72.6,
    },
    {
      semesterId: '2025-1',
      semesterLabel: 'Ganjil 2025/2026',
      cpl01: 76.5,
      cpl02: 73.8,
      cpl03: 77.2,
      cpl04: 75.0,
      cpl05: 72.0,
      agregat: 74.9,
    },
    {
      semesterId: '2025-2',
      semesterLabel: 'Genap 2025/2026',
      cpl01: 78.2,
      cpl02: 76.0,
      cpl03: 79.0,
      cpl04: 77.5,
      cpl05: 74.8,
      agregat: 77.1,
    },
    {
      semesterId: '2026-1',
      semesterLabel: 'Ganjil 2026/2027 (Berjalan)',
      cpl01: 80.5,
      cpl02: 78.4,
      cpl03: 81.2,
      cpl04: 79.8,
      cpl05: 77.0,
      agregat: 79.4,
    },
  ];

  const [activeFilter, setActiveFilter] = useState<'all' | 'cpl01' | 'cpl02' | 'cpl03' | 'cpl04' | 'cpl05' | 'agregat'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'single'>('grouped');

  // Metadata CPL
  const cplMetadata = [
    { key: 'cpl01', label: 'CPL-01 (Sikap & Etika)', color: '#3b82f6', category: 'Sikap' },
    { key: 'cpl02', label: 'CPL-02 (Penguasaan Teori)', color: '#6366f1', category: 'Pengetahuan' },
    { key: 'cpl03', label: 'CPL-03 (Keterampilan Analisis)', color: '#10b981', category: 'Keterampilan Umum' },
    { key: 'cpl04', label: 'CPL-04 (Praktik & Rekayasa Lapangan)', color: '#f59e0b', category: 'Keterampilan Khusus' },
    { key: 'cpl05', label: 'CPL-05 (Inovasi & Wirausaha)', color: '#8b5cf6', category: 'Keterampilan Khusus' },
  ];

  // Hitung delta pertumbuhan agregat dari semester pertama ke semester berjalan
  const firstSemester = initialSemesterData[0];
  const latestSemester = initialSemesterData[initialSemesterData.length - 1];
  const deltaGrowth = Number((latestSemester.agregat - firstSemester.agregat).toFixed(1));
  const isTargetAchieved = latestSemester.agregat >= targetBenchmark;

  // Custom Tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <p className="font-bold text-sky-300 border-b border-slate-700 pb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-mono font-bold text-white">{Number(entry.value).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Standar Benchmark:</span>
            <span className="font-bold text-rose-400 font-mono">{targetBenchmark}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-6">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Audit Evaluasi Mutu Kurikulum Berkala (Pasal 72)</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Tren Ketercapaian CPL Antar-Semester (Diagram Batang / Bar Chart)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
            Visualisasi longitudinal capaian 5 ranah CPL lulusan per semester pada <strong>{studyProgramName}</strong>. Memungkinkan Kaprodi memantau efektivitas perbaikan kurikulum secara agregat dan berkesinambungan (CQI).
          </p>
        </div>

        {/* Aggregate KPI Badges */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Capaian Terkini</span>
            <span className="text-sm font-extrabold text-indigo-700 font-mono">{latestSemester.agregat}%</span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">Tren Pertumbuhan</span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono flex items-center justify-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{deltaGrowth}%
            </span>
          </div>

          <div className={`px-3 py-2 rounded-xl border text-center ${
            isTargetAchieved ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className="text-[10px] font-bold uppercase block">Status Benchmark ({targetBenchmark}%)</span>
            <span className="text-xs font-bold block mt-0.5">
              {isTargetAchieved ? '✓ Tercapai & Melampaui' : '⚠️ Defisit Standar'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Tampilkan Ranah:</span>
          </span>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua CPL (5 Batang)
          </button>
          <button
            onClick={() => setActiveFilter('agregat')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeFilter === 'agregat'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rata-rata Agregat Kurikulum
          </button>
          {cplMetadata.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveFilter(c.key as any)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === c.key
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.key.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 shrink-0">
          *Garis merah putus-putus menunjukkan <strong>Target Benchmark ({targetBenchmark}%)</strong>
        </div>
      </div>

      {/* Diagram Batang (Recharts Bar Chart) */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={initialSemesterData}
            margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
            barGap={4}
            barCategoryGap={20}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="semesterLabel"
              tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={[50, 100]}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            
            {/* Reference Line Target Benchmark */}
            <ReferenceLine
              y={targetBenchmark}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Target Standar (${targetBenchmark}%)`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />

            {/* Bars based on filter */}
            {activeFilter === 'all' && (
              <>
                <Bar dataKey="cpl01" name="CPL-01 (Sikap)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cpl02" name="CPL-02 (Pengetahuan)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cpl03" name="CPL-03 (Keterampilan Umum)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cpl04" name="CPL-04 (Keterampilan Khusus)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cpl05" name="CPL-05 (Inovasi & Wirausaha)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </>
            )}

            {activeFilter === 'agregat' && (
              <Bar dataKey="agregat" name="Rata-rata Agregat Kurikulum (%)" fill="#059669" radius={[6, 6, 0, 0]}>
                {initialSemesterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.agregat >= targetBenchmark ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            )}

            {activeFilter !== 'all' && activeFilter !== 'agregat' && (
              <Bar
                dataKey={activeFilter}
                name={cplMetadata.find((c) => c.key === activeFilter)?.label || activeFilter.toUpperCase()}
                fill={cplMetadata.find((c) => c.key === activeFilter)?.color || '#6366f1'}
                radius={[6, 6, 0, 0]}
              >
                {initialSemesterData.map((entry, index) => {
                  const val = entry[activeFilter as keyof SemesterCPLData] as number;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={val >= targetBenchmark ? '#4f46e5' : '#e11d48'}
                    />
                  );
                })}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rincian Tabel Komparasi Semester & Analisis Peningkatan (CQI) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Tabel Matriks Pertumbuhan Capaian CPL Antar-Semester (Siklus PPEPP)</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">Satuan: Persentase (%)</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Periode Semester</th>
                <th className="py-2.5 px-2 text-center">CPL-01 (Sikap)</th>
                <th className="py-2.5 px-2 text-center">CPL-02 (Teori)</th>
                <th className="py-2.5 px-2 text-center">CPL-03 (Analisis)</th>
                <th className="py-2.5 px-2 text-center">CPL-04 (Praktik)</th>
                <th className="py-2.5 px-2 text-center">CPL-05 (Inovasi)</th>
                <th className="py-2.5 px-3 text-center bg-indigo-50 text-indigo-950">Rata-rata Agregat</th>
                <th className="py-2.5 px-3 text-center">Status Kelulusan Mutu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {initialSemesterData.map((row, idx) => {
                const prevRow = idx > 0 ? initialSemesterData[idx - 1] : null;
                const deltaFromPrev = prevRow ? Number((row.agregat - prevRow.agregat).toFixed(1)) : 0;
                const isPassed = row.agregat >= targetBenchmark;

                return (
                  <tr key={row.semesterId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                      {row.semesterLabel}
                    </td>
                    <td className="py-2.5 px-2 text-center">{row.cpl01.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-center">{row.cpl02.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-center">{row.cpl03.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-center">{row.cpl04.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-center">{row.cpl05.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-center bg-indigo-50/60 font-extrabold text-indigo-900">
                      <span>{row.agregat.toFixed(1)}%</span>
                      {idx > 0 && (
                        <span className="text-[10px] text-emerald-600 ml-1.5 font-bold">
                          (+{deltaFromPrev}%)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isPassed ? '✓ Memenuhi Standar' : '⚠️ Defisit Kurikulum'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
