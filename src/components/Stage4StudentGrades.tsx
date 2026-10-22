import React, { useState, useEffect } from 'react';
import { OBEAssessmentData, UnitClass } from '../types/obe';
import { Users, Plus, Trash2, Calculator, Layers, Download, Sparkles, Shuffle, Check } from 'lucide-react';
import {
  downloadGradeTemplateExcel,
  downloadGradeTemplateCSV,
} from '../utils/templateGenerator';
import { TemplateDownloadModal } from './TemplateDownloadModal';
import { autoGenerateClassAverages } from '../utils/weightDistributor';

interface Stage4Props {
  data: OBEAssessmentData;
  componentTotalAverages: Record<string, number>;
  onUpdate: (updated: Partial<OBEAssessmentData>) => void;
  onOpenTemplateModal?: () => void;
}

export const Stage4StudentGrades: React.FC<Stage4Props> = ({
  data,
  componentTotalAverages,
  onUpdate,
  onOpenTemplateModal,
}) => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!data.unitClasses || data.unitClasses.length === 0) {
      const defaultUnits: UnitClass[] = [
        { id: 'unit-1', name: 'UNIT 01 (KELAS REGULER A)', studentCount: 38, componentAverages: {} },
        { id: 'unit-2', name: 'UNIT 02 (KELAS REGULER B)', studentCount: 36, componentAverages: {} },
        { id: 'unit-3', name: 'UNIT 03 (KELAS MINAT AKUAKULTUR)', studentCount: 26, componentAverages: {} },
      ];
      const filledUnits = autoGenerateClassAverages(data.components || [], defaultUnits);
      onUpdate({ unitClasses: filledUnits });
    } else {
      const needsPopulating = data.unitClasses.every((u) => {
        const scores = Object.values(u.componentAverages || {});
        return scores.length === 0 || scores.every((s) => s === 0);
      });
      if (needsPopulating && data.components && data.components.length > 0) {
        const filledUnits = autoGenerateClassAverages(data.components, data.unitClasses);
        onUpdate({ unitClasses: filledUnits });
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleRandomizeAverages = () => {
    const updatedUnits = autoGenerateClassAverages(data.components, data.unitClasses);
    
    // Also if students exist, update their scores around the class averages
    let updatedStudents = data.students;
    if (updatedStudents && updatedStudents.length > 0) {
      updatedStudents = updatedStudents.map((std) => {
        const newScores: Record<string, number> = {};
        const unit = updatedUnits.find((u) => u.id === std.unitClassId) || updatedUnits[0];
        data.components.forEach((c) => {
          const classAvg = unit?.componentAverages[c.id] ?? 78.0;
          const variance = (Math.random() * 16 - 8); // -8 to +8
          newScores[c.id] = Math.max(50, Math.min(100, Math.round(classAvg + variance)));
        });
        return {
          ...std,
          scores: newScores,
        };
      });
    }

    onUpdate({
      unitClasses: updatedUnits,
      ...(updatedStudents ? { students: updatedStudents } : {}),
    });
    showToast('Nilai rata-rata mahasiswa berhasil diisi secara acak (Jumlah mahasiswa dipertahankan)!');
  };

  const totalStudents = data.unitClasses.reduce((sum, u) => sum + (u.studentCount || 0), 0);

  const handleUnitScoreChange = (unitIndex: number, componentId: string, value: number) => {
    const nextUnits = [...data.unitClasses];
    const unit = { ...nextUnits[unitIndex] };
    unit.componentAverages = {
      ...unit.componentAverages,
      [componentId]: value,
    };
    nextUnits[unitIndex] = unit;
    onUpdate({ unitClasses: nextUnits });
  };

  const handleUnitStudentCountChange = (unitIndex: number, count: number) => {
    const nextUnits = [...data.unitClasses];
    nextUnits[unitIndex] = {
      ...nextUnits[unitIndex],
      studentCount: count,
    };
    onUpdate({ unitClasses: nextUnits });
  };

  const handleUnitNameChange = (unitIndex: number, name: string) => {
    const nextUnits = [...data.unitClasses];
    nextUnits[unitIndex] = {
      ...nextUnits[unitIndex],
      name,
    };
    onUpdate({ unitClasses: nextUnits });
  };

  const handleAddUnit = () => {
    const newUnitNumber = data.unitClasses.length + 1;
    const initialAverages: Record<string, number> = {};
    data.components.forEach((c) => {
      initialAverages[c.id] = 75.0;
    });

    const newUnit: UnitClass = {
      id: `unit-${Date.now()}`,
      name: `Unit 0${newUnitNumber} (Kelas Baru)`,
      studentCount: 30,
      componentAverages: initialAverages,
    };

    onUpdate({ unitClasses: [...data.unitClasses, newUnit] });
  };

  const handleRemoveUnit = (unitIndex: number) => {
    if (data.unitClasses.length <= 1) return;
    const nextUnits = data.unitClasses.filter((_, idx) => idx !== unitIndex);
    onUpdate({ unitClasses: nextUnits });
  };

  const isAveragesEmpty = data.unitClasses.every((u) => {
    const scores = Object.values(u.componentAverages || {});
    return scores.length === 0 || scores.every((s) => s === 0);
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold mb-1 border border-sky-200">
              <Users className="w-3.5 h-3.5" />
              <span>TAHAP 4: KONVERSI NILAI MAHASISWA (Rata-rata Kelas per Unit)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Perolehan Nilai Rata-rata Mahasiswa per Unit Kelas & Rata-rata Gabungan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data nilai diekstraksi dari Daftar Nilai Akhir mahasiswa untuk setiap kelas/unit paralel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-right">
              <span className="text-[11px] text-slate-500 block">Total Mahasiswa Terdaftar</span>
              <span className="text-sm font-extrabold text-slate-900">
                {totalStudents} Mahasiswa ({data.unitClasses.length} Unit)
              </span>
            </div>

            <button
              onClick={handleRandomizeAverages}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
              title="Isi otomatis nilai rata-rata tiap unsur penilaian per unit kelas secara acak dan realistis (Jumlah mahasiswa tetap dipertahankan)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Isi Otomatis / Acak Nilai Rata-rata</span>
            </button>

            <button
              onClick={() => {
                if (onOpenTemplateModal) onOpenTemplateModal();
                else setIsTemplateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Pilih Model Penilaian (Pasal 47) & Unduh File Excel Template Pengisian Nilai Mahasiswa"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Unduh Template Nilai (Excel)</span>
            </button>

            <button
              onClick={handleAddUnit}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Unit Kelas
            </button>
          </div>
        </div>

        {/* Empty / Unfilled Averages Banner */}
        {isAveragesEmpty && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 border border-sky-200 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-950 font-bold block mb-0.5">
                  Belum Ada Data Nilai Rata-rata dari RPS atau Daftar Nilai?
                </strong>
                <span>
                  Sistem dapat mensimulasikan nilai rata-rata secara otomatis dan realistis (skala 72 - 88) dengan tetap <strong>mempertahankan target jumlah mahasiswa ({totalStudents} Mahasiswa di {data.unitClasses.length} Unit Kelas)</strong>. Nilai ini kemudian dapat Anda sesuaikan dan edit kapan saja.
                </span>
              </div>
            </div>
            <button
              onClick={handleRandomizeAverages}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shrink-0 self-start sm:self-auto shadow-md shadow-sky-200 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Isi Otomatis / Acak Sekarang</span>
            </button>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold mt-3 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        <p className="text-xs text-slate-600 mt-4 leading-relaxed">
          Sesuai standar audit OBE, jika mata kuliah diselenggarakan dalam beberapa rombongan belajar (paralel/unit kelas), capaian dihitung per unit kelas kemudian diintegrasikan menjadi <strong>Nilai Rata-rata Gabungan (Weighted Average)</strong> sebagai dasar konversi ke CPMK.
        </p>
      </div>

      {/* Tabel Konversi Nilai Rata-Rata */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Tabel Nilai Rata-Rata Unsur Penilaian per Unit Kelas
            </h4>
          </div>
          <span className="text-xs text-slate-500 italic">
            Rentang nilai skala 0 - 100
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Unsur / Komponen Penilaian</th>
                <th className="py-3 px-3 text-center w-24">Bobot (%)</th>
                {data.unitClasses.map((unit, unitIdx) => (
                  <th key={unit.id} className="py-3 px-3 text-center min-w-[140px] bg-sky-50/50">
                    <div className="flex items-center justify-center gap-1 font-bold text-slate-800">
                      <span>{unit.name}</span>
                      {data.unitClasses.length > 1 && (
                        <button
                          onClick={() => handleRemoveUnit(unitIdx)}
                          className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded"
                          title="Hapus Unit"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      ({unit.studentCount} Mahasiswa)
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-center min-w-[140px] bg-slate-200/80 font-extrabold text-slate-900">
                  Total Rata-rata Gabungan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.components.length === 0 || data.unitClasses.length === 0 ? (
                <tr>
                  <td colSpan={data.unitClasses.length + 4} className="py-8 text-center text-slate-400">
                    Belum ada data nilai komponen atau kelas. Silakan unggah Berkas Nilai Mahasiswa (Excel/CSV/PDF).
                  </td>
                </tr>
              ) : (
                data.components.map((comp, compIdx) => {
                  const totalAvg = componentTotalAverages[comp.id] ?? 0;
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {compIdx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{comp.name}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-600">
                        {comp.weight}%
                      </td>
                      {data.unitClasses.map((unit, unitIdx) => {
                        const score = unit.componentAverages[comp.id] ?? 0;
                        return (
                          <td key={unit.id} className="py-3.5 px-3 text-center bg-sky-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={score}
                              onChange={(e) =>
                                handleUnitScoreChange(
                                  unitIdx,
                                  comp.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-18 text-center text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:outline-indigo-500 shadow-2xs"
                            />
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-4 text-center bg-slate-100 font-extrabold text-indigo-900 text-sm">
                        <div>{totalAvg.toFixed(2)}</div>
                        {totalAvg > 0 && totalAvg < (data.targetBenchmark ?? 75) * 0.6 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 mt-1 whitespace-nowrap">
                            ⚠️ &lt; 60% Target
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right uppercase text-[11px] text-slate-700">
                  Jumlah Mahasiswa per Unit Kelas:
                </td>
                {data.unitClasses.map((unit, unitIdx) => (
                  <td key={unit.id} className="py-3 px-3 text-center bg-sky-50">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={unit.studentCount}
                        onChange={(e) =>
                          handleUnitStudentCountChange(
                            unitIdx,
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-14 text-center text-xs font-bold bg-white border border-slate-300 rounded px-1 py-0.5"
                      />
                      <span className="text-[10px] text-slate-500">Mhs</span>
                    </div>
                  </td>
                ))}
                <td className="py-3 px-4 text-center font-extrabold text-slate-900 bg-slate-200">
                  {totalStudents} Mhs
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Unduh Template Nilai Excel/CSV */}
      <TemplateDownloadModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        courseData={data}
      />
    </div>
  );
};
