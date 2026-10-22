import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  AssessmentModelChoice,
  ASSESSMENT_MODEL_DEFINITIONS,
  downloadGradeTemplateExcel,
  downloadGradeTemplateCSV,
} from '../utils/templateGenerator';
import { OBEAssessmentData } from '../types/obe';

interface TemplateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData?: OBEAssessmentData;
}

export const TemplateDownloadModal: React.FC<TemplateDownloadModalProps> = ({
  isOpen,
  onClose,
  courseData,
}) => {
  const [selectedModel, setSelectedModel] = useState<AssessmentModelChoice>(1);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDef = ASSESSMENT_MODEL_DEFINITIONS[selectedModel];

  const handleDownloadExcel = () => {
    downloadGradeTemplateExcel(selectedModel, courseData);
    setDownloadSuccess(`Template Model ${selectedModel} (.xlsx) berhasil diunduh!`);
    setTimeout(() => {
      setDownloadSuccess(null);
      onClose();
    }, 1500);
  };

  const handleDownloadCSV = () => {
    downloadGradeTemplateCSV(selectedModel, courseData);
    setDownloadSuccess(`Template Model ${selectedModel} (.csv) berhasil diunduh!`);
    setTimeout(() => {
      setDownloadSuccess(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Peraturan Rektor No. 12 Tahun 2026 Pasal 47</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Pilih Model Penilaian untuk Format Template Nilai
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih model rancangan evaluasi mata kuliah Anda. Judul kolom dan persentase bobot otomatis disesuaikan dengan regulasi OBE Unpatti.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {downloadSuccess && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Model Selection Radio Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              1. Pilih Model Penilaian (Pasal 47):
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {([1, 2, 3] as AssessmentModelChoice[]).map((mNum) => {
                const def = ASSESSMENT_MODEL_DEFINITIONS[mNum];
                const isSelected = selectedModel === mNum;

                return (
                  <div
                    key={mNum}
                    onClick={() => setSelectedModel(mNum)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm font-bold text-slate-900">
                              {def.name}
                            </strong>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Kasus/Proyek: {def.caseAndProjectWeight}% (Patuh)
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-snug">
                            {def.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column Breakdown Preview */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Susunan Judul Kolom ({currentDef.name}):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Total Kolom: {4 + currentDef.columns.length} Kolom
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="flex items-center gap-1.5 py-1 text-[11px] font-mono min-w-max">
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  No
                </span>
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  NIM
                </span>
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  Nama Mahasiswa
                </span>
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  Unit Kelas
                </span>
                {currentDef.columns.map((col, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded border font-semibold ${
                      col.name.includes('Kasus') ||
                      col.name.includes('Proyek') ||
                      col.name.includes('Partisipatif')
                        ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                        : 'bg-indigo-950/80 border-indigo-700/80 text-indigo-300'
                    }`}
                  >
                    {col.name} ({col.weight}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 text-center sm:text-left">
            * File template berisi baris siap isi untuk 35 mahasiswa.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Format CSV (.csv)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
