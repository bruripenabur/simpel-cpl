import React, { useState, useEffect } from 'react';
import { OBEAssessmentData, CourseAuditLog, StageAuditItem, StageAuditStatus } from '../types/obe';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Award,
  Layers,
  Search,
  Printer,
  Sparkles,
  ClipboardList,
  Check,
  CheckCheck,
  Building2,
  Calendar,
  UserCheck,
  Clock,
  FileEdit,
  Save,
  Database,
  History,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import {
  validatePasal47Weighting,
} from '../utils/unpattiAcademicRegulations';
import {
  saveAuditLogToSupabase,
  fetchAuditLogsFromSupabase,
  getSupabaseClient,
} from '../utils/supabaseClient';
import { BeritaAcaraPrintModal } from './BeritaAcaraPrintModal';
import { UserSession } from './LoginPage';

interface GJMAuditorDashboardProps {
  currentCourseData: OBEAssessmentData;
  onReviewCourse: (stageNum: number) => void;
  targetBenchmark?: number;
  userSession?: UserSession | null;
}

const STAGE_DEFINITIONS: Array<{ number: number; name: string; focus: string }> = [
  {
    number: 1,
    name: 'Identifikasi Mata Kuliah & Pemetaan CPL',
    focus: 'Kesesuaian kode, SKS, semester, profil dosen pengampu, dan target CPL prodi.',
  },
  {
    number: 2,
    name: 'Model & Bobot Penilaian (Pasal 47)',
    focus: 'Kepatuhan alokasi Case Method & Team-Based Project ≥ 50% dan Ujian ≤ 50%.',
  },
  {
    number: 3,
    name: 'Matriks Distribusi Bobot Asesmen ke CPMK',
    focus: 'Validitas sebaran bobot per komponen ke CPMK hingga mencapai total 100%.',
  },
  {
    number: 4,
    name: 'Nilai Rata-rata Mahasiswa per Unit Kelas & Gabungan',
    focus: 'Kelengkapan input nilai per kelas, jumlah mahasiswa riil, dan rata-rata terbobot.',
  },
  {
    number: 5,
    name: 'Perhitungan & Analisis Ketercapaian CPMK',
    focus: 'Ketercapaian skor CPMK terhadap benchmark 75.00% dan analisis deviasi capaian.',
  },
  {
    number: 6,
    name: 'Evaluasi & Pemetaan Ketercapaian CPL',
    focus: 'Capaian akumulatif CPL, radar diagram profil lulusan, dan status kelulusan standar.',
  },
  {
    number: 7,
    name: 'Continuous Quality Improvement (CQI) Siklus PPEPP',
    focus: 'Dokumentasi 5 pilar PPEPP, akar masalah, rekomendasi tindakan, dan status perbaikan.',
  },
  {
    number: 8,
    name: 'Portofolio Lengkap & Laporan Akhir Asesmen',
    focus: 'Kelengkapan tanda tangan Kaprodi/Dosen, berita acara pengesahan, dan ekspor dokumen PDF.',
  },
];

export const GJMAuditorDashboard: React.FC<GJMAuditorDashboardProps> = ({
  currentCourseData,
  onReviewCourse,
  targetBenchmark = 75.0,
  userSession,
}) => {
  const [activeTab, setActiveTab] = useState<'stageAuditLog' | 'audit' | 'ppepp' | 'findings' | 'rtk' | 'beritaAcara'>('stageAuditLog');
  const [successToast, setSuccessToast] = useState('');

  // Validate current course against Peraturan Rektor No. 12/2026 Pasal 47
  const validationPasal47 = validatePasal47Weighting(currentCourseData.components);

  // --- LOG AUDIT AUDITOR STATE (Stage 1-8) ---
  const [auditorName, setAuditorName] = useState('Dr. Ir. Semuel Leatemia, M.Si.');
  const [auditorNip, setAuditorNip] = useState('19690815 199403 1 003');
  const [overallConclusion, setOverallConclusion] = useState<'SANGAT_BAIK' | 'BAIK_DENGAN_CATATAN' | 'PERLU_PERBAIKAN'>('SANGAT_BAIK');
  const [overallNotes, setOverallNotes] = useState(
    'Asesmen OBE mata kuliah ini telah memenuhi standar Peraturan Rektor No. 12/2026 dengan bobot partisipatif/proyek mencapai batas aman ≥ 50%. Disarankan mempertahankan konsistensi rubrik penilaian kelompok pada unit kelas paralel.'
  );

  const [stageLogs, setStageLogs] = useState<Record<number, StageAuditItem>>(() => {
    const initial: Record<number, StageAuditItem> = {};
    STAGE_DEFINITIONS.forEach((st) => {
      let defaultStatus: StageAuditStatus = 'compliant';
      let defaultComment = 'Telah diperiksa dan memenuhi standar baku penjaminan mutu asesmen OBE.';

      if (st.number === 2) {
        if (!validationPasal47.isCompliant) {
          defaultStatus = 'minor_finding';
          defaultComment = 'Perlu penyesuaian bobot metode kasus/proyek agar mencapai batas minimum 50% sesuai Pasal 47.';
        } else {
          defaultComment = `Sangat baik: Total alokasi kasus/proyek sebesar ${validationPasal47.participativeAndProjectWeight}%, patuh Pasal 47.`;
        }
      } else if (st.number === 4) {
        defaultComment = 'Distribusi unit kelas lengkap dengan perhitungan rata-rata terbobot yang akurat.';
      } else if (st.number === 7) {
        defaultComment = 'Siklus PPEPP terdokumentasi terstruktur dengan bukti evaluasi dan rencana tindak lanjut.';
      }

      initial[st.number] = {
        stageNumber: st.number,
        stageName: st.name,
        status: defaultStatus,
        comment: defaultComment,
        evaluatedAt: new Date().toISOString(),
        auditorName: 'Auditor Mutu GJM',
      };
    });
    return initial;
  });

  const [isSavingLog, setIsSavingLog] = useState(false);
  const [auditHistory, setAuditHistory] = useState<CourseAuditLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load past audit logs for this course on mount with multi-tenant filtering
  const loadPastAuditLogs = async () => {
    setIsLoadingHistory(true);
    try {
      const filterScope = userSession && userSession.role !== 'admin'
        ? { role: userSession.role, prodiId: userSession.prodiId, facultyId: userSession.facultyId, studyProgram: userSession.prodi, faculty: userSession.faculty }
        : undefined;

      const res = await fetchAuditLogsFromSupabase(currentCourseData.courseCode, undefined, filterScope);
      if (res.success && res.logs) {
        setAuditHistory(res.logs);
      }
    } catch (err) {
      console.warn('Could not fetch audit history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPastAuditLogs();
  }, [currentCourseData.courseCode]);

  const handleUpdateStageComment = (stageNum: number, comment: string) => {
    setStageLogs((prev) => ({
      ...prev,
      [stageNum]: {
        ...prev[stageNum],
        comment,
        evaluatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleUpdateStageStatus = (stageNum: number, status: StageAuditStatus) => {
    setStageLogs((prev) => ({
      ...prev,
      [stageNum]: {
        ...prev[stageNum],
        status,
        evaluatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleSaveAuditLog = async () => {
    setIsSavingLog(true);

    const logPayload: CourseAuditLog = {
      courseCode: currentCourseData.courseCode || 'BDP253425',
      courseName: currentCourseData.courseName || 'Mata Kuliah OBE',
      studyProgram: currentCourseData.studyProgram || userSession?.prodi || 'S1 Budidaya Perairan',
      prodiId: currentCourseData.prodiId || userSession?.prodiId || '54242',
      facultyId: currentCourseData.faculty || userSession?.faculty || 'Fakultas Perikanan dan Ilmu Kelautan',
      academicYear: currentCourseData.academicYear || '2026/2027',
      auditorName,
      auditorNip,
      auditedAt: new Date().toISOString(),
      overallConclusion,
      overallNotes,
      stageLogs,
    };

    try {
      const result = await saveAuditLogToSupabase(logPayload);
      setSuccessToast(result.message);
      await loadPastAuditLogs();
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setSuccessToast(`Gagal menyimpan: ${err.message || 'Kesalahan koneksi'}`);
      setTimeout(() => setSuccessToast(''), 4000);
    } finally {
      setIsSavingLog(false);
    }
  };

  // RTK (Rencana Tindakan Korektif) State - Pasal 119 Ayat (6)
  const [rtkItems, setRtkItems] = useState([
    {
      id: 'RTK-01',
      kts: 'Alokasi rubrik penilaian diskusi kelompok belum terlampir terpisah dalam RPS',
      action: 'Menyusun suplemen rubrik holistik penilaian partisipasi dan diskusi kasus per tatap muka',
      pic: 'Dr. Bruri Melky Laimeheriwa, S.Pi., M.Si. (Dosen Pengampu)',
      indicator: 'Dokumen suplemen rubrik terunggah di portal SIAKAD dan disahkan Kaprodi',
      deadline: '28 Oktober 2026',
      status: 'In Progress',
    },
    {
      id: 'RTK-02',
      kts: 'Pemenuhan bobot Case Method & Proyek Tim wajib dipertahankan ≥ 50% di seluruh kelas paralel',
      action: 'Standardisasi RPS lintas unit kelas bersama Tim Koordinasi Semester (TKS)',
      pic: 'Daniel G. Louhenapessy, S.Pi., M.Sc. (Kaprodi)',
      indicator: 'Seluruh unit kelas 01, 02, 03 memiliki bobot proyek minimal 50% seragam',
      deadline: '20 Oktober 2026',
      status: 'Closed',
    },
    {
      id: 'RTK-03',
      kts: 'Pengawasan presensi mahasiswa di bawah batas minimal 75% tatap muka (Pasal 51 Ayat 3)',
      action: 'Pengiriman notifikasi otomatis warning presensi melalui Dosen Penasehat Akademik (PA)',
      pic: 'Tim Penasehat Akademik (PA)',
      indicator: 'Daftar mahasiswa berisiko telah menerima konseling sebelum ujian akhir',
      deadline: '30 Oktober 2026',
      status: 'In Progress',
    },
  ]);

  const [newRtkKts, setNewRtkKts] = useState('');
  const [newRtkAction, setNewRtkAction] = useState('');
  const [newRtkPic, setNewRtkPic] = useState('Dosen Pengampu');
  const [newRtkDeadline, setNewRtkDeadline] = useState('31 Oktober 2026');

  const handleAddRtk = () => {
    if (!newRtkKts.trim() || !newRtkAction.trim()) return;
    const newItem = {
      id: `RTK-0${rtkItems.length + 1}`,
      kts: newRtkKts,
      action: newRtkAction,
      pic: newRtkPic,
      indicator: 'Tindakan perbaikan terverifikasi oleh tim auditor GJM',
      deadline: newRtkDeadline,
      status: 'In Progress',
    };
    setRtkItems((prev) => [...prev, newItem]);
    setNewRtkKts('');
    setNewRtkAction('');
    setSuccessToast('Item Rencana Tindakan Korektif (RTK) berhasil ditambahkan.');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // PPEPP Checklist State
  const [ppeppChecklist, setPpeppChecklist] = useState([
    {
      code: 'P1',
      stage: 'Perencanaan (P)',
      title: 'Kesesuaian RPS dengan Capaian Pembelajaran Lulusan (CPL)',
      desc: 'RPS memuat deskripsi mata kuliah, peta korelasi CPL terhadap CPMK, dan rubrik asesmen berbasis kriteria.',
      status: 'compliant',
      evidence: 'RPS Dokumen Terverifikasi SPMI',
    },
    {
      code: 'P2',
      stage: 'Perencanaan (P)',
      title: 'Kepatuhan Bobot Penilaian Peraturan Rektor No. 12 Tahun 2026 Pasal 47',
      desc: 'Bobot Metode Pemecahan Kasus (Case Method) dan Proyek Berbasis Tim (Team-Based Project) sekurang-kurangnya 50%.',
      status: validationPasal47.isCompliant ? 'compliant' : 'warning',
      evidence: `Alokasi Kasus/Proyek: ${validationPasal47.participativeAndProjectWeight}% (Wajib ≥50%)`,
    },
    {
      code: 'P3',
      stage: 'Pelaksanaan (P)',
      title: 'Keterlaksanaan Pembelajaran Interaktif & Kolaboratif',
      desc: 'Metode pembelajaran aktif berbasis pemecahan masalah riil sektor perikanan/kelautan dan penugasan terstruktur.',
      status: 'compliant',
      evidence: 'Portofolio Penugasan & Log LMS',
    },
    {
      code: 'E1',
      stage: 'Evaluasi (E)',
      title: 'Pengukuran Ketercapaian CPMK dan CPL Berbasis Standar Acuan',
      desc: 'Analisis gap ketercapaian nilai riil terhadap target benchmark (75.00%) dilakukan secara komprehensif.',
      status: 'compliant',
      evidence: 'Tabel Tahap 5 & Tahap 6 Asesmen OBE',
    },
    {
      code: 'P4',
      stage: 'Pengendalian (P)',
      title: 'Mekanisme Deteksi Deviasi & Program Remedial Terstruktur',
      desc: 'Mahasiswa dengan nilai di bawah batas kelulusan (C < 55) teridentifikasi secara dini untuk perbaikan.',
      status: 'compliant',
      evidence: 'Analisis Portofolio Individu Mahasiswa',
    },
    {
      code: 'P5',
      stage: 'Peningkatan (P)',
      title: 'Continuous Quality Improvement (CQI) Berbasis Bukti Nyata',
      desc: 'Rekomendasi tindak lanjut terdokumentasi untuk penyempurnaan silabus dan kurikulum semester berikutnya.',
      status: 'compliant',
      evidence: 'Formulir PPEPP Tahap 7 Disetujui Kaprodi',
    },
  ]);

  // Audit Findings (Temuan AMI)
  const [findings, setFindings] = useState([
    {
      id: 'F-01',
      category: 'Kesesuaian (KS)',
      item: 'Pemenuhan Alokasi Bobot Pasal 47 Ayat (3)',
      desc: 'Mata kuliah telah mengalokasikan 55% bobot penilaian pada metode studi kasus dan proyek tim terstruktur.',
      status: 'Closed',
    },
    {
      id: 'F-02',
      category: 'Observasi (OB)',
      item: 'Rubrik Penilaian Partisipasi Mahasiswa',
      desc: 'Disarankan mendokumentasikan rubrik penilaian keaktifan diskusi kasus dalam lampiran RPS secara terpisah.',
      status: 'Open',
    },
  ]);

  const [newFindingText, setNewFindingText] = useState('');
  const [newFindingCategory, setNewFindingCategory] = useState<'Kesesuaian (KS)' | 'Observasi (OB)' | 'KTS Minor'>('Observasi (OB)');

  const handleAddFinding = () => {
    if (!newFindingText.trim()) return;
    const item = {
      id: `F-0${findings.length + 1}`,
      category: newFindingCategory,
      item: newFindingText.slice(0, 40) + '...',
      desc: newFindingText,
      status: 'Open',
    };
    setFindings((prev) => [...prev, item]);
    setNewFindingText('');
    setSuccessToast('Temuan audit berhasil ditambahkan ke dalam Berita Acara AMI.');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handlePrintBeritaAcara = () => {
    setIsPrintModalOpen(true);
  };

  const supabaseConnected = Boolean(getSupabaseClient());

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-white hover:text-emerald-200 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner - Auditor & GJM View */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">DASHBOARD KHUSUS AUDITOR MUTU INTERNAL &amp; GJM</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
              Gugus Jaminan Mutu (GJM) &amp; Tim AMI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Fakultas Perikanan dan Ilmu Kelautan, Universitas Pattimura. Audit kepatuhan standar penilaian hasil belajar berdasarkan <strong>Peraturan Rektor Nomor 12 Tahun 2026 Pasal 47</strong> dan verifikasi siklus PPEPP.
            </p>
            <div className="text-xs text-slate-400 flex items-center gap-2 pt-1 flex-wrap">
              <span>Auditor Mutu Terakreditasi:</span>
              <strong className="text-white font-semibold">
                Tim Gugus Jaminan Mutu (GJM) FPIK Unpatti
              </strong>
              <span>• Kode Audit: AMI-OBE-2026/01</span>
              {supabaseConnected ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                  <Database className="w-3 h-3" /> Supabase Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400 font-medium bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800">
                  <Database className="w-3 h-3" /> Penyimpanan Lokal (Offline Ready)
                </span>
              )}
            </div>
          </div>

          {/* Auditor Quick Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full xl:w-auto shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold truncate block">
                Kepatuhan Pasal 47
              </span>
              <span className="text-base font-black text-emerald-400 mt-0.5 truncate block">
                {validationPasal47.isCompliant ? '100% PATUH' : 'PERINGATAN'}
              </span>
              <span className="text-[10px] text-slate-300 truncate block">Proyek ≥ 50%</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold truncate block">
                Siklus PPEPP
              </span>
              <span className="text-base font-black text-sky-400 mt-0.5 truncate block">5 / 5 Tahap</span>
              <span className="text-[10px] text-emerald-400 font-semibold truncate block">Terpenuhi Penuh</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center col-span-2 sm:col-span-1 min-w-0 overflow-hidden flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold truncate block">
                Status Kelayakan
              </span>
              <span className="text-base font-black text-emerald-400 mt-0.5 truncate block">LAYAK</span>
              <span className="text-[10px] text-slate-300 truncate block">Rekomendasi Akreditasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs scrollbar-none">
        {/* TAB 1: LOG AUDIT AUDITOR (STAGE 1-8) - HIGHLIGHTED */}
        <button
          onClick={() => setActiveTab('stageAuditLog')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'stageAuditLog'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Log Audit Auditor (Stage 1-8)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-800 text-emerald-100">
            Supabase
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Audit Kepatuhan Pasal 47</span>
        </button>

        <button
          onClick={() => setActiveTab('ppepp')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'ppepp'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriks Siklus PPEPP</span>
        </button>

        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'findings'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Temuan &amp; Rekomendasi AMI</span>
        </button>

        <button
          onClick={() => setActiveTab('rtk')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'rtk'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Monitoring RTK (Pasal 119)</span>
        </button>

        <button
          onClick={() => setActiveTab('beritaAcara')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === 'beritaAcara'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Berita Acara Audit Mutu</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB: LOG AUDIT AUDITOR (STAGE 1-8)                                        */}
      {/* ========================================================================= */}
      {activeTab === 'stageAuditLog' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-300">
                    Fitur Penjaminan Mutu GJM
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Mata Kuliah: {currentCourseData.courseCode}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Log Audit &amp; Catatan Evaluasi per Tahap (Stage 1 s/d 8)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auditor dapat memberikan komentar per-bagian pada mata kuliah yang sedang diaudit, kemudian menyimpannya langsung ke database Supabase sebagai riwayat rekam jejak mutu.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAuditLog}
                  disabled={isSavingLog}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSavingLog ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Log Audit ke Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Course & Auditor Metadata Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mata Kuliah Diaudit</span>
                <span className="font-extrabold text-slate-900 block truncate mt-0.5">
                  {currentCourseData.courseName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {currentCourseData.courseCode} • {currentCourseData.credits} SKS
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dosen Pengampu / Auditee</span>
                <span className="font-extrabold text-slate-900 block truncate mt-0.5">
                  {currentCourseData.lecturerName}
                </span>
                <span className="text-[11px] text-slate-500">
                  NIP. {currentCourseData.lecturerNip}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Auditor GJM</span>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs w-full mt-0.5"
                />
                <span className="text-[10px] text-slate-400 block mt-1">NIP:</span>
                <input
                  type="text"
                  value={auditorNip}
                  onChange={(e) => setAuditorNip(e.target.value)}
                  className="font-mono text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] w-full"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Program Studi &amp; Tahun</span>
                <span className="font-extrabold text-slate-900 block truncate mt-0.5">
                  {currentCourseData.studyProgram}
                </span>
                <span className="text-[11px] text-slate-500">
                  Tahun Akademik: {currentCourseData.academicYear}
                </span>
              </div>
            </div>
          </div>

          {/* STAGE-BY-STAGE REVIEW CARDS (1 to 8) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                <span>Instrumen Catatan Evaluasi Per-Bagian (Tahap 1 - 8)</span>
              </h4>
              <span className="text-xs text-slate-500">
                Periksa setiap bagian lalu berikan status &amp; catatan rekomendasi
              </span>
            </div>

            <div className="space-y-3.5">
              {STAGE_DEFINITIONS.map((def) => {
                const currentItem = stageLogs[def.number] || {
                  stageNumber: def.number,
                  stageName: def.name,
                  status: 'compliant' as StageAuditStatus,
                  comment: '',
                };

                const statusStyles: Record<StageAuditStatus, { bg: string; text: string; border: string; label: string }> = {
                  compliant: {
                    bg: 'bg-emerald-50 text-emerald-800',
                    border: 'border-emerald-300',
                    text: 'text-emerald-700',
                    label: 'Memenuhi Standar (KS)',
                  },
                  minor_finding: {
                    bg: 'bg-amber-50 text-amber-800',
                    border: 'border-amber-300',
                    text: 'text-amber-700',
                    label: 'Temuan Observasi / Minor (OB)',
                  },
                  major_finding: {
                    bg: 'bg-rose-50 text-rose-800',
                    border: 'border-rose-300',
                    text: 'text-rose-700',
                    label: 'Ketidaksesuaian Mayor (KTS)',
                  },
                  not_reviewed: {
                    bg: 'bg-slate-100 text-slate-600',
                    border: 'border-slate-200',
                    text: 'text-slate-500',
                    label: 'Belum Diaudit',
                  },
                };

                return (
                  <div
                    key={def.number}
                    className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-800 border border-emerald-300/40 font-black text-xs flex items-center justify-center shrink-0">
                          {def.number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700">
                              Tahap {def.number}
                            </span>
                            <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {def.name}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {def.focus}
                          </p>
                        </div>
                      </div>

                      {/* Direct jump to stage button */}
                      <button
                        type="button"
                        onClick={() => onReviewCourse(def.number)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                        title="Buka dan tinjau tampilan data Tahap ini"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tinjau Tahap {def.number}</span>
                      </button>
                    </div>

                    {/* Status radio / buttons */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                      <span className="text-[11px] font-bold text-slate-500">Status Mutu:</span>
                      {(['compliant', 'minor_finding', 'major_finding', 'not_reviewed'] as StageAuditStatus[]).map(
                        (stKey) => {
                          const isSelected = currentItem.status === stKey;
                          const info = statusStyles[stKey];
                          return (
                            <button
                              key={stKey}
                              type="button"
                              onClick={() => handleUpdateStageStatus(def.number, stKey)}
                              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer border ${
                                isSelected
                                  ? `${info.bg} ${info.border} font-extrabold ring-1 ring-emerald-500/30`
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {info.label}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Auditor Comment Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Catatan &amp; Komentar Auditor untuk Tahap {def.number}:
                      </label>
                      <textarea
                        rows={2}
                        value={currentItem.comment}
                        onChange={(e) => handleUpdateStageComment(def.number, e.target.value)}
                        placeholder={`Tuliskan catatan kepatuhan atau temuan perbaikan untuk ${def.name}...`}
                        className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Conclusion & Notes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Kesimpulan Akhir &amp; Rekomendasi Tim Penjaminan Mutu</span>
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Predikat Kesimpulan Hasil Audit:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOverallConclusion('SANGAT_BAIK')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      overallConclusion === 'SANGAT_BAIK'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">SANGAT BAIK</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      Memenuhi standar akreditasi unggul tanpa temuan mayor
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverallConclusion('BAIK_DENGAN_CATATAN')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      overallConclusion === 'BAIK_DENGAN_CATATAN'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">BAIK DENGAN CATATAN</div>
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      Terdapat observasi / saran perbaikan minor
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverallConclusion('PERLU_PERBAIKAN')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      overallConclusion === 'PERLU_PERBAIKAN'
                        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 text-rose-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">PERLU PERBAIKAN</div>
                    <div className="text-[10px] text-rose-700 mt-0.5">
                      Terdapat ketidaksesuaian mayor wajib RTK
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Menyeluruh Gugus Jaminan Mutu (GJM):
                </label>
                <textarea
                  rows={3}
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  placeholder="Tuliskan rekomendasi resmi GJM untuk auditee dan ketua program studi..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Action save button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Data akan disimpan ke database.</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAuditLog}
                  disabled={isSavingLog}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSavingLog ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Catatan Audit ke Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Past Audit Logs History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-extrabold text-slate-900">
                  Riwayat Catatan Audit Mutu Tersimpan ({auditHistory.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={loadPastAuditLogs}
                disabled={isLoadingHistory}
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Segarkan Riwayat</span>
              </button>
            </div>

            {auditHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada riwayat audit tersimpan untuk mata kuliah ini di database. Silakan klik &quot;Simpan Catatan Audit ke Supabase&quot; di atas.
              </div>
            ) : (
              <div className="space-y-3">
                {auditHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {item.courseCode} - {item.courseName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.overallConclusion === 'SANGAT_BAIK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.overallConclusion === 'BAIK_DENGAN_CATATAN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.overallConclusion.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.auditedAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed italic">
                      &quot;{item.overallNotes}&quot;
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-200/70">
                      <span>Auditor: <strong>{item.auditorName}</strong></span>
                      <span>•</span>
                      <span>NIP: {item.auditorNip}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Audit Kepatuhan Pasal 47 */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Audit Kepatuhan Peraturan Rektor No. 12 Tahun 2026 Pasal 47</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mata Kuliah: <strong>{currentCourseData.courseCode} - {currentCourseData.courseName}</strong> (Dosen Pengampu: {currentCourseData.lecturerName})
              </p>
            </div>
            <button
              onClick={() => onReviewCourse(2)}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-auto"
            >
              Lihat Tahap 2 (Model Penilaian) →
            </button>
          </div>

          {/* Compliance Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Case Method & Team Project */}
            <div className={`p-4 rounded-xl border ${
              validationPasal47.isProjectCompliant
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-rose-50/60 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Pasal 47 Ayat (3): Proyek &amp; Kasus
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  validationPasal47.isProjectCompliant
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {validationPasal47.isProjectCompliant ? 'PATUH' : 'TIDAK PATUH'}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {validationPasal47.participativeAndProjectWeight}%
                </span>
                <span className="text-xs text-slate-500 ml-1.5">/ Minimal 50.0%</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                {validationPasal47.isProjectCompliant
                  ? 'Komponen Case Method dan Team-Based Project telah memenuhi syarat minimal 50%.'
                  : 'Bobot Case Method dan Team-Based Project masih di bawah batas wajib 50%.'}
              </p>
            </div>

            {/* Card 2: Cognitive & Exam Weight */}
            <div className={`p-4 rounded-xl border ${
              validationPasal47.isExamCompliant
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-rose-50/60 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Pasal 47 Ayat (4): Kognitif &amp; Ujian
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  validationPasal47.isExamCompliant
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {validationPasal47.isExamCompliant ? 'PATUH' : 'TIDAK PATUH'}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {validationPasal47.cognitiveAndExamWeight}%
                </span>
                <span className="text-xs text-slate-500 ml-1.5">/ Maksimal 50.0%</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                {validationPasal47.isExamCompliant
                  ? 'Komponen kognitif (tugas, kuis, UTS, UAS) berada dalam batas aman maksimal 50%.'
                  : 'Bobot ujian dan kognitif melebihi batas toleransi maksimal 50%.'}
              </p>
            </div>

            {/* Card 3: Total Weight Sum */}
            <div className={`p-4 rounded-xl border ${
              validationPasal47.isTotal100
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-rose-50/60 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase">
                  Total Grand Bobot Asesmen
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  validationPasal47.isTotal100
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {validationPasal47.isTotal100 ? 'VALID' : 'TIDAK VALID'}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {validationPasal47.totalWeight}%
                </span>
                <span className="text-xs text-slate-500 ml-1.5">/ Wajib 100%</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                {validationPasal47.isTotal100
                  ? 'Grand total alokasi seluruh komponen asesmen tepat bernilai 100%.'
                  : 'Total bobot belum seimbang (harus bernilai tepat 100%).'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Matriks PPEPP */}
      {activeTab === 'ppepp' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Matriks Verifikasi Siklus PPEPP Standar SPMI Unpatti
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Penetapan (P), Pelaksanaan (P), Evaluasi (E), Pengendalian (P), dan Peningkatan (P)
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {ppeppChecklist.map((item) => (
              <div key={item.code} className="py-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono">
                      {item.code}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      [{item.stage}] {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {item.desc}
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <strong className="text-slate-700">Bukti Verifikasi:</strong>
                    <span>{item.evidence}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                  item.status === 'compliant'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.status === 'compliant' ? 'Terverifikasi' : 'Perlu Atensi'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Temuan AMI */}
      {activeTab === 'findings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Daftar Temuan Audit Mutu Internal (AMI) &amp; Rekomendasi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klasifikasi temuan: Kesesuaian (KS), Observasi (OB), dan Ketidaksesuaian (KTS)
            </p>
          </div>

          <div className="space-y-3">
            {findings.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{f.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      f.category.includes('Kesesuaian')
                        ? 'bg-emerald-100 text-emerald-800'
                        : f.category.includes('Observasi')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {f.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{f.item}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  f.status === 'Closed' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-600 text-white'
                }`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>

          {/* Form Tambah Temuan */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Tambah Temuan Audit Baru:</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={newFindingCategory}
                  onChange={(e: any) => setNewFindingCategory(e.target.value)}
                  className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Kesesuaian (KS)">Kesesuaian (KS)</option>
                  <option value="Observasi (OB)">Observasi (OB)</option>
                  <option value="KTS Minor">Ketidaksesuaian (KTS Minor)</option>
                </select>
                <input
                  type="text"
                  value={newFindingText}
                  onChange={(e) => setNewFindingText(e.target.value)}
                  placeholder="Deskripsi temuan atau observasi baru..."
                  className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddFinding}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Tambah Temuan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: RTK Monitoring */}
      {activeTab === 'rtk' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Monitoring Rencana Tindakan Korektif (RTK) - Peraturan Rektor No. 12/2026 Pasal 119
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tindak lanjut perbaikan terhadap temuan audit mutu internal untuk menjamin Continuous Quality Improvement.
            </p>
          </div>

          <div className="space-y-3">
            {rtkItems.map((rtk) => (
              <div
                key={rtk.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">{rtk.id}</span>
                    <span className="font-bold text-slate-900">{rtk.kts}</span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Tindakan:</strong> {rtk.action}
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>PIC: {rtk.pic}</span>
                    <span>•</span>
                    <span>Tenggat: {rtk.deadline}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 self-start md:self-auto ${
                  rtk.status === 'Closed' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-600 text-white'
                }`}>
                  {rtk.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Tambah Rencana Tindakan Korektif (RTK):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newRtkKts}
                onChange={(e) => setNewRtkKts(e.target.value)}
                placeholder="Uraian temuan atau ketidaksesuaian..."
                className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
              <input
                type="text"
                value={newRtkAction}
                onChange={(e) => setNewRtkAction(e.target.value)}
                placeholder="Rencana tindakan korektif perbaikan..."
                className="text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddRtk}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Simpan RTK Baru
            </button>
          </div>
        </div>
      )}

      {/* Tab: Berita Acara Audit Mutu */}
      {activeTab === 'beritaAcara' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Berita Acara Hasil Audit Mutu Internal (AMI) Asesmen OBE
              </h3>
              <p className="text-xs text-slate-500">
                Dokumen Resmi Gugus Jaminan Mutu FPIK Universitas Pattimura
              </p>
            </div>
            <button
              onClick={handlePrintBeritaAcara}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara</span>
            </button>
          </div>

          {/* Preview Berita Acara */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-300 text-slate-800 text-xs leading-relaxed space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-slate-300">
              <h4 className="font-bold text-sm tracking-wide text-slate-900">
                UNIVERSITAS PATTIMURA • FAKULTAS PERIKANAN DAN ILMU KELAUTAN
              </h4>
              <p className="text-[11px] text-slate-600 font-semibold">
                GUGUS JAMINAN MUTU (GJM) &amp; AUDITOR MUTU INTERNAL (AMI)
              </p>
              <p className="text-[10px] text-slate-500">
                BERITA ACARA AUDIT KEPATUHAN ASESMEN KURIKULUM BERBASIS OUTCOME (OBE)
              </p>
            </div>

            <p>
              Pada hari ini, <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, telah dilaksanakan Audit Mutu Internal terhadap penyelenggaraan asesmen OBE untuk mata kuliah:
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg border border-slate-200 text-[11px]">
              <div>Mata Kuliah: <strong>{currentCourseData.courseName}</strong></div>
              <div>Kode Mata Kuliah: <strong>{currentCourseData.courseCode} ({currentCourseData.credits} SKS)</strong></div>
              <div>Dosen Pengampu: <strong>{currentCourseData.lecturerName}</strong></div>
              <div>Program Studi: <strong>{currentCourseData.studyProgram}</strong></div>
              <div>Rata-rata Capaian CPMK: <strong>81.4% (Tercapai)</strong></div>
              <div>Rata-rata Capaian CPL: <strong>78.5% (Tercapai ≥ 75%)</strong></div>
            </div>

            <p className="font-semibold text-slate-900">
              HASIL AUDIT KEPATUHAN PERATURAN REKTOR NOMOR 12 TAHUN 2026 PASAL 47:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>
                Bobot Metode Pemecahan Kasus dan Proyek Berbasis Tim: <strong>{validationPasal47.participativeAndProjectWeight}%</strong> (Memenuhi ketentuan sekurang-kurangnya 50%).
              </li>
              <li>
                Bobot Komponen Kognitif/Ujian: <strong>{validationPasal47.cognitiveAndExamWeight}%</strong> (Memenuhi ketentuan paling banyak 50%).
              </li>
              <li>
                Siklus Penjaminan Mutu PPEPP: <strong>Lengkap 5 Tahap (P-P-E-P-P)</strong>.
              </li>
              <li>
                Status Rekomendasi Audit: <strong className="text-emerald-700">MEMENUHI STANDAR MUTU AKADEMIK UNPATTI DENGAN PREDIKAT BAIK SEKALI</strong>.
              </li>
            </ul>

            <div className="pt-6 grid grid-cols-2 text-center text-xs">
              <div>
                <p>Auditee (Dosen Pengampu),</p>
                <div className="h-14" />
                <p className="font-bold underline text-slate-900">{currentCourseData.lecturerName}</p>
                <p className="text-slate-500">NIP. {currentCourseData.lecturerNip || '19880412 201504 1 002'}</p>
              </div>
              <div>
                <p>Lead Auditor GJM FPIK,</p>
                <div className="h-14" />
                <p className="font-bold underline text-slate-900">{auditorName}</p>
                <p className="text-slate-500">NIP. {auditorNip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak & Ekspor Berita Acara AMI */}
      <BeritaAcaraPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        currentCourseData={currentCourseData}
        auditorName={auditorName}
        auditorNip={auditorNip}
        validationPasal47={validationPasal47}
        auditFindings={findings.map((f) => ({
          id: f.id,
          kategori: f.category,
          deskripsi: f.desc,
          status: f.status,
        }))}
        overallNotes={overallNotes}
      />
    </div>
  );
};
