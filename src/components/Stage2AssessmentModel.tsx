import React from 'react';
import { OBEAssessmentData, AssessmentComponent } from '../types/obe';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import {
  validatePasal47Weighting,
  UNPATTI_PASAL_47_PRESETS,
  isCaseOrProjectComponent,
} from '../utils/unpattiAcademicRegulations';

interface Stage2Props {
  data: OBEAssessmentData;
  onUpdate: (updated: Partial<OBEAssessmentData>) => void;
}

export const Stage2AssessmentModel: React.FC<Stage2Props> = ({ data, onUpdate }) => {
  const validation = validatePasal47Weighting(data.components);

  const handleWeightChange = (index: number, newWeight: number) => {
    const nextComponents = [...data.components];
    nextComponents[index] = {
      ...nextComponents[index],
      weight: newWeight,
    };
    onUpdate({ components: nextComponents });
  };

  const handleNameChange = (index: number, newName: string) => {
    const nextComponents = [...data.components];
    nextComponents[index] = {
      ...nextComponents[index],
      name: newName,
    };
    onUpdate({ components: nextComponents });
  };

  const handleAddComponent = () => {
    const newComp: AssessmentComponent = {
      id: `c_${Date.now()}`,
      name: 'Komponen Baru (Misal: Metode Pemecahan Kasus)',
      weight: 10,
      cpmkWeights: {},
    };
    onUpdate({ components: [...data.components, newComp] });
  };

  const handleDeleteComponent = (index: number) => {
    const nextComponents = data.components.filter((_, i) => i !== index);
    onUpdate({ components: nextComponents });
  };

  const handleApplyPreset = (presetIndex: number) => {
    const preset = UNPATTI_PASAL_47_PRESETS[presetIndex];
    if (preset) {
      onUpdate({ components: preset.components });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info with Peraturan Rektor No 12/2026 Pasal 47 Reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PERATURAN REKTOR UNIVERSITAS PATTIMURA NOMOR 12 TAHUN 2026 PASAL 47</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Komposisi Unsur Penilaian &amp; Pembobotan Hasil Belajar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar Penetapan Bobot Asesmen Mata Kuliah Berdasarkan Regulasi Akademik Universitas Pattimura
            </p>
          </div>

          <div>
            {validation.isCompliant ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Memenuhi Pasal 47 (Total 100% • Proyek ≥ 50%)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Perlu Penyesuaian Bobot (Pasal 47 Unpatti)</span>
              </span>
            )}
          </div>
        </div>

        {/* Pilihan Jenjang Pendidikan & Skala Penilaian Mutu (Pasal 47 Ayat 4 & 5) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">
                Jenjang Pendidikan &amp; Konversi Skala Nilai Mutu (Pasal 47):
              </span>
              <span className="text-[11px] text-slate-500 block">
                Pilih jenjang akademik mata kuliah ini untuk menentukan standar huruf mutu dan angka mutu otomatis.
              </span>
            </div>
            
            <div className="inline-flex rounded-xl bg-slate-200/90 p-1 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onUpdate({ academicLevel: 'sarjana' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  (data.academicLevel || 'sarjana') === 'sarjana'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sarjana / Diploma / Profesi (Ayat 4)
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ academicLevel: 'pascasarjana' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  data.academicLevel === 'pascasarjana'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pascasarjana S2 / S3 (Ayat 5)
              </button>
            </div>
          </div>

          {/* Skala Nilai Aktif */}
          {(data.academicLevel || 'sarjana') === 'sarjana' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-emerald-800 text-sm block">A (4.00)</span>
                <span className="text-[10px] text-emerald-700 font-medium">85.00 - 100</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold truncate">Sangat Baik</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-sky-800 text-sm block">B (3.00)</span>
                <span className="text-[10px] text-sky-700 font-medium">70.00 - 84.99</span>
                <span className="text-[10px] text-sky-700 block mt-0.5 font-bold truncate">Baik</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-amber-800 text-sm block">C (2.00)</span>
                <span className="text-[10px] text-amber-700 font-medium">55.00 - 69.99</span>
                <span className="text-[10px] text-amber-700 block mt-0.5 font-bold truncate">Cukup</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-rose-800 text-sm block">D (1.00)</span>
                <span className="text-[10px] text-rose-700 font-medium">40.00 - 54.99</span>
                <span className="text-[10px] text-rose-700 block mt-0.5 font-bold truncate">Kurang</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-100/60 border border-red-300 flex flex-col justify-center min-w-0 overflow-hidden col-span-2 sm:col-span-1">
                <span className="font-extrabold text-red-900 text-sm block">E (0.00)</span>
                <span className="text-[10px] text-red-800 font-medium">0.00 - 39.99</span>
                <span className="text-[10px] text-red-700 block mt-0.5 font-bold truncate">Gagal</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-emerald-800 text-xs block">A (4.00)</span>
                <span className="text-[10px] text-emerald-700 font-medium">≥ 90.00</span>
                <span className="text-[10px] text-emerald-700 block truncate font-bold">Sangat Baik</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-emerald-800 text-xs block">A- (3.70)</span>
                <span className="text-[10px] text-emerald-700 font-medium">85 - 89.99</span>
                <span className="text-[10px] text-emerald-700 block truncate font-bold">Sangat Baik</span>
              </div>
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-sky-800 text-xs block">B+ (3.30)</span>
                <span className="text-[10px] text-sky-700 font-medium">80 - 84.99</span>
                <span className="text-[10px] text-sky-700 block truncate font-bold">Baik</span>
              </div>
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-sky-800 text-xs block">B (3.00)</span>
                <span className="text-[10px] text-sky-700 font-medium">70 - 79.99</span>
                <span className="text-[10px] text-sky-700 block truncate font-bold">Baik</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-blue-800 text-xs block">B- (2.70)</span>
                <span className="text-[10px] text-blue-700 font-medium">65 - 69.99</span>
                <span className="text-[10px] text-blue-700 block truncate font-bold">Baik</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex flex-col justify-center min-w-0 overflow-hidden">
                <span className="font-extrabold text-amber-800 text-xs block">C (2.00)</span>
                <span className="text-[10px] text-amber-700 font-medium">55 - 64.99</span>
                <span className="text-[10px] text-amber-700 block truncate font-bold">Cukup</span>
              </div>
              <div className="p-2 rounded-xl bg-red-100/60 border border-red-300 flex flex-col justify-center min-w-0 overflow-hidden col-span-2 sm:col-span-1">
                <span className="font-extrabold text-red-900 text-xs block">E (0.00)</span>
                <span className="text-[10px] text-red-800 font-medium">&lt; 55.00</span>
                <span className="text-[10px] text-red-700 block truncate font-bold">Gagal</span>
              </div>
            </div>
          )}
        </div>

        {/* 3-Part Compliance Indicator Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className={`p-3.5 rounded-xl border text-xs min-w-0 overflow-hidden flex flex-col justify-between ${
              validation.isProjectCompliant
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[11px] uppercase tracking-wider truncate">
                  1. Proyek &amp; Kasus:
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                    validation.isProjectCompliant ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {validation.isProjectCompliant ? '≥ 50% (Sesuai)' : '< 50% (Kurang)'}
                </span>
              </div>
              <div className="text-xl font-black mt-1">
                {validation.participativeAndProjectWeight}%
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
              Pasal 47 Ayat (3): Proyek berbasis tim &amp; metode pemecahan kasus sekurang-kurangnya 50%.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-xs min-w-0 overflow-hidden flex flex-col justify-between ${
              validation.isExamCompliant
                ? 'bg-sky-50/70 border-sky-200 text-sky-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[11px] uppercase tracking-wider truncate">
                  2. Tugas, Kuis, Ujian:
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                    validation.isExamCompliant ? 'bg-sky-200 text-sky-900' : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {validation.isExamCompliant ? '≤ 50% (Sesuai)' : '> 50% (Melebihi)'}
                </span>
              </div>
              <div className="text-xl font-black mt-1">
                {validation.cognitiveAndExamWeight}%
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
              Pasal 47 Ayat (3): Komponen kognitif &amp; ujian lainnya dialokasikan paling banyak 50%.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-xs min-w-0 overflow-hidden flex flex-col justify-between ${
              validation.isTotal100
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[11px] uppercase tracking-wider truncate">
                  3. Total Bobot:
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0 whitespace-nowrap ${
                    validation.isTotal100 ? 'bg-indigo-200 text-indigo-900' : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {validation.isTotal100 ? '100% (Tepat)' : 'Wajib 100%'}
                </span>
              </div>
              <div className="text-xl font-black mt-1">{validation.totalWeight}%</div>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
              Pasal 47 Ayat (3): Total bobot seluruh instrumen penilaian tepat 100%.
            </p>
          </div>
        </div>

        {/* Quick Presets for Pasal 47 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 overflow-hidden">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Template Cepat Pembobotan Pasal 47 Unpatti:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {UNPATTI_PASAL_47_PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(idx)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                title={preset.description}
              >
                Model {idx + 1} ({idx === 0 ? '55% Kasus/Proyek' : idx === 1 ? 'Praktik/Proyek' : '50:50 Proporsional'})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel Komponen Penilaian */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4">Unsur / Komponen Penilaian (Pasal 47 Ayat 2)</th>
                <th className="py-3 px-4 w-36 text-center">Bobot (%)</th>
                <th className="py-3 px-4 w-52">Klasifikasi Regulasi Pasal 47</th>
                <th className="py-3 px-3 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.components.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada unsur penilaian. Silakan klik tombol di bawah untuk menambah komponen atau pilih template preset.
                  </td>
                </tr>
              ) : (
                data.components.map((comp, idx) => {
                  const isProject = isCaseOrProjectComponent(comp.name);
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={comp.name}
                          onChange={(e) => handleNameChange(idx, e.target.value)}
                          placeholder="Nama instrumen evaluasi..."
                          className="w-full text-slate-900 font-semibold text-xs border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-1 focus:bg-white focus:outline-hidden"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={comp.weight}
                            onChange={(e) =>
                              handleWeightChange(idx, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 font-bold text-center text-slate-900 text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:bg-white focus:outline-indigo-500 font-mono"
                          />
                          <span className="font-bold text-slate-600">%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isProject ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Proyek / Kasus (Min 50%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-300">
                            Kognitif/Ujian (Maks 50%)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteComponent(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus komponen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={2} className="py-3.5 px-4 text-right uppercase text-[11px] text-slate-600">
                  Total Akumulasi Bobot:
                </td>
                <td className="py-3.5 px-4 text-center text-sm font-extrabold text-indigo-700 font-mono">
                  {validation.totalWeight}%
                </td>
                <td colSpan={2} className="py-3.5 px-4 text-xs">
                  {validation.isCompliant ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Sesuai Standar Pasal 47 Unpatti
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {validation.message}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddComponent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Komponen Penilaian</span>
          </button>
          <span className="text-[11px] text-slate-500">
            Dosen Pengampu: <strong>{data.lecturerName}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
