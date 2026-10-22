import React, { useState } from 'react';
import { OBEAssessmentData } from '../types/obe';
import { Grid3X3, CheckCircle2, AlertCircle, Info, Sparkles, RotateCcw, Check } from 'lucide-react';
import { autoDistributeAssessmentWeights } from '../utils/weightDistributor';

interface Stage3Props {
  data: OBEAssessmentData;
  onUpdate: (updated: Partial<OBEAssessmentData>) => void;
}

export const Stage3WeightMapping: React.FC<Stage3Props> = ({ data, onUpdate }) => {
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleWeightCellChange = (componentIndex: number, cpmkCode: string, value: number) => {
    const nextComponents = [...data.components];
    const comp = { ...nextComponents[componentIndex] };
    const nextCpmkWeights = { ...(comp.cpmkWeights || {}) };

    if (value <= 0) {
      delete nextCpmkWeights[cpmkCode];
    } else {
      nextCpmkWeights[cpmkCode] = value;
    }

    comp.cpmkWeights = nextCpmkWeights;
    nextComponents[componentIndex] = comp;
    onUpdate({ components: nextComponents });
  };

  const handleAutoDistribute = (randomize: boolean = false) => {
    try {
      const comps = data?.components || [];
      const cpmks = data?.cpmks || [];
      if (comps.length === 0 || cpmks.length === 0) {
        showToast('Data komponen atau CPMK belum lengkap.');
        return;
      }
      const distributed = autoDistributeAssessmentWeights(comps, cpmks, randomize);
      onUpdate({ components: distributed });
      showToast(
        randomize
          ? 'Matriks bobot berhasil diisi secara acak & seimbang (Target CPMK tetap terjaga, Total 100%)!'
          : 'Matriks bobot berhasil diisi otomatis secara proporsional (Grand Total: 100%)!'
      );
    } catch (err) {
      console.error('Error during auto distribute weight matrix:', err);
      showToast('Gagal mengisi otomatis matriks bobot. Silakan periksa kembali bobot komponen dan CPMK.');
    }
  };

  const handleClearMatrix = () => {
    try {
      const comps = data?.components || [];
      const cleared = comps.map((c) => ({
        ...c,
        cpmkWeights: {},
      }));
      onUpdate({ components: cleared });
      showToast('Seluruh sel matriks bobot telah dikosongkan.');
    } catch (err) {
      console.error('Error during clear matrix:', err);
    }
  };

  // Calculate Column Totals (CPMK sums from components)
  const cpmkColumnSums: Record<string, number> = {};
  const safeCpmks = data?.cpmks || [];
  const safeComponents = data?.components || [];

  safeCpmks.forEach((cpmk) => {
    cpmkColumnSums[cpmk.code] = 0;
  });

  safeComponents.forEach((comp) => {
    safeCpmks.forEach((cpmk) => {
      const val = comp.cpmkWeights?.[cpmk.code] || 0;
      cpmkColumnSums[cpmk.code] = Number((cpmkColumnSums[cpmk.code] + val).toFixed(2));
    });
  });

  // Calculate Row Totals (Component sums across CPMKs)
  const componentRowSums = safeComponents.map((comp) => {
    let sum = 0;
    safeCpmks.forEach((cpmk) => {
      sum += comp.cpmkWeights?.[cpmk.code] || 0;
    });
    return Number(sum.toFixed(2));
  });

  const grandTotal = Object.values(cpmkColumnSums).reduce((acc, val) => acc + val, 0);
  const isGrandTotalValid = Math.abs(grandTotal - 100) < 0.1;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold mb-1 border border-purple-200">
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>TAHAP 3: PEMETAAN BOBOT PERSENTASE UNSUR PENILAIAN TERHADAP CPMK</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Matriks Distribusi Bobot Asesmen ke Capaian Pembelajaran Mata Kuliah
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Setiap butir penilaian dihubungkan ke CPMK yang diukurnya secara spesifik (Total = 100%).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAutoDistribute(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              title="Isi otomatis nilai matriks bobot secara acak dengan tetap mempertahankan target bobot masing-masing CPMK dan komponen"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Isi Otomatis / Acak Bobot (Target Tetap)</span>
            </button>

            <button
              onClick={() => handleAutoDistribute(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              title="Isi matriks bobot secara proporsional"
            >
              <span>Proporsional Rata</span>
            </button>

            <button
              onClick={handleClearMatrix}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              title="Kosongkan seluruh nilai pada matriks bobot"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>

            {isGrandTotalValid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Matriks Seimbang ({grandTotal.toFixed(0)}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Total Matriks: {grandTotal.toFixed(1)}% (Harus 100%)
              </span>
            )}
          </div>
        </div>

        {/* Empty Matrix Prompt */}
        {grandTotal === 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 font-bold block mb-0.5">
                  RPS Belum Memuat Rincian Matriks Bobot Asesmen ke CPMK?
                </strong>
                <span>
                  Sistem dapat mengisi matriks secara otomatis dan acak dengan tetap <strong>mempertahankan target masing-masing CPMK</strong> ({data.cpmks.map((c) => `${c.code}: ${c.weight}%`).join(', ')}). Setelah diisi, Anda dapat menyesuaikan dan mengedit angka pada tiap sel sesuai kebutuhan.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleAutoDistribute(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Isi Otomatis / Acak Sekarang</span>
            </button>
          </div>
        )}

        <div className="flex items-start gap-2 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 mt-4 text-xs text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            <strong>Prinsip OBE Auditor:</strong> Jumlah persentase per baris harus sama dengan bobot komponen penilaian (Tahap 2), dan jumlah persentase per kolom harus sesuai dengan bobot capaian CPMK yang ditetapkan pada RPS (Tahap 1). Anda dapat mengedit setiap angka secara bebas.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Matriks Penilaian vs CPMK */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Unsur Penilaian</th>
                <th className="py-3 px-3 text-center w-28 bg-slate-200/60 text-slate-800 font-bold">
                  Bobot Unsur (%)
                </th>
                {data.cpmks.map((cpmk) => (
                  <th key={cpmk.code} className="py-3 px-3 text-center min-w-[100px]">
                    <div className="font-bold text-indigo-700">{cpmk.code}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      (Target: {cpmk.weight}%)
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center w-28 font-bold text-slate-800">
                  Total Baris
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.components.length === 0 || data.cpmks.length === 0 ? (
                <tr>
                  <td colSpan={data.cpmks.length + 4} className="py-8 text-center text-slate-400">
                    Belum ada data komponen atau CPMK untuk dipetakan. Silakan unggah berkas RPS terlebih dahulu.
                  </td>
                </tr>
              ) : (
                data.components.map((comp, compIdx) => {
                  const rowSum = componentRowSums[compIdx];
                  const isRowMatch = Math.abs(rowSum - comp.weight) < 0.1;

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-500">{compIdx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{comp.name}</td>
                      <td className="py-3 px-3 text-center font-bold bg-slate-50 text-slate-800">
                        {comp.weight}%
                      </td>
                      {data.cpmks.map((cpmk) => {
                        const val = comp.cpmkWeights?.[cpmk.code] || 0;
                        return (
                          <td key={cpmk.code} className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={val === 0 ? '' : val}
                              placeholder="0"
                              onChange={(e) =>
                                handleWeightCellChange(
                                  compIdx,
                                  cpmk.code,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`w-14 text-center text-xs font-semibold rounded px-1.5 py-1 border transition-colors ${
                                val > 0
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              } focus:bg-white focus:outline-indigo-500`}
                            />
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            isRowMatch
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {rowSum}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-right uppercase text-[11px] text-slate-700">
                  Total Bobot per CPMK:
                </td>
                <td className="py-3 px-3 text-center text-sm font-extrabold text-slate-900 bg-slate-200/80">
                  100%
                </td>
                {data.cpmks.map((cpmk) => {
                  const colSum = cpmkColumnSums[cpmk.code] || 0;
                  const isColMatch = Math.abs(colSum - cpmk.weight) < 0.1;

                  return (
                    <td key={cpmk.code} className="py-3 px-3 text-center">
                      <div
                        className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold ${
                          isColMatch
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {colSum}%
                      </div>
                    </td>
                  );
                })}
                <td className="py-3 px-3 text-center text-sm font-extrabold text-indigo-800 bg-indigo-50 border-l border-indigo-200">
                  {grandTotal}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
