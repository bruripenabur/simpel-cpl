import React, { useState } from 'react';
import { OBEAssessmentData } from '../types/obe';
import {
  Award,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  Users,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Send,
  Eye,
  Download,
  Filter,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  Layers,
  Clock,
  Bell,
  Search,
  CheckSquare,
  AlertCircle,
  Share2,
  Copy,
} from 'lucide-react';
import { getProdiShareableLink, copyToClipboard } from '../utils/prodiHelper';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  validatePasal47Weighting,
  getGradeSarjanaUnpatti2026,
} from '../utils/unpattiAcademicRegulations';
import { CentralAdminOBEDashboard } from './CentralAdminOBEDashboard';
import { CPLSemesterTrendBarChart } from './CPLSemesterTrendBarChart';
import { ComponentGapAnalysisChart } from './ComponentGapAnalysisChart';
import { isUniversalPortalLocked } from '../utils/prodiHelper';

import { UserSession } from './LoginPage';

interface KaprodiDashboardProps {
  currentCourseData: OBEAssessmentData;
  onReviewCourse: (stageNum: number) => void;
  targetBenchmark?: number;
  componentTotalAverages?: Record<string, number>;
  userSession?: UserSession | null;
}

interface CourseApprovalItem {
  code: string;
  name: string;
  lecturer: string;
  sks: number;
  semester: string;
  cplAverage: number;
  caseAndProjectWeight: number;
  status: 'pending' | 'approved' | 'revision';
  approvedDate?: string;
  notes?: string;
}

interface LecturerMonitoringItem {
  nip: string;
  name: string;
  courses: string[];
  statusUpload: 'Lengkap' | 'Menunggu' | 'Terlambat';
  lastActivity: string;
  compliancePasal47: boolean;
  totalStudents: number;
}

export const KaprodiDashboard: React.FC<KaprodiDashboardProps> = ({
  currentCourseData,
  onReviewCourse,
  targetBenchmark = 75.0,
  componentTotalAverages = {},
  userSession,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'executive' | 'curriculum' | 'monitoring' | 'approval' | 'central-summary'>('executive');
  const [cplBarViewMode, setCplBarViewMode] = useState<'grouped' | 'focused'>('grouped');
  const [selectedCplForBar, setSelectedCplForBar] = useState<'cpl1' | 'cpl2' | 'cpl3' | 'cpl4' | 'cpl5'>('cpl1');
  const [cplBarSemesterRange, setCplBarSemesterRange] = useState<4 | 6>(6);

  const [courses, setCourses] = useState<CourseApprovalItem[]>([
    {
      code: currentCourseData.courseCode || 'BDP253425',
      name: currentCourseData.courseName || 'Dasar-Dasar Genetika Ikan',
      lecturer: 'Dr. Bruri Melky Laimeheriwa, S.Pi., M.Si.',
      sks: currentCourseData.credits || 3,
      semester: currentCourseData.semester || 'Ganjil 2024/2025',
      cplAverage: 78.5,
      caseAndProjectWeight: 55.0,
      status: 'pending',
      notes: '',
    },
    {
      code: 'BDP344',
      name: 'Genetika & Pemuliaan Ikan',
      lecturer: 'Dr. Bruri Melky Laimeheriwa, S.Pi., M.Si.',
      sks: 3,
      semester: 'Genap 2024/2025',
      cplAverage: 79.8,
      caseAndProjectWeight: 55.0,
      status: 'approved',
      approvedDate: '12 Oktober 2026',
      notes: 'Laporan asesmen telah memenuhi seluruh standar capaian CPL prodi dan regulasi Pasal 47.',
    },
    {
      code: 'BDP102',
      name: 'Fisiologi Biota Perairan',
      lecturer: 'Tim Dosen FPIK Unpatti',
      sks: 3,
      semester: 'Ganjil 2024/2025',
      cplAverage: 76.2,
      caseAndProjectWeight: 50.0,
      status: 'approved',
      approvedDate: '08 Oktober 2026',
      notes: 'Disahkan untuk pemenuhan portofolio akreditasi program studi.',
    },
    {
      code: 'BDP205',
      name: 'Manajemen Kualitas Air Budidaya',
      lecturer: 'Tim Dosen FPIK Unpatti',
      sks: 3,
      semester: 'Ganjil 2024/2025',
      cplAverage: 77.4,
      caseAndProjectWeight: 52.0,
      status: 'approved',
      approvedDate: '09 Oktober 2026',
      notes: 'Disahkan dengan catatan peningkatan sarana pengukuran kualitas air.',
    },
  ]);

  // Lecturer Monitoring Data (Pasal 51 & Pasal 97)
  const [lecturers, setLecturers] = useState<LecturerMonitoringItem[]>([
    {
      nip: '19660228 199103 1 002',
      name: 'Dr. Bruri Melky Laimeheriwa, S.Pi., M.Si.',
      courses: ['BDP253425 - Dasar-Dasar Genetika Ikan', 'BDP344 - Genetika & Pemuliaan Ikan'],
      statusUpload: 'Lengkap',
      lastActivity: '15 Okt 2026, 14:20 WIT',
      compliancePasal47: true,
      totalStudents: 104,
    },
    {
      nip: '19710314 199702 1 001',
      name: 'Prof. Dr. Ir. Marcus Tupamahu, M.Si.',
      courses: ['BDP102 - Fisiologi Biota Perairan'],
      statusUpload: 'Lengkap',
      lastActivity: '14 Okt 2026, 10:15 WIT',
      compliancePasal47: true,
      totalStudents: 88,
    },
    {
      nip: '19750918 200212 1 003',
      name: 'Dr. Ir. Johana Pattipeilohy, M.Si.',
      courses: ['BDP205 - Manajemen Kualitas Air Budidaya'],
      statusUpload: 'Lengkap',
      lastActivity: '14 Okt 2026, 16:45 WIT',
      compliancePasal47: true,
      totalStudents: 92,
    },
    {
      nip: '19800412 200604 1 002',
      name: 'Ir. Pieter Wattimena, M.App.Sc.',
      courses: ['BDP301 - Nutrisi & Pakan Ikan'],
      statusUpload: 'Menunggu',
      lastActivity: '11 Okt 2026, 09:10 WIT',
      compliancePasal47: true,
      totalStudents: 75,
    },
    {
      nip: '19821105 200812 2 001',
      name: 'Dr. Martha Lekahena, S.Pi., M.Si.',
      courses: ['BDP402 - Penyakit Biota Akuatik'],
      statusUpload: 'Menunggu',
      lastActivity: '08 Okt 2026, 11:30 WIT',
      compliancePasal47: false,
      totalStudents: 60,
    },
  ]);

  const [selectedCourseForApproval, setSelectedCourseForApproval] =
    useState<CourseApprovalItem | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeProdiName = userSession?.prodi || currentCourseData.studyProgram || 'S1 Budidaya Perairan';
  const activeFaculty = userSession?.faculty || currentCourseData.faculty || 'Fakultas Perikanan dan Ilmu Kelautan';
  const activeKaprodiName = userSession?.name || currentCourseData.headOfStudyProgram || 'Daniel G. Louhenapessy, S.Pi., M.Sc.';
  const activeProdiId = userSession?.prodiId || '54242';

  const handleCopyProdiLink = async () => {
    // Generate direct portal locking link using code or slug
    const link = getProdiShareableLink(activeProdiId);
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedLink(true);
      setSuccessToast(`Link portal terkunci untuk ${activeProdiName} (ID: ${activeProdiId}) berhasil disalin!`);
      setTimeout(() => {
        setCopiedLink(false);
        setSuccessToast('');
      }, 4000);
    }
  };

  // Aggregated CPL Data across the entire Study Program
  const prodiCPLRadarData = [
    {
      cpl: 'CPL-01',
      kategori: 'Sikap',
      deskripsi: 'Sikap & Etika Konservasi Sumberdaya Hayati Perairan',
      capaianProdi: 82.5,
      target: targetBenchmark,
    },
    {
      cpl: 'CPL-02',
      kategori: 'Pengetahuan',
      deskripsi: 'Penguasaan Konsep Teoritis Sains Akuakultur',
      capaianProdi: 76.8,
      target: targetBenchmark,
    },
    {
      cpl: 'CPL-03',
      kategori: 'Keterampilan Umum',
      deskripsi: 'Analisis Kuantitatif & Pemecahan Masalah Ilmiah',
      capaianProdi: 79.4,
      target: targetBenchmark,
    },
    {
      cpl: 'CPL-04',
      kategori: 'Keterampilan Khusus',
      deskripsi: 'Aplikasi Rekayasa & Bioteknologi Budidaya Perairan',
      capaianProdi: 75.2,
      target: targetBenchmark,
    },
    {
      cpl: 'CPL-05',
      kategori: 'Keterampilan Khusus',
      deskripsi: 'Kewirausahaan Akuakultur Berkelanjutan & Manajemen Mutu',
      capaianProdi: 80.1,
      target: targetBenchmark,
    },
  ];

  // Curriculum Map (Matriks Mata Kuliah vs CPL)
  const curriculumMap = [
    {
      courseCode: 'BDP253425',
      courseName: 'Dasar-Dasar Genetika Ikan',
      sks: 3,
      semester: 3,
      cpls: { 'CPL-01': 'Kuat', 'CPL-02': 'Kuat', 'CPL-03': 'Sedang', 'CPL-04': 'Kuat', 'CPL-05': 'Sedang' },
    },
    {
      courseCode: 'BDP344',
      courseName: 'Genetika & Pemuliaan Ikan',
      sks: 3,
      semester: 5,
      cpls: { 'CPL-01': 'Sedang', 'CPL-02': 'Kuat', 'CPL-03': 'Kuat', 'CPL-04': 'Kuat', 'CPL-05': 'Sedang' },
    },
    {
      courseCode: 'BDP102',
      courseName: 'Fisiologi Biota Perairan',
      sks: 3,
      semester: 1,
      cpls: { 'CPL-01': 'Kuat', 'CPL-02': 'Kuat', 'CPL-03': 'Sedang', 'CPL-04': 'Sedang', 'CPL-05': 'Kurang' },
    },
    {
      courseCode: 'BDP205',
      courseName: 'Manajemen Kualitas Air Budidaya',
      sks: 3,
      semester: 3,
      cpls: { 'CPL-01': 'Kuat', 'CPL-02': 'Kuat', 'CPL-03': 'Kuat', 'CPL-04': 'Kuat', 'CPL-05': 'Sedang' },
    },
    {
      courseCode: 'BDP301',
      courseName: 'Nutrisi & Pakan Ikan',
      sks: 3,
      semester: 4,
      cpls: { 'CPL-01': 'Sedang', 'CPL-02': 'Kuat', 'CPL-03': 'Sedang', 'CPL-04': 'Kuat', 'CPL-05': 'Kuat' },
    },
    {
      courseCode: 'BDP402',
      courseName: 'Penyakit Biota Akuatik',
      sks: 3,
      semester: 6,
      cpls: { 'CPL-01': 'Sedang', 'CPL-02': 'Kuat', 'CPL-03': 'Kuat', 'CPL-04': 'Kuat', 'CPL-05': 'Sedang' },
    },
  ];

  // Grade Distribution across Study Program according to Peraturan Rektor No 12/2026 Pasal 47
  const prodiGradeDistribution = [
    {
      grade: 'A (4.00)',
      rentang: '85 - 100',
      kategori: 'Sangat Baik',
      persentase: 36.5,
      count: 146,
      fill: '#10b981',
    },
    {
      grade: 'B (3.00)',
      rentang: '70 - 84.99',
      kategori: 'Baik',
      persentase: 48.2,
      count: 193,
      fill: '#3b82f6',
    },
    {
      grade: 'C (2.00)',
      rentang: '55 - 69.99',
      kategori: 'Cukup',
      persentase: 11.8,
      count: 47,
      fill: '#f59e0b',
    },
    {
      grade: 'D (1.00)',
      rentang: '40 - 54.99',
      kategori: 'Kurang',
      persentase: 2.5,
      count: 10,
      fill: '#f43f5e',
    },
    {
      grade: 'E (0.00)',
      rentang: '0 - 39.99',
      kategori: 'Gagal',
      persentase: 1.0,
      count: 4,
      fill: '#991b1b',
    },
  ];

  const handleApproveCourse = (code: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.code === code
          ? {
              ...c,
              status: 'approved',
              approvedDate: new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              notes: approvalNote || 'Disahkan oleh Ketua Program Studi sesuai standar asesmen OBE.',
            }
          : c
      )
    );
    setSelectedCourseForApproval(null);
    setApprovalNote('');
    setSuccessToast(`Laporan mata kuliah ${code} berhasil disahkan secara resmi oleh Kaprodi!`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleRequestRevision = (code: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.code === code
          ? {
              ...c,
              status: 'revision',
              notes: approvalNote || 'Perlu penyesuaian bobot atau kelengkapan analisis PPEPP.',
            }
          : c
      )
    );
    setSelectedCourseForApproval(null);
    setApprovalNote('');
    setSuccessToast(`Permintaan revisi telah diteruskan ke Dosen Pengampu.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleSendReminder = (lecturerName: string) => {
    setSuccessToast(`Pengingat kalender akademik berhasil dikirimkan ke ${lecturerName} via notifikasi SIAKAD.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Success Notification */}
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

      {/* Header Banner - Executive Study Program View */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="truncate">DASHBOARD KHUSUS KETUA PROGRAM STUDI (KAPRODI)</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
              Program Studi {activeProdiName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {activeFaculty}, Universitas Pattimura. Pemantauan ketercapaian Profil Lulusan (CPL Pasal 72), audit sebaran nilai mutu (Pasal 47), monitoring batas pemasukan nilai dosen (Pasal 51), dan pengesahan laporan asesmen OBE.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>Pejabat Kaprodi:</span>
                <strong className="text-white font-semibold">
                  {activeKaprodiName}
                </strong>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Tenant ID: {activeProdiId} • Data Terisolasi</span>
              </span>

            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold truncate block">
                Target CPL Prodi
              </span>
              <span className="text-base sm:text-lg font-black text-white mt-0.5 truncate block">{targetBenchmark.toFixed(1)}%</span>
              <span className="text-[10px] text-emerald-400 font-semibold truncate block">Standar Kelulusan</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold truncate block">
                Rata-rata CPL
              </span>
              <span className="text-base sm:text-lg font-black text-sky-400 mt-0.5 truncate block">78.8%</span>
              <span className="text-[10px] text-emerald-400 font-semibold truncate block">+3.8% Melampaui</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold truncate block">
                Lulus Mutu (A-C)
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 truncate block">96.5%</span>
              <span className="text-[10px] text-slate-300 font-medium truncate block">Pasal 47 Unpatti</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold truncate block">
                Status Approval
              </span>
              <span className="text-base sm:text-lg font-black text-amber-400 mt-0.5 truncate block">
                {courses.filter((c) => c.status === 'pending').length} Tertunda
              </span>
              <span className="text-[10px] text-slate-400 truncate block">Dari 4 Matakuliah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kaprodi 4 Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs font-bold bg-white p-2 rounded-2xl shadow-xs scrollbar-none">
        <button
          onClick={() => setActiveSubTab('executive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'executive'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>1. Ringkasan Eksekutif &amp; CPL Prodi (Pasal 72)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('curriculum')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'curriculum'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Peta Kurikulum &amp; Keselarasan CPL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'monitoring'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>3. Monitoring Nilai Dosen (Pasal 51 &amp; 97)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('approval')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'approval'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>4. Pengesahan Laporan OBE ({courses.filter(c => c.status === 'pending').length})</span>
        </button>

        {!isUniversalPortalLocked().isLocked && (
          <button
            onClick={() => setActiveSubTab('central-summary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'central-summary'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200'
            }`}
          >
            <Building className="w-4 h-4 text-indigo-500" />
            <span>5. Dasbor Admin Pusat &amp; Komparasi Antar-Prodi (117 Prodi)</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          SUB-TAB 1: RINGKASAN EKSEKUTIF & CPL PRODI (PASAL 72)
          ========================================================================= */}
      {activeSubTab === 'executive' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Analisis Evaluasi Berkala Kaprodi Sesuai Pasal 72 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <span>Mandat Evaluasi CPL Berkala (Pasal 72 Ayat 2 &amp; 3)</span>
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                  Regulasi 2026
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>Pasal 72 Ayat (2):</strong> Program studi wajib melakukan evaluasi pencapaian CPL secara berkala berdasarkan hasil penilaian dosen pengampu mata kuliah inti kurikulum dan sumber data lain yang relevan.
                </p>
                <p>
                  <strong>Pasal 72 Ayat (3):</strong> Hasil evaluasi digunakan sebagai dasar tindak lanjut untuk meningkatkan mutu pembelajaran dan mengembangkan kurikulum program studi secara berkelanjutan.
                </p>
              </div>

              {/* Rincian Capaian 5 CPL Prodi */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">Capaian Agregat 5 Ranah Profil Lulusan Prodi:</h4>
                <div className="space-y-2">
                  {prodiCPLRadarData.map((item) => {
                    const isPassed = item.capaianProdi >= targetBenchmark;
                    return (
                      <div key={item.cpl} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{item.cpl}</strong>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">{item.kategori}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">{item.deskripsi}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-indigo-700 font-mono">{item.capaianProdi}%</span>
                          <span className={`text-[10px] font-bold block ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isPassed ? `Melampaui (+${(item.capaianProdi - targetBenchmark).toFixed(1)}%)` : `Defisit (${(item.capaianProdi - targetBenchmark).toFixed(1)}%)`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Visual Radar CPL */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Radar Ketercapaian CPL Lulusan Prodi
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Target {targetBenchmark}%</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={prodiCPLRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="cpl" tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Radar name="Capaian Riil Prodi (%)" dataKey="capaianProdi" stroke="#4338ca" fill="#6366f1" fillOpacity={0.45} />
                    <Radar name={`Target Standar (${targetBenchmark}%)`} dataKey="target" stroke="#ef4444" strokeDasharray="4 4" fill="none" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sebaran Nilai Mutu */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Sebaran Nilai Mutu Prodi (Pasal 47 Ayat 4)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Sarjana S1
                </span>
              </div>
              <div className="space-y-2">
                {prodiGradeDistribution.map((item) => (
                  <div key={item.grade} className="text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{item.grade} <span className="text-slate-400 font-normal">({item.rentang})</span></span>
                      <span className="font-semibold text-slate-700">{item.count} Mhs ({item.persentase}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.persentase}%`, backgroundColor: item.fill }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visualisasi Analisis Kesenjangan (Gap Analysis) Nilai Rata-rata Kelas vs Target Benchmark 75% */}
          <div className="lg:col-span-12">
            <ComponentGapAnalysisChart
              courseData={currentCourseData}
              componentTotalAverages={componentTotalAverages}
              targetBenchmark={targetBenchmark}
            />
          </div>

          {/* Visualisasi Diagram Batang Tren Ketercapaian CPL Antar-Semester */}
          <div className="lg:col-span-12">
            <CPLSemesterTrendBarChart
              studyProgramName={currentCourseData.studyProgram}
              targetBenchmark={targetBenchmark}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: PETA KURIKULUM & KESELARASAN CPL (CURRICULUM MAP)
          ========================================================================= */}
      {activeSubTab === 'curriculum' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Matriks Peta Kurikulum (Curriculum Mapping) &amp; Analisis Kesenjangan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemetaan kontribusi setiap mata kuliah terhadap CPL Program Studi S1 Budidaya Perairan
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Kuat</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">Sedang</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">Kurang</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Kode &amp; Mata Kuliah</th>
                  <th className="py-3 px-2 text-center">SKS</th>
                  <th className="py-3 px-2 text-center">Smt</th>
                  <th className="py-3 px-2 text-center">CPL-01 (Sikap)</th>
                  <th className="py-3 px-2 text-center">CPL-02 (Teori)</th>
                  <th className="py-3 px-2 text-center">CPL-03 (Analisis)</th>
                  <th className="py-3 px-2 text-center">CPL-04 (Rekayasa)</th>
                  <th className="py-3 px-2 text-center">CPL-05 (Wirausaha)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {curriculumMap.map((cm) => (
                  <tr key={cm.courseCode} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <strong className="text-slate-900">{cm.courseCode}</strong> - {cm.courseName}
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{cm.sks}</td>
                    <td className="py-3 px-2 text-center font-mono">{cm.semester}</td>
                    {['CPL-01', 'CPL-02', 'CPL-03', 'CPL-04', 'CPL-05'].map((cplKey) => {
                      const strength = cm.cpls[cplKey as keyof typeof cm.cpls];
                      return (
                        <td key={cplKey} className="py-3 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              strength === 'Kuat'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : strength === 'Sedang'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {strength}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: STATUS MONITORING PEMASUKAN NILAI DOSEN (PASAL 51 & 97)
          ========================================================================= */}
      {activeSubTab === 'monitoring' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Monitoring Batas Waktu Pemasukan Nilai SIAKAD (Pasal 51 &amp; Pasal 97)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengawasan kepatuhan kalender akademik bagi dosen pengampu semester aktif
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
              <span>Batas Akhir SIAKAD: <strong>25 Oktober 2026</strong> (Sisa 10 Hari)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Nama Dosen &amp; NIP</th>
                  <th className="py-3 px-3">Mata Kuliah Diampu</th>
                  <th className="py-3 px-2 text-center">Total Mhs</th>
                  <th className="py-3 px-2 text-center">Status Upload</th>
                  <th className="py-3 px-2 text-center">Bobot Proyek (Pasal 47)</th>
                  <th className="py-3 px-3 text-center">Aksi Kaprodi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lecturers.map((lec) => (
                  <tr key={lec.nip} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <strong className="text-slate-900 block">{lec.name}</strong>
                      <span className="font-mono text-slate-500 text-[11px]">NIP. {lec.nip}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 text-[11px]">
                      {lec.courses.join(', ')}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                      {lec.totalStudents}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          lec.statusUpload === 'Lengkap'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {lec.statusUpload === 'Lengkap' ? '✓ Lengkap' : '⏳ Menunggu'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lec.compliancePasal47
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {lec.compliancePasal47 ? 'Memenuhi (≥50%)' : 'Perlu Koreksi (<50%)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {lec.statusUpload === 'Menunggu' ? (
                        <button
                          onClick={() => handleSendReminder(lec.name)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Bell className="w-3 h-3 text-amber-600" />
                          <span>Kirim Pengingat</span>
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px]">Terverifikasi</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: PENGESAHAN & VALIDASI PORTOFOLIO ASESMEN (VERIFICATION WORKFLOW)
          ========================================================================= */}
      {activeSubTab === 'approval' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Pusat Verifikasi &amp; Pengesahan Laporan Dosen</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Laporan asesmen OBE yang diserahkan dosen pengampu untuk semester aktif
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Semester Ganjil 2024/2025
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Mata Kuliah &amp; Dosen</th>
                  <th className="py-2.5 px-3 text-center">Skor CPL</th>
                  <th className="py-2.5 px-3 text-center">Pasal 47 (Proyek)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi Kaprodi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs">
                        {course.code} - {course.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {course.lecturer} ({course.sks} SKS)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-indigo-700 text-xs font-mono">
                        {course.cplAverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          course.caseAndProjectWeight >= 50
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {course.caseAndProjectWeight}% (≥50%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {course.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Disahkan
                        </span>
                      ) : course.status === 'revision' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Revisi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
                          Menunggu
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onReviewCourse(8)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Tinjau</span>
                        </button>
                        {course.status === 'pending' ? (
                          <button
                            onClick={() => setSelectedCourseForApproval(course)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Sahkan</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedCourseForApproval(course)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Catatan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Approval Modal Dialog */}
          {selectedCourseForApproval && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Lembar Pengesahan Kaprodi: {selectedCourseForApproval.code} -{' '}
                  {selectedCourseForApproval.name}
                </h4>
                <button
                  onClick={() => setSelectedCourseForApproval(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Catatan Pengesahan / Arahan Penjaminan Mutu Kaprodi:
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Tuliskan catatan formal pengesahan portofolio asesmen mata kuliah..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-indigo-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleRequestRevision(selectedCourseForApproval.code)}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 font-semibold text-xs hover:bg-rose-50 cursor-pointer"
                >
                  Minta Perbaikan / Revisi Dosen
                </button>
                <button
                  onClick={() => handleApproveCourse(selectedCourseForApproval.code)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Sahkan Portofolio Asesmen Resmi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 5: DASBOR ADMIN PUSAT & KOMPARASI ANTAR-PRODI (117 PRODI)
          ========================================================================= */}
      {activeSubTab === 'central-summary' && (
        <CentralAdminOBEDashboard targetBenchmark={targetBenchmark} />
      )}
    </div>
  );
};
