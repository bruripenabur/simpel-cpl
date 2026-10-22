import React, { useState } from 'react';
import { OBEAssessmentData, CPLItem, CPMKItem, CPMKMappingToCPL } from '../types/obe';
import {
  BookMarked,
  GraduationCap,
  Target,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface Stage1Props {
  data: OBEAssessmentData;
  onUpdate: (updated: Partial<OBEAssessmentData>) => void;
}

export const Stage1Identification: React.FC<Stage1Props> = ({ data, onUpdate }) => {
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [courseNameInput, setCourseNameInput] = useState(data.courseName || '');
  const [courseCodeInput, setCourseCodeInput] = useState(data.courseCode || '');
  const [creditsInput, setCreditsInput] = useState(data.credits || 3);
  const [semesterInput, setSemesterInput] = useState(data.semester || 'Ganjil 2024/2025');
  const [studyProgramInput, setStudyProgramInput] = useState(data.studyProgram || '');
  const [lecturerNameInput, setLecturerNameInput] = useState(data.lecturerName || '');

  // CPL Modal State
  const [isCplModalOpen, setIsCplModalOpen] = useState(false);
  const [editingCplOriginalCode, setEditingCplOriginalCode] = useState<string | null>(null);
  const [cplCodeInput, setCplCodeInput] = useState('');
  const [cplCategoryInput, setCplCategoryInput] = useState<
    'Sikap' | 'Pengetahuan' | 'Keterampilan Umum' | 'Keterampilan Khusus'
  >('Pengetahuan');
  const [cplDescInput, setCplDescInput] = useState('');
  const [cplTargetInput, setCplTargetInput] = useState<number>(data.targetBenchmark || 75.0);
  const [cplError, setCplError] = useState('');

  // CPMK Modal State
  const [isCpmkModalOpen, setIsCpmkModalOpen] = useState(false);
  const [editingCpmkOriginalCode, setEditingCpmkOriginalCode] = useState<string | null>(null);
  const [cpmkCodeInput, setCpmkCodeInput] = useState('');
  const [cpmkDescInput, setCpmkDescInput] = useState('');
  const [cpmkWeightInput, setCpmkWeightInput] = useState<number>(25);
  const [cpmkMappingsInput, setCpmkMappingsInput] = useState<CPMKMappingToCPL[]>([]);
  const [cpmkError, setCpmkError] = useState('');

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'cpl' | 'cpmk';
    code: string;
    title: string;
  } | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const totalCpmkWeight = data.cpmks.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightValid = Math.abs(totalCpmkWeight - 100) < 0.1;

  const handleSaveIdentity = () => {
    onUpdate({
      courseName: courseNameInput,
      courseCode: courseCodeInput,
      credits: creditsInput,
      semester: semesterInput,
      studyProgram: studyProgramInput,
      lecturerName: lecturerNameInput,
    });
    setIsEditingIdentity(false);
    showToast('Identitas mata kuliah berhasil diperbarui.');
  };

  // ================= CPL HANDLERS =================
  const handleOpenAddCpl = () => {
    setEditingCplOriginalCode(null);
    const nextNum = data.cpls.length + 1;
    setCplCodeInput(`CPL-${String(nextNum).padStart(2, '0')}`);
    setCplCategoryInput('Pengetahuan');
    setCplDescInput('');
    setCplTargetInput(data.targetBenchmark || 75.0);
    setCplError('');
    setIsCplModalOpen(true);
  };

  const handleOpenEditCpl = (cpl: CPLItem) => {
    setEditingCplOriginalCode(cpl.code);
    setCplCodeInput(cpl.code);
    setCplCategoryInput(cpl.category);
    setCplDescInput(cpl.description);
    setCplTargetInput(cpl.target);
    setCplError('');
    setIsCplModalOpen(true);
  };

  const handleSaveCpl = () => {
    const trimmedCode = cplCodeInput.trim().toUpperCase();
    if (!trimmedCode) {
      setCplError('Kode CPL tidak boleh kosong (contoh: CPL-01).');
      return;
    }
    if (!cplDescInput.trim()) {
      setCplError('Deskripsi rumusan CPL tidak boleh kosong.');
      return;
    }

    // Check duplicate code if adding or changed
    const isDuplicate = data.cpls.some(
      (c) => c.code.toUpperCase() === trimmedCode && c.code !== editingCplOriginalCode
    );
    if (isDuplicate) {
      setCplError(`Kode ${trimmedCode} sudah digunakan. Harap gunakan kode unik.`);
      return;
    }

    if (editingCplOriginalCode) {
      // Edit existing
      const updatedCpls = data.cpls.map((c) => {
        if (c.code === editingCplOriginalCode) {
          return {
            ...c,
            code: trimmedCode,
            category: cplCategoryInput,
            description: cplDescInput.trim(),
            target: cplTargetInput,
          };
        }
        return c;
      });

      // Update CPL references in CPMKs if code changed
      const updatedCpmks = data.cpmks.map((cpmk) => ({
        ...cpmk,
        cplMappings: (cpmk.cplMappings ?? []).map((m) =>
          m.cplCode === editingCplOriginalCode ? { ...m, cplCode: trimmedCode } : m
        ),
      }));

      onUpdate({ cpls: updatedCpls, cpmks: updatedCpmks });
      showToast(`Data CPL (${trimmedCode}) berhasil diperbarui.`);
    } else {
      // Add new CPL
      const newCpl: CPLItem = {
        id: `cpl_${Date.now()}`,
        code: trimmedCode,
        category: cplCategoryInput,
        description: cplDescInput.trim(),
        target: cplTargetInput,
      };
      onUpdate({ cpls: [...data.cpls, newCpl] });
      showToast(`CPL baru (${trimmedCode}) berhasil ditambahkan ke RPS.`);
    }

    setIsCplModalOpen(false);
  };

  const handleConfirmDeleteCpl = (code: string) => {
    setDeleteConfirm({
      type: 'cpl',
      code,
      title: `Hapus Butir ${code}? Seluruh pemetaan CPMK terhadap CPL ini akan dihapus secara otomatis.`,
    });
  };

  const executeDeleteCpl = (code: string) => {
    const updatedCpls = data.cpls.filter((c) => c.code !== code);
    const updatedCpmks = data.cpmks.map((cpmk) => ({
      ...cpmk,
      cplMappings: (cpmk.cplMappings ?? []).filter((m) => m.cplCode !== code),
    }));
    onUpdate({ cpls: updatedCpls, cpmks: updatedCpmks });
    setDeleteConfirm(null);
    showToast(`Butir CPL (${code}) telah dihapus dari daftar RPS.`);
  };

  // ================= CPMK HANDLERS =================
  const handleOpenAddCpmk = () => {
    setEditingCpmkOriginalCode(null);
    const nextNum = data.cpmks.length + 1;
    setCpmkCodeInput(`CPMK-${nextNum}`);
    setCpmkDescInput('');
    // Default remaining weight to complete 100%
    const remainingWeight = Math.max(0, 100 - totalCpmkWeight);
    setCpmkWeightInput(remainingWeight > 0 ? remainingWeight : 20);

    // Default map to first CPL if exists
    if (data.cpls.length > 0) {
      setCpmkMappingsInput([{ cplCode: data.cpls[0].code, weightInCPL: 100 }]);
    } else {
      setCpmkMappingsInput([]);
    }
    setCpmkError('');
    setIsCpmkModalOpen(true);
  };

  const handleOpenEditCpmk = (cpmk: CPMKItem) => {
    setEditingCpmkOriginalCode(cpmk.code);
    setCpmkCodeInput(cpmk.code);
    setCpmkDescInput(cpmk.description);
    setCpmkWeightInput(cpmk.weight);
    setCpmkMappingsInput((cpmk.cplMappings ?? []).map((m) => ({ ...m })));
    setCpmkError('');
    setIsCpmkModalOpen(true);
  };

  const handleToggleCplMapping = (cplCode: string) => {
    const existing = cpmkMappingsInput.find((m) => m.cplCode === cplCode);
    if (existing) {
      setCpmkMappingsInput((prev) => prev.filter((m) => m.cplCode !== cplCode));
    } else {
      setCpmkMappingsInput((prev) => [...prev, { cplCode, weightInCPL: 100 }]);
    }
  };

  const handleUpdateCplWeightInMapping = (cplCode: string, weightVal: number) => {
    setCpmkMappingsInput((prev) =>
      prev.map((m) => (m.cplCode === cplCode ? { ...m, weightInCPL: weightVal } : m))
    );
  };

  const handleSaveCpmk = () => {
    const trimmedCode = cpmkCodeInput.trim().toUpperCase();
    if (!trimmedCode) {
      setCpmkError('Kode CPMK tidak boleh kosong (contoh: CPMK-1).');
      return;
    }
    if (!cpmkDescInput.trim()) {
      setCpmkError('Deskripsi rumusan CPMK tidak boleh kosong.');
      return;
    }
    if (cpmkWeightInput <= 0 || cpmkWeightInput > 100) {
      setCpmkError('Bobot CPMK terhadap mata kuliah harus di antara 1% - 100%.');
      return;
    }

    const isDuplicate = data.cpmks.some(
      (c) => c.code.toUpperCase() === trimmedCode && c.code !== editingCpmkOriginalCode
    );
    if (isDuplicate) {
      setCpmkError(`Kode ${trimmedCode} sudah digunakan. Harap gunakan kode unik.`);
      return;
    }

    if (editingCpmkOriginalCode) {
      // Edit existing CPMK
      const updatedCpmks = data.cpmks.map((c) => {
        if (c.code === editingCpmkOriginalCode) {
          return {
            ...c,
            code: trimmedCode,
            description: cpmkDescInput.trim(),
            weight: cpmkWeightInput,
            cplMappings: cpmkMappingsInput,
          };
        }
        return c;
      });

      // Update CPMK reference in assessment components if code changed
      const updatedComponents = data.components.map((comp) => {
        if (comp.cpmkWeights && comp.cpmkWeights[editingCpmkOriginalCode] !== undefined) {
          const val = comp.cpmkWeights[editingCpmkOriginalCode];
          const newWeights = { ...comp.cpmkWeights };
          delete newWeights[editingCpmkOriginalCode];
          newWeights[trimmedCode] = val;
          return { ...comp, cpmkWeights: newWeights };
        }
        return comp;
      });

      onUpdate({ cpmks: updatedCpmks, components: updatedComponents });
      showToast(`Data CPMK (${trimmedCode}) berhasil diperbarui.`);
    } else {
      // Add new CPMK
      const newCpmk: CPMKItem = {
        id: `cpmk_${Date.now()}`,
        code: trimmedCode,
        description: cpmkDescInput.trim(),
        weight: cpmkWeightInput,
        cplMappings: cpmkMappingsInput,
      };
      onUpdate({ cpmks: [...data.cpmks, newCpmk] });
      showToast(`CPMK baru (${trimmedCode}) berhasil ditambahkan ke RPS.`);
    }

    setIsCpmkModalOpen(false);
  };

  const handleConfirmDeleteCpmk = (code: string) => {
    setDeleteConfirm({
      type: 'cpmk',
      code,
      title: `Hapus ${code}? Bobot dan keterkaitan penilaian pada mata kuliah ini akan disesuaikan.`,
    });
  };

  const executeDeleteCpmk = (code: string) => {
    const updatedCpmks = data.cpmks.filter((c) => c.code !== code);
    const updatedComponents = data.components.map((comp) => {
      if (comp.cpmkWeights && comp.cpmkWeights[code] !== undefined) {
        const newWeights = { ...comp.cpmkWeights };
        delete newWeights[code];
        return { ...comp, cpmkWeights: newWeights };
      }
      return comp;
    });

    onUpdate({ cpmks: updatedCpmks, components: updatedComponents });
    setDeleteConfirm(null);
    showToast(`CPMK (${code}) telah dihapus dari RPS.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold mb-1 border border-blue-200">
              <BookMarked className="w-3.5 h-3.5" />
              <span>TAHAP 1: IDENTIFIKASI &amp; MAPPING (Data RPS)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Profil Mata Kuliah &amp; Pemetaan Capaian Pembelajaran (CPL - CPMK)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data diekstraksi dari Rencana Pembelajaran Semester (RPS). Anda dapat menambahkan, mengubah, atau menghapus butir CPL dan CPMK sesuai dokumen RPS dan Daftar Nilai.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCourseNameInput(data.courseName || '');
                setCourseCodeInput(data.courseCode || '');
                setCreditsInput(data.credits || 3);
                setSemesterInput(data.semester || 'Ganjil 2024/2025');
                setStudyProgramInput(data.studyProgram || '');
                setLecturerNameInput(data.lecturerName || '');
                setIsEditingIdentity(!isEditingIdentity);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isEditingIdentity ? 'Tutup Edit' : 'Edit Identitas MK'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <Target className="w-4 h-4 text-rose-500" />
              <div>
                <span className="text-[10px] text-slate-500 block font-semibold">Target OBE</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    value={data.targetBenchmark}
                    onChange={(e) => onUpdate({ targetBenchmark: parseFloat(e.target.value) || 75.0 })}
                    className="w-14 font-bold text-slate-900 text-xs bg-white border border-slate-300 rounded px-1 py-0.5 text-center focus:outline-indigo-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Edit Identitas jika diaktifkan */}
        {isEditingIdentity ? (
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 mt-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Form Koreksi / Perubahan Data Identitas Mata Kuliah</span>
              </span>
              <span className="text-[11px] text-indigo-700">Perubahan langsung tersimpan ke seluruh laporan</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Mata Kuliah</label>
                <input
                  type="text"
                  value={courseNameInput}
                  onChange={(e) => setCourseNameInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kode MK</label>
                <input
                  type="text"
                  value={courseCodeInput}
                  onChange={(e) => setCourseCodeInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bobot SKS</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={creditsInput}
                  onChange={(e) => setCreditsInput(parseInt(e.target.value) || 3)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Semester &amp; Tahun Akademik</label>
                <input
                  type="text"
                  value={semesterInput}
                  onChange={(e) => setSemesterInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Program Studi</label>
                <input
                  type="text"
                  value={studyProgramInput}
                  onChange={(e) => setStudyProgramInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Dosen Pengampu</label>
                <input
                  type="text"
                  value={lecturerNameInput}
                  onChange={(e) => setLecturerNameInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium focus:outline-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditingIdentity(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveIdentity}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Identitas</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Info Grid Identitas Readonly */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Mata Kuliah
            </label>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{data.courseName || '-'}</p>
            <p className="text-xs text-slate-500">{data.courseCode} ({data.credits} SKS)</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Semester
            </label>
            <p className="font-semibold text-slate-900 text-sm mt-0.5">{data.semester}</p>
            <p className="text-xs text-slate-500">Tahun Akademik: {data.academicYear}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Program Studi &amp; Fakultas
            </label>
            <p className="font-semibold text-slate-900 text-sm mt-0.5">
              {data.studyProgram || <span className="text-slate-400 font-normal italic">Belum diisi</span>}
            </p>
            <p className="text-xs text-slate-500">{data.faculty || '-'}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Dosen Pengampu
            </label>
            <p className="font-semibold text-slate-900 text-sm mt-0.5">
              {data.lecturerName || <span className="text-slate-400 font-normal italic">Belum diisi</span>}
            </p>
            {data.lecturerNip && (
              <p className="text-[11px] text-slate-500">NIP: {data.lecturerNip}</p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TABEL CPL DENGAN TOMBOL AKSI (EDIT, HAPUS, TAMBAH)    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Daftar Capaian Pembelajaran Lulusan (CPL) yang Dibebankan pada Mata Kuliah
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Total CPL: <strong>{data.cpls.length} Butir</strong> • Standar Kurikulum OBE Program Studi
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenAddCpl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah CPL</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-28">Kode CPL</th>
                <th className="py-3 px-4 w-36">Ranah Kompetensi</th>
                <th className="py-3 px-6">Rumusan Deskripsi CPL (Standar Program Studi)</th>
                <th className="py-3 px-4 w-28 text-center">Target Acuan</th>
                <th className="py-3 px-4 w-28 text-center font-bold text-indigo-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.cpls.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data CPL. Klik tombol <strong>+ Tambah CPL</strong> untuk menambahkan data CPL sesuai RPS.
                  </td>
                </tr>
              ) : (
                data.cpls.map((cpl) => (
                  <tr key={cpl.code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-indigo-700">{cpl.code}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {cpl.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 leading-relaxed">{cpl.description}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {(cpl.target ?? 75).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCpl(cpl)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                          title={`Edit ${cpl.code}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleConfirmDeleteCpl(cpl.code)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                          title={`Hapus ${cpl.code}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TABEL CPMK DENGAN TOMBOL AKSI (EDIT, HAPUS, TAMBAH)   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Daftar Capaian Pembelajaran Mata Kuliah (CPMK) &amp; Pemetaan Beban Bobot
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-medium">
                  Total CPMK: <strong>{data.cpmks.length} Butir</strong>
                </span>
                <span className="text-slate-300">•</span>
                {isWeightValid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Total Bobot: {totalCpmkWeight}% (Valid)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertCircle className="w-3 h-3" /> Total Bobot: {totalCpmkWeight}% (Harus 100%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAddCpmk}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah CPMK</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-28">Kode CPMK</th>
                <th className="py-3 px-6">Deskripsi Rumusan CPMK</th>
                <th className="py-3 px-4 w-32 text-center">Bobot Terhadap MK</th>
                <th className="py-3 px-6 w-64">Pemetaan Terhadap CPL Terkait</th>
                <th className="py-3 px-4 w-28 text-center font-bold text-indigo-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.cpmks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data CPMK. Klik tombol <strong>+ Tambah CPMK</strong> untuk menyesuaikan dengan RPS.
                  </td>
                </tr>
              ) : (
                data.cpmks.map((cpmk) => (
                  <tr key={cpmk.code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-blue-700">{cpmk.code}</td>
                    <td className="py-3.5 px-6 text-slate-700 leading-relaxed">{cpmk.description}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-900 bg-indigo-50 px-2.5 py-1 rounded-md text-xs border border-indigo-200">
                        {cpmk.weight}%
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {(cpmk.cplMappings ?? []).length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">Belum dipetakan ke CPL</span>
                        ) : (
                          (cpmk.cplMappings ?? []).map((m) => (
                            <span
                              key={m.cplCode}
                              className="px-2 py-0.5 rounded text-[11px] bg-slate-100 border border-slate-300 text-slate-800 font-medium"
                            >
                              <strong>{m.cplCode}</strong> ({m.weightInCPL}% kontribusi)
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCpmk(cpmk)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                          title={`Edit ${cpmk.code}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleConfirmDeleteCpmk(cpmk.code)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                          title={`Hapus ${cpmk.code}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={2} className="py-3 px-6 text-right uppercase text-[11px] text-slate-600">
                  Total Akumulasi Bobot CPMK:
                </td>
                <td className="py-3 px-4 text-center text-sm font-bold text-indigo-700">
                  {totalCpmkWeight}%
                </td>
                <td colSpan={2} className="py-3 px-6 text-xs text-slate-500">
                  {isWeightValid ? '✓ Sesuai dengan ketentuan kurikulum OBE (100%)' : '⚠ Perlu penyesuaian bobot agar total tepat 100%'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT CPL                                  */}
      {/* ========================================================= */}
      {isCplModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCplOriginalCode ? `Edit Butir CPL (${editingCplOriginalCode})` : 'Tambah Butir CPL Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsCplModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cplError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{cplError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode CPL</label>
                  <input
                    type="text"
                    placeholder="Contoh: CPL-01"
                    value={cplCodeInput}
                    onChange={(e) => setCplCodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-indigo-700 focus:bg-white focus:outline-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Acuan (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    value={cplTargetInput}
                    onChange={(e) => setCplTargetInput(parseFloat(e.target.value) || 75.0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ranah Kompetensi</label>
                <select
                  value={cplCategoryInput}
                  onChange={(e) => setCplCategoryInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:bg-white focus:outline-indigo-500 cursor-pointer"
                >
                  <option value="Sikap">Sikap</option>
                  <option value="Pengetahuan">Pengetahuan</option>
                  <option value="Keterampilan Umum">Keterampilan Umum</option>
                  <option value="Keterampilan Khusus">Keterampilan Khusus</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Rumusan Deskripsi CPL (Sesuai Kurikulum Program Studi)
                </label>
                <textarea
                  rows={4}
                  placeholder="Deskripsikan kompetensi lulusan yang diharapkan..."
                  value={cplDescInput}
                  onChange={(e) => setCplDescInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-normal text-slate-800 focus:bg-white focus:outline-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCplModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCpl}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan CPL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT CPMK                                 */}
      {/* ========================================================= */}
      {isCpmkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCpmkOriginalCode ? `Edit CPMK (${editingCpmkOriginalCode})` : 'Tambah CPMK Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsCpmkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cpmkError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{cpmkError}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode CPMK</label>
                  <input
                    type="text"
                    placeholder="Contoh: CPMK-1"
                    value={cpmkCodeInput}
                    onChange={(e) => setCpmkCodeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-blue-700 focus:bg-white focus:outline-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bobot Terhadap MK (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={cpmkWeightInput}
                    onChange={(e) => setCpmkWeightInput(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Deskripsi Rumusan CPMK (Kemampuan Akhir yang Direncanakan)
                </label>
                <textarea
                  rows={3}
                  placeholder="Rumuskan capaian pembelajaran mata kuliah secara spesifik dan terukur..."
                  value={cpmkDescInput}
                  onChange={(e) => setCpmkDescInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-normal text-slate-800 focus:bg-white focus:outline-indigo-500 leading-relaxed"
                />
              </div>

              {/* Pemetaan ke CPL Terkait */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <label className="font-bold text-slate-800 block flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pemetaan Beban CPMK ini terhadap Butir CPL Terkait</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Pilih butir CPL yang didukung oleh CPMK ini dan tentukan persentase kontribusinya:
                </p>

                {data.cpls.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">
                    Belum ada CPL. Tambahkan butir CPL terlebih dahulu agar dapat dipetakan.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {data.cpls.map((cpl) => {
                      const isMapped = cpmkMappingsInput.some((m) => m.cplCode === cpl.code);
                      const currentMapping = cpmkMappingsInput.find((m) => m.cplCode === cpl.code);
                      return (
                        <div
                          key={cpl.code}
                          className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                            isMapped
                              ? 'bg-indigo-50/70 border-indigo-300'
                              : 'bg-white border-slate-200 opacity-70'
                          }`}
                        >
                          <label className="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isMapped}
                              onChange={() => handleToggleCplMapping(cpl.code)}
                              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-900 block truncate">
                                {cpl.code} ({cpl.category})
                              </span>
                              <span className="text-[10px] text-slate-500 line-clamp-1">
                                {cpl.description}
                              </span>
                            </div>
                          </label>

                          {isMapped && (
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                              <span className="text-[10px] text-slate-600 font-semibold">Kontribusi:</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={currentMapping?.weightInCPL ?? 100}
                                onChange={(e) =>
                                  handleUpdateCplWeightInMapping(
                                    cpl.code,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 bg-white border border-indigo-300 rounded px-1.5 py-0.5 font-bold text-center text-indigo-900 focus:outline-indigo-500 text-xs"
                              />
                              <span className="text-[11px] text-slate-600">%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCpmkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCpmk}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan CPMK</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL KONFIRMASI HAPUS                                   */}
      {/* ========================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Hapus</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-rose-50/60 p-3 rounded-xl border border-rose-200">
              {deleteConfirm.title}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'cpl') {
                    executeDeleteCpl(deleteConfirm.code);
                  } else {
                    executeDeleteCpmk(deleteConfirm.code);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
