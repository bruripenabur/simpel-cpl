import React from 'react';
import { CPLCalculationResult, OBEAssessmentData } from '../types/obe';
import { Award, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface Stage6Props {
  data: OBEAssessmentData;
  cplResults: CPLCalculationResult[];
  targetBenchmark?: number;
}

export const Stage6CPLCalculation: React.FC<Stage6Props> = ({
  data,
  cplResults,
  targetBenchmark = 75.0,
}) => {
  const achievedCount = cplResults.filter((c) => c.isAchieved).length;
  const passRate = ((achievedCount / Math.max(1, cplResults.length)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1 border border-indigo-200">
              <Award className="w-3.5 h-3.5" />
              <span>TAHAP 6: PERHITUNGAN KETERCAPAIAN CPL (Kalkulasi)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Agregasi Nilai CPMK ke Capaian Pembelajaran Lulusan (CPL)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Setiap butir CPL dihitung dari kontribusi seluruh CPMK pendukung yang dibebankan pada kurikulum prodi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-right">
              <span className="text-[11px] text-slate-500 block">Ketercapaian CPL</span>
              <span className="text-sm font-extrabold text-slate-900">
                {achievedCount} dari {cplResults.length} CPL ({passRate}%)
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl mt-4 text-xs text-blue-900">
          <p className="font-semibold">
            Standar Audit Akademik (LAM / BAN-PT):
          </p>
          <p className="mt-0.5 text-blue-800">
            Nilai CPL tidak diestimasi secara kasar, melainkan dihitung secara matematis melalui penjumlahan kontribusi tertimbang setiap CPMK: <code>CPL = ∑ (Skor CPMK_i × Bobot Kontribusi CPMK_i terhadap CPL)</code>. Rincian agregasi setiap CPMK disajikan secara lengkap di bawah ini.
          </p>
        </div>
      </div>

      {/* Tabel Ketercapaian CPL dengan Rincian Tiap CPMK */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-28">Kode CPL</th>
                <th className="py-3 px-3 w-36">Ranah</th>
                <th className="py-3 px-4 min-w-[220px]">Deskripsi Rumusan CPL</th>
                <th className="py-3 px-6 min-w-[280px] bg-slate-200/50">
                  Rincian Agregasi Nilai per CPMK Penyusun
                </th>
                <th className="py-3 px-4 text-center w-36 bg-indigo-50/60">
                  Skor Akhir CPL (%)
                </th>
                <th className="py-3 px-3 text-center w-28">Target Mutu</th>
                <th className="py-3 px-3 text-center w-28">Delta Gap</th>
                <th className="py-3 px-4 text-center w-36">Status Mutu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cplResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada data capaian CPL. Silakan unggah berkas RPS dan Nilai terlebih dahulu.
                  </td>
                </tr>
              ) : (
                cplResults.map((item) => (
                  <tr key={item.cplCode} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-indigo-700 text-sm">
                      {item.cplCode}
                    </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 leading-relaxed font-medium">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-6 bg-slate-50/50">
                    {item.contributingCPMKs.length > 0 ? (
                      <div className="space-y-1.5">
                        {item.contributingCPMKs.map((cc) => (
                          <div
                            key={cc.cpmkCode}
                            className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-[11px]"
                          >
                            <span className="font-bold text-slate-800">
                              {cc.cpmkCode}{' '}
                              <span className="font-normal text-slate-500">
                                (Bobot: {cc.weightInCPL}%)
                              </span>
                            </span>
                            <div className="font-mono text-slate-700">
                              <span>Skor {cc.cpmkScore.toFixed(2)}%</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <strong className="text-indigo-700 font-bold">
                                {cc.contribution.toFixed(2)}%
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Tidak ada CPMK langsung</span>
                    )}
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
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {item.isAchieved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> TERCAPAI
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> BELUM TERCAPAI
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
