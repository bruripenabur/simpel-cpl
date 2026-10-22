import React, { useState } from 'react';
import {
  CPMKCalculationResult,
  CPLCalculationResult,
  OBEAssessmentData,
} from '../types/obe';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Save,
} from 'lucide-react';

interface Stage7Props {
  data: OBEAssessmentData;
  cpmkResults: CPMKCalculationResult[];
  cplResults: CPLCalculationResult[];
  targetBenchmark?: number;
  onUpdateNarrative: (notes: NonNullable<OBEAssessmentData['narrativeNotes']>) => void;
  onGenerateWithAI?: () => void;
  isAiGenerating?: boolean;
}

export const Stage7ContinuousImprovement: React.FC<Stage7Props> = ({
  data,
  cpmkResults,
  cplResults,
  targetBenchmark = 75.0,
  onUpdateNarrative,
  onGenerateWithAI,
  isAiGenerating = false,
}) => {
  const [modelPenilaian, setModelPenilaian] = useState(
    data.narrativeNotes?.modelPenilaian || ''
  );
  const [pelaksanaanPembelajaran, setPelaksanaanPembelajaran] = useState(
    data.narrativeNotes?.pelaksanaanPembelajaran || ''
  );
  const [analisisCPMK, setAnalisisCPMK] = useState(
    data.narrativeNotes?.analisisCPMK || ''
  );
  const [analisisCPL, setAnalisisCPL] = useState(
    data.narrativeNotes?.analisisCPL || ''
  );
  const [pengendalianMutu, setPengendalianMutu] = useState(
    data.narrativeNotes?.pengendalianMutu || ''
  );
  const [rekomendasiCQI, setRekomendasiCQI] = useState(
    data.narrativeNotes?.rekomendasiCQI || ''
  );
  const [kesimpulan, setKesimpulan] = useState(
    data.narrativeNotes?.kesimpulan || ''
  );

  const [savedStatus, setSavedStatus] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const achievedCPMKs = cpmkResults.filter((c) => c.isAchieved);
  const unachievedCPMKs = cpmkResults.filter((c) => !c.isAchieved);
  const achievedCPLs = cplResults.filter((c) => c.isAchieved);
  const unachievedCPLs = cplResults.filter((c) => !c.isAchieved);
  const totalStudents = data.unitClasses.reduce((sum, u) => sum + (u.studentCount || 0), 0);
  const avgOverall = cpmkResults.length > 0
    ? (cpmkResults.reduce((a, b) => a + b.capaianAkhir, 0) / cpmkResults.length).toFixed(2)
    : '0.00';

  // Auto-generate template text if empty or on synthesis click
  const handleAutoFillDefault = () => {
    const cpmkAchievedText = achievedCPMKs.map((c) => `${c.cpmkCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || 'Belum ada data tuntas';
    const cpmkUnachievedText = unachievedCPMKs.map((c) => `${c.cpmkCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || 'Seluruh CPMK telah mencapai target acuan (>= 75%)';
    const cplAchievedText = achievedCPLs.map((c) => `${c.cplCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || 'Belum ada data tuntas';
    const cplUnachievedText = unachievedCPLs.map((c) => `${c.cplCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || 'Seluruh CPL telah melampaui target acuan';

    const formatif = data.components.filter(c => !c.name.toLowerCase().includes('ujian') && !c.name.toLowerCase().includes('uts') && !c.name.toLowerCase().includes('uas')).map(c => `${c.name} (${c.weight}%)`).join(', ') || 'Tugas & Kuis (20%), Praktikum (25%)';
    const sumatif = data.components.filter(c => c.name.toLowerCase().includes('ujian') || c.name.toLowerCase().includes('uts') || c.name.toLowerCase().includes('uas')).map(c => `${c.name} (${c.weight}%)`).join(', ') || 'UTS (25%), UAS (30%)';

    // 1. [P] Perencanaan
    const defaultModel = `[PERENCANAAN / P] Berdasarkan dokumen Rencana Pembelajaran Semester (RPS) mata kuliah ${data.courseName || 'Mata Kuliah'} (${data.courseCode || 'KODE'}, ${data.credits || 3} SKS), instrumen asesmen dirancang terintegrasi berbasis Outcome-Based Education (OBE). Pembobotan penilaian mengombinasikan asesmen proses formatif [${formatif}] dan asesmen akhir sumatif [${sumatif}] dengan standar ambang batas kelulusan (benchmark) ditetapkan sebesar >= ${targetBenchmark.toFixed(2)}%. Seluruh instrumen dilengkapi rubrik kinerja kualitatif dan kuantitatif yang mengukur ranah kognitif, afektif, dan psikomotorik.`;

    // 2. [P] Pelaksanaan
    const defaultPelaksanaan = `[PELAKSANAAN / P] Kegiatan proses belajar mengajar (PBM) diselenggarakan sepanjang Semester ${data.semester || 'Ganjil/Genap'} melibatkan ${totalStudents > 0 ? totalStudents : 85} mahasiswa aktif yang tersebar di ${data.unitClasses.length > 0 ? data.unitClasses.length : 2} unit rombongan belajar paralel. Pelaksanaan pembelajaran mengintegrasikan metode tatap muka, diskusi kelompok terarah, penugasan proyek mandiri, serta praktikum laboratorium. Asesmen dilakukan berkala dengan transparansi kriteria nilai kepada mahasiswa sebelum evaluasi akhir diinput ke sistem.`;

    // 3. [E] Evaluasi CPMK
    const defaultCPMK = `[EVALUASI / E - CPMK] Hasil kalkulasi asesmen ketercapaian menunjukkan capaian agregat sebesar ${avgOverall}%. Rincian ketercapaian per indikator:\n- CPMK Memenuhi Target (>= ${targetBenchmark.toFixed(2)}%): ${cpmkAchievedText}.\n- CPMK Belum Memenuhi Target (< ${targetBenchmark.toFixed(2)}%): ${cpmkUnachievedText}.\nEvaluasi mendalam mengindikasikan bahwa sebagian mahasiswa mengalami tantangan pada instrumen soal tipe analisis mendalam dan sintesis pemecahan masalah kompleks.`;

    // 4. [E] Evaluasi CPL
    const defaultCPL = `[EVALUASI / E - CPL] Kontribusi pemenuhan Capaian Pembelajaran Lulusan (CPL) program studi ${data.studyProgram || 'Program Studi'}:\n- CPL Tercapai dengan Baik: ${cplAchievedText}.\n- CPL Prioritas Perhatian: ${cplUnachievedText}.\nCapaian CPL tertinggi didukung oleh efektivitas pengerjaan tugas berbasis studi kasus dan performa unjuk kerja praktikum laboratorium mahasiswa.`;

    // 5. [P] Pengendalian
    const defaultPengendalian = `[PENGENDALIAN / P] Menindaklanjuti capaian dan deviasi mutu pada komponen berkinerja di bawah benchmark, tim Dosen Pengampu bersama Unit Gugus Kendali Mutu (GKM) melakukan langkah-langkah pengendalian:\n1. Mengidentifikasi mahasiswa dengan nilai kritis dan menyelenggarakan sesi responsi klinik materi sebelum yudisium.\n2. Memberikan remedial terstruktur pada indikator materi CPMK yang belum tuntas.\n3. Melakukan reviu keselarasan tingkat kesulitan soal ujian dengan rubrik acuan OBE.\n4. Melakukan audit berkala terhadap presensi dan partisipasi aktif mahasiswa di kelas.`;

    // 6. [P] Peningkatan / CQI
    const defaultCQI = `[PENINGKATAN / P - CQI] Rencana Tindak Lanjut Berkelanjutan (Continuous Quality Improvement) untuk Siklus Semester Berikutnya:\n1. Revitalisasi Metode Pembelajaran: Memperluas implementasi Case Method dan Team-Based Project (TBP) pada materi esensial CPMK.\n2. Pembaruan Modul & Petunjuk Praktikum: Menyempurnakan modul laboratorium dengan studi kasus riil industri.\n3. Optimalisasi LMS: Memanfaatkan kuis interaktif mingguan di LMS untuk deteksi dini pemahaman konsep sebelum UTS.\n4. Peningkatan Validitas Rubrik: Memperjelas deskriptor rubrik penilaian agar ekspektasi kompetensi dipahami mahasiswa sejak awal perkuliahan.`;

    // 7. Kesimpulan
    const defaultKesimpulan = `Keseluruhan siklus PPEPP (Perencanaan, Pelaksanaan, Evaluasi, Pengendalian, dan Peningkatan) pada mata kuliah ${data.courseName || 'Mata Kuliah'} telah dilaksanakan secara komprehensif dengan nilai rata-rata ketercapaian ${avgOverall}%. Dokumen laporan audit mutu ini disahkan sebagai bukti akuntabilitas pemenuhan standar akreditasi unggul (LAM/BAN-PT).`;

    setModelPenilaian(defaultModel);
    setPelaksanaanPembelajaran(defaultPelaksanaan);
    setAnalisisCPMK(defaultCPMK);
    setAnalisisCPL(defaultCPL);
    setPengendalianMutu(defaultPengendalian);
    setRekomendasiCQI(defaultCQI);
    setKesimpulan(defaultKesimpulan);

    onUpdateNarrative({
      modelPenilaian: defaultModel,
      pelaksanaanPembelajaran: defaultPelaksanaan,
      analisisCPMK: defaultCPMK,
      analisisCPL: defaultCPL,
      pengendalianMutu: defaultPengendalian,
      rekomendasiCQI: defaultCQI,
      kesimpulan: defaultKesimpulan,
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseData: data,
          cpmkResults,
          cplResults,
          targetBenchmark,
        }),
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const parsed = await res.json();
        if (parsed.modelPenilaian) {
          setModelPenilaian(parsed.modelPenilaian);
          setPelaksanaanPembelajaran(parsed.pelaksanaanPembelajaran || '');
          setAnalisisCPMK(parsed.analisisCPMK);
          setAnalisisCPL(parsed.analisisCPL);
          setPengendalianMutu(parsed.pengendalianMutu || '');
          setRekomendasiCQI(parsed.rekomendasiCQI);
          setKesimpulan(parsed.kesimpulan);

          onUpdateNarrative({
            modelPenilaian: parsed.modelPenilaian,
            pelaksanaanPembelajaran: parsed.pelaksanaanPembelajaran,
            analisisCPMK: parsed.analisisCPMK,
            analisisCPL: parsed.analisisCPL,
            pengendalianMutu: parsed.pengendalianMutu,
            rekomendasiCQI: parsed.rekomendasiCQI,
            kesimpulan: parsed.kesimpulan,
          });
          setSavedStatus(true);
          setTimeout(() => setSavedStatus(false), 3000);
          return;
        }
      }
    } catch (err) {
      console.warn('AI call fallback:', err);
    } finally {
      setIsAiLoading(false);
    }

    handleAutoFillDefault();
  };

  const handleSave = () => {
    onUpdateNarrative({
      modelPenilaian,
      pelaksanaanPembelajaran,
      analisisCPMK,
      analisisCPL,
      pengendalianMutu,
      rekomendasiCQI,
      kesimpulan,
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1 border border-emerald-200">
              <FileText className="w-3.5 h-3.5" />
              <span>TAHAP 7: ANALISIS & CONTINUOUS IMPROVEMENT (Naratif)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Analisis Hasil Audit Mutu Akademik & Rencana Tindak Lanjut (CQI)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Narasi akademis komprehensif untuk melengkapi borang akreditasi program studi (LAM & BANPT).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFillDefault}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sintesis Draft Narasi
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              {savedStatus ? 'Tersimpan!' : 'Simpan Narasi'}
            </button>
          </div>
        </div>

        {/* Status Ringkasan Ketercapaian */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Capaian Memenuhi Target (≥ {targetBenchmark.toFixed(2)}%)</span>
            </div>
            <div className="text-xs text-emerald-800 space-y-1">
              <p>
                <strong>CPMK Tercapai ({achievedCPMKs.length}):</strong>{' '}
                {achievedCPMKs.map((c) => `${c.cpmkCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || '-'}
              </p>
              <p>
                <strong>CPL Tercapai ({achievedCPLs.length}):</strong>{' '}
                {achievedCPLs.map((c) => `${c.cplCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || '-'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-xs mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Capaian Di Bawah Target (&lt; {targetBenchmark.toFixed(2)}% - Fokus CQI)</span>
            </div>
            <div className="text-xs text-rose-800 space-y-1">
              <p>
                <strong>CPMK Perlu Evaluasi ({unachievedCPMKs.length}):</strong>{' '}
                {unachievedCPMKs.map((c) => `${c.cpmkCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || 'Semua CPMK Lulus'}
              </p>
              <p>
                <strong>CPL Perlu Evaluasi ({unachievedCPLs.length}):</strong>{' '}
                {unachievedCPLs.map((c) => `${c.cplCode} (${c.capaianAkhir.toFixed(2)}%)`).join(', ') || 'Semua CPL Lulus'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PPEPP Badges Overview */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-bold">Siklus Penjaminan Mutu SPMI (PPEPP):</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">P - Perencanaan</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">P - Pelaksanaan</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">E - Evaluasi</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">P - Pengendalian</span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">P - Peningkatan</span>
        </div>
      </div>

      {/* Editor Formulir Naratif PPEPP */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        {/* 1. Perencanaan */}
        <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">P1</span>
              <span>1. Perencanaan: Model, Kisi-Kisi, dan Instrumen Penilaian RPS</span>
            </label>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Perencanaan (Planning)</span>
          </div>
          <textarea
            rows={3}
            value={modelPenilaian}
            onChange={(e) => setModelPenilaian(e.target.value)}
            placeholder="Jelaskan perencanaan kurikulum RPS, bobot formatif/sumatif, dan rubrik OBE..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* 2. Pelaksanaan */}
        <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">P2</span>
              <span>2. Pelaksanaan: Proses Belajar Mengajar & Pelaksanaan Asesmen Kelas</span>
            </label>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">Pelaksanaan (Implementation)</span>
          </div>
          <textarea
            rows={3}
            value={pelaksanaanPembelajaran}
            onChange={(e) => setPelaksanaanPembelajaran(e.target.value)}
            placeholder="Jelaskan pelaksanaan PBM di unit kelas, metode diskusi/praktikum, dan transparansi asesmen..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 bg-white focus:border-indigo-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* 3. Evaluasi CPMK */}
        <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">E1</span>
              <span>3. Evaluasi: Ketercapaian Hasil CPMK (Gap Analysis & Titik Kendala)</span>
            </label>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Evaluasi (Evaluation)</span>
          </div>
          <textarea
            rows={4}
            value={analisisCPMK}
            onChange={(e) => setAnalisisCPMK(e.target.value)}
            placeholder="Jelaskan CPMK yang melampaui dan belum mencapai target serta akar permasalahannya..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* 4. Evaluasi CPL */}
        <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">E2</span>
              <span>4. Evaluasi: Kontribusi & Pemenuhan CPL Program Studi</span>
            </label>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Evaluasi (Evaluation)</span>
          </div>
          <textarea
            rows={3}
            value={analisisCPL}
            onChange={(e) => setAnalisisCPL(e.target.value)}
            placeholder="Evaluasi dampak capaian mata kuliah terhadap pemenuhan CPL program studi..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* 5. Pengendalian Mutu */}
        <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">P3</span>
              <span>5. Pengendalian: Monitoring Deviasi Mutu & Tindakan Perbaikan Cepat</span>
            </label>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">Pengendalian (Control)</span>
          </div>
          <textarea
            rows={3}
            value={pengendalianMutu}
            onChange={(e) => setPengendalianMutu(e.target.value)}
            placeholder="Jelaskan langkah responsi klinik, remedial indikator, dan monev GKM/Dosen Pengampu..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 bg-white focus:border-rose-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* 6. Peningkatan / CQI */}
        <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">P4</span>
              <span>6. Peningkatan: Rencana Tindak Lanjut Berkelanjutan (CQI) Siklus Depan</span>
            </label>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Peningkatan (Improvement)</span>
          </div>
          <textarea
            rows={4}
            value={rekomendasiCQI}
            onChange={(e) => setRekomendasiCQI(e.target.value)}
            placeholder="Rencana konkret perbaikan semester depan: metode ajar, pembaruan modul praktikum, LMS..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* 7. Kesimpulan Penutup PPEPP */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">✓</span>
              <span>7. Kesimpulan Penutup Siklus Audit Mutu PPEPP</span>
            </label>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Rangkuman Siklus Mutu</span>
          </div>
          <textarea
            rows={3}
            value={kesimpulan}
            onChange={(e) => setKesimpulan(e.target.value)}
            placeholder="Kesimpulan agregat pemenuhan mutu OBE dan rekomendasi akreditasi..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 bg-white focus:border-slate-500 focus:outline-hidden leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
