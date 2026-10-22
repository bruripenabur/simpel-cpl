import React from 'react';
import { CPMKCalculationResult, OBEAssessmentData } from '../types/obe';
import { Calculator, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';

interface Stage5Props {
  data: OBEAssessmentData;
  cpmkResults: CPMKCalculationResult[];
  targetBenchmark?: number;
}

export const Stage5CPMKCalculation: React.FC<Stage5Props> = ({
  data,
  cpmkResults,
  targetBenchmark = 75.0,
}) => {
  const achievedCount = cpmkResults.filter((c) => c.isAchieved).length;
  const passRate = ((achievedCount / Math.max(1, cpmkResults.length)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold mb-1 border border-amber-200">
              <Calculator className="w-3.5 h-3.5" />
              <span>TAHAP 5: PERHITUNGAN KETERCAPAIAN CPMK (Kalkulasi)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Assesment & Perhitungan Ketercapaian Capaian Pembelajaran Mata Kuliah
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dihitung berdasarkan rumus baku normalisasi capaian OBE terhadap target mutu {targetBenchmark.toFixed(2)}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-right">
              <span className="text-[11px] text-slate-500 block">Ketercapaian CPMK</span>
              <span className="text-sm font-extrabold text-slate-900">
                {achievedCount} dari {cpmkResults.length} CPMK ({passRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* Rumus Highlight Box */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Rumus Baku Asesmen CPMK (Outcome Based Education):
            </span>
            <div className="font-mono text-base font-bold text-emerald-300 mt-1">
              Capaian Tiap CPMK = (Nilai Awal CPMK × 100%) / (Persentase Bobot CPMK)
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Di mana <em>Nilai Awal CPMK</em> = ∑ (Rata-rata Komponen Penilaian × Bobot Komponen pada CPMK) / 100.
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/10 text-center shrink-0">
            <span className="text-[11px] text-slate-300 block">Target Acuan</span>
            <span className="text-lg font-extrabold text-white">{targetBenchmark.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Tabel Rincian Capaian CPMK */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-28">Kode CPMK</th>
                <th className="py-3 px-6">Deskripsi Capaian Pembelajaran</th>
                <th className="py-3 px-3 text-center w-28">Bobot CPMK</th>
                <th className="py-3 px-4 text-center w-36">Nilai Awal CPMK</th>
                <th className="py-3 px-4 text-center w-36 bg-indigo-50/50">Skor Capaian (%)</th>
                <th className="py-3 px-3 text-center w-28">Target Mutu</th>
                <th className="py-3 px-3 text-center w-28">Delta Gap</th>
                <th className="py-3 px-4 text-center w-36">Status Ketercapaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cpmkResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada data perhitungan capaian CPMK. Silakan unggah berkas RPS dan Nilai terlebih dahulu.
                  </td>
                </tr>
              ) : (
                cpmkResults.map((item) => (
                  <tr key={item.cpmkCode} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-indigo-700 text-sm">
                      {item.cpmkCode}
                    </td>
                  <td className="py-3.5 px-6 text-slate-700">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    {/* Unsur kontributor collapse mini */}
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                      {item.componentContributions.map((cc) => (
                        <span
                          key={cc.componentId}
                          className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                        >
                          {cc.componentName}: avg {cc.componentAvg.toFixed(1)} × {cc.weightAllocated}% = {cc.contribution.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                    {item.persentaseCPMK}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700 font-mono">
                    {item.nilaiAwalCPMK.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-sm text-indigo-900 bg-indigo-50/40 font-mono">
                    {item.capaianAkhir.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-600">
                    {item.target.toFixed(2)}%
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                        item.gap >= 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.gap >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-rose-600" />
                      )}
                      {item.gap > 0 ? `+${item.gap.toFixed(2)}` : item.gap.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.isAchieved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {item.isAchieved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TERCAPAI
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> BELUM TERCAPAI
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
