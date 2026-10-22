import React, { useState, useMemo } from 'react';
import {
  OBEAssessmentData,
  StudentOBEAchievement,
  StudentRecord,
} from '../types/obe';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
  Printer,
  Sparkles,
  GraduationCap,
  Layers,
  Download,
  RefreshCw,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ensureStudentRecords } from '../utils/studentRosterHelper';
import { calculateStudentIndividualAchievements } from '../utils/calculator';
import { downloadStudentIndividualAchievementsCSV } from '../utils/templateGenerator';

interface StudentIndividualProps {
  data: OBEAssessmentData;
  studentAchievements: StudentOBEAchievement[];
  targetBenchmark?: number;
  onUpdate?: (updated: Partial<OBEAssessmentData>) => void;
}

export const StudentIndividualAnalysis: React.FC<StudentIndividualProps> = ({
  data,
  studentAchievements,
  targetBenchmark = 75.0,
  onUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'remedial' | 'attendanceLow'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentOBEAchievement | null>(null);
  const [remedialStudentModal, setRemedialStudentModal] = useState<StudentOBEAchievement | null>(null);
  const [remedialInputScores, setRemedialInputScores] = useState<Record<string, number>>({});
  const [syncedMessage, setSyncedMessage] = useState(false);
  const [remedialSuccessToast, setRemedialSuccessToast] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Guarantee individual student achievements are computed even if not yet saved in state
  const effectiveAchievements = useMemo<StudentOBEAchievement[]>(() => {
    if (studentAchievements && studentAchievements.length > 0) {
      return studentAchievements;
    }
    const defaultStudents = ensureStudentRecords(data);
    return calculateStudentIndividualAchievements({ ...data, students: defaultStudents });
  }, [studentAchievements, data]);

  // Handle manual sync/population of student records
  const handlePopulateOrSyncStudents = () => {
    const students = ensureStudentRecords(data);
    if (onUpdate) {
      onUpdate({ students });
    }
    setSyncedMessage(true);
    setTimeout(() => setSyncedMessage(false), 3000);
  };

  const handleOpenRemedialModal = (sa: StudentOBEAchievement) => {
    setRemedialStudentModal(sa);
    // Pre-populate with existing component scores or remedial scores
    const initial: Record<string, number> = {};
    data.components.forEach((c) => {
      initial[c.id] = sa.student.remedialScores?.[c.id] ?? sa.student.scores[c.id] ?? 60;
    });
    setRemedialInputScores(initial);
  };

  const handleApplyRemedial = () => {
    if (!remedialStudentModal || !onUpdate) return;
    const currentStudents = data.students && data.students.length > 0
      ? [...data.students]
      : ensureStudentRecords(data);

    const updated = currentStudents.map((st) => {
      if (st.id === remedialStudentModal.student.id) {
        return {
          ...st,
          isRemedialApplied: true,
          remedialScores: remedialInputScores,
        };
      }
      return st;
    });

    onUpdate({ students: updated });
    setRemedialSuccessToast(`Hasil remedial atas nama ${remedialStudentModal.student.name} berhasil disimpan sesuai Pasal 52 (Maksimal B).`);
    setRemedialStudentModal(null);
    setTimeout(() => setRemedialSuccessToast(''), 4000);
  };

  const handleExportCSV = () => {
    downloadStudentIndividualAchievementsCSV(data, effectiveAchievements);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered students
  const filteredStudents = effectiveAchievements.filter((sa) => {
    const matchSearch =
      sa.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sa.student.nim.toLowerCase().includes(searchTerm.toLowerCase());

    const matchUnit =
      selectedUnit === 'all' ||
      sa.student.unitClassId === selectedUnit ||
      sa.student.unitClassName === selectedUnit;

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'passed' && sa.isAllPassed) ||
      (filterStatus === 'remedial' && (sa.isRemedialEligible || !sa.isAllPassed)) ||
      (filterStatus === 'attendanceLow' && !sa.isAttendanceEligible);

    return matchSearch && matchUnit && matchStatus;
  });

  const totalAll = effectiveAchievements.length;
  const passedAll = effectiveAchievements.filter((s) => s.isAllPassed).length;
  const remedialEligibleCount = effectiveAchievements.filter((s) => s.isRemedialEligible || !s.isAllPassed).length;
  const lowAttendanceCount = effectiveAchievements.filter((s) => !s.isAttendanceEligible).length;
  const passRate = totalAll > 0 ? ((passedAll / totalAll) * 100).toFixed(1) : '0';

  // Selected student radar data
  const studentRadarData = selectedStudent
    ? [
        ...data.cpmks.map((c) => ({
          subject: c.code,
          skor: selectedStudent.cpmkScores[c.code]?.score ?? 0,
          target: targetBenchmark,
        })),
        ...data.cpls.map((c) => ({
          subject: c.code,
          skor: selectedStudent.cplScores[c.code]?.score ?? 0,
          target: targetBenchmark,
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Remedial Success Toast */}
      {remedialSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{remedialSuccessToast}</span>
          </div>
          <button
            onClick={() => setRemedialSuccessToast('')}
            className="text-white hover:text-emerald-200 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Stat & Controls Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 overflow-hidden">
        {/* Title and Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1 border border-indigo-200">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">PORTOFOLIO MAHASISWA &amp; REMEDIAL (PASAL 52)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              Rekapitulasi Ketercapaian Kompetensi &amp; Nilai Mutu Mahasiswa
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Evaluasi ketercapaian CPMK, CPL, dan penetapan nilai mutu sesuai Peraturan Rektor No. 12 Tahun 2026 Pasal 47 &amp; Pasal 52
            </p>
          </div>

          {/* Quick Actions (Desktop & Tablet) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={handlePopulateOrSyncStudents}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
              title="Sinkronkan data mahasiswa resmi"
            >
              {syncedMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Badges Grid - Completely Contained */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold truncate block">
              Total Mahasiswa
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate block">
              {totalAll} Orang
            </span>
            <span className="text-[10px] text-slate-400 truncate block mt-0.5">
              Seluruh Unit Kelas
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
            <span className="text-[10px] text-emerald-700 uppercase font-bold truncate block">
              Lulus Penuh OBE
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-800 mt-0.5 truncate block">
              {passedAll} ({passRate}%)
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold truncate block mt-0.5">
              Capaian Memenuhi Target
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
            <span className="text-[10px] text-amber-700 uppercase font-bold truncate block">
              Layak Remedial (&lt; B)
            </span>
            <span className="text-base sm:text-lg font-black text-amber-800 mt-0.5 truncate block">
              {remedialEligibleCount} Mhs
            </span>
            <span className="text-[10px] text-amber-700 font-semibold truncate block mt-0.5">
              Hak Remedial (Pasal 52)
            </span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center min-w-0 overflow-hidden flex flex-col justify-center">
            <span className="text-[10px] text-rose-700 uppercase font-bold truncate block">
              Presensi &lt; 75%
            </span>
            <span className="text-base sm:text-lg font-black text-rose-800 mt-0.5 truncate block">
              {lowAttendanceCount} Mhs
            </span>
            <span className="text-[10px] text-rose-600 font-semibold truncate block mt-0.5">
              Peringatan (Pasal 51)
            </span>
          </div>
        </div>

        {/* Filter & Controls Bar */}
        <div className="space-y-3 pt-1">
          {/* Row 1: Search, Unit Dropdown, and View Mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Nama atau NIM Mahasiswa..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-indigo-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Unit Class Filter */}
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
              >
                <option value="all">Semua Unit Kelas</option>
                {data.unitClasses.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              {/* View Mode Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabel
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kartu
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Status Filter Chips - Individually Contained */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Filter Status:</span>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              Semua ({totalAll})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('passed')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                filterStatus === 'passed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              Lulus ({passedAll})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('remedial')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                filterStatus === 'remedial'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              Remedial &lt; B ({remedialEligibleCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('attendanceLow')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                filterStatus === 'attendanceLow'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
              }`}
            >
              Presensi &lt; 75% ({lowAttendanceCount})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: RESPONSIVE CARD VIEW (Sangat cocok untuk iPhone & Android) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((sa, idx) => (
              <div
                key={sa.student.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 relative hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 block">#{idx + 1}</span>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug truncate" title={sa.student.name}>
                      {sa.student.name}
                    </h4>
                    <span className="font-mono text-slate-500 text-xs block truncate">{sa.student.nim}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{sa.student.unitClassName || 'Reguler'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs whitespace-nowrap ${
                        sa.gradeHuruf === 'A'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : sa.gradeHuruf === 'B' || sa.gradeHuruf === 'B+' || sa.gradeHuruf === 'B-'
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : sa.gradeHuruf === 'C'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {sa.student.isRemedialApplied
                        ? `${sa.remedialGradeHuruf || 'B'} (Remedial)`
                        : `${sa.gradeHuruf || 'B'} (${sa.gradeAngka?.toFixed(2) || '3.00'})`}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{sa.gradeKategori || 'Baik'}</span>
                  </div>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Rata-rata CPMK</span>
                    <strong className="text-indigo-700 font-mono text-sm">{sa.averageCPMK.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Presensi Kuliah</span>
                    <strong
                      className={`font-mono text-sm ${
                        sa.isAttendanceEligible ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {sa.student.attendancePercent ?? 90}%
                    </strong>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {sa.isAllPassed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lulus Penuh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> Perlu Remedial
                    </span>
                  )}
                  {sa.student.isRemedialApplied && (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      ✓ Remedial Terverifikasi (Maks. B)
                    </span>
                  )}
                  {!sa.isAttendanceEligible && (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-300">
                      Presensi &lt; 75% (Pasal 51)
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedStudent(sa)}
                    className="flex-1 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Portofolio</span>
                  </button>

                  <button
                    onClick={() => handleOpenRemedialModal(sa)}
                    className="flex-1 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Kelola Remedial</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Tidak ditemukan data mahasiswa yang sesuai dengan pencarian atau filter.
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TABEL CAPAIAN INDIVIDU (Desktop & Touch Scrollable) */}
      {viewMode === 'table' && (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[180px]">NIM &amp; Nama Mahasiswa</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Unit Kelas</th>
                <th className="py-3 px-3 text-center min-w-[90px]">Presensi (Pasal 51)</th>
                {data.cpmks.map((c) => (
                  <th key={c.code} className="py-3 px-2 text-center min-w-[80px]">
                    <div className="font-bold text-indigo-700">{c.code}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{c.weight}%</div>
                  </th>
                ))}
                {data.cpls.map((c) => (
                  <th key={c.code} className="py-3 px-2 text-center min-w-[80px] bg-slate-200/50">
                    <div className="font-bold text-slate-800">{c.code}</div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[120px] bg-emerald-100/60 text-emerald-900">
                  <div className="font-bold text-[10px]">Nilai Mutu</div>
                  <div className="text-[9px] text-emerald-700 font-medium">Pasal 47 &amp; 52</div>
                </th>
                <th className="py-3 px-3 text-center min-w-[110px]">Status Evaluasi</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Aksi Dosen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((sa, idx) => (
                  <tr key={sa.student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{sa.student.name}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{sa.student.nim}</div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 text-[11px]">
                      {sa.student.unitClassName || 'Reguler'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                          sa.isAttendanceEligible
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                        title={
                          sa.isAttendanceEligible
                            ? 'Kehadiran memenuhi syarat tatap muka minimal 75% (Pasal 51 Ayat 3)'
                            : 'Peringatan: Kehadiran di bawah 75%, tidak memenuhi syarat ujian/penilaian (Pasal 51 Ayat 3)'
                        }
                      >
                        {sa.student.attendancePercent ?? 90}%
                      </span>
                    </td>

                    {/* CPMK Cells */}
                    {data.cpmks.map((cpmk) => {
                      const item = sa.cpmkScores[cpmk.code];
                      const score = item?.score ?? 0;
                      const isAch = item?.isAchieved ?? false;
                      return (
                        <td key={cpmk.code} className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                              isAch
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {score.toFixed(1)}%
                          </span>
                        </td>
                      );
                    })}

                    {/* CPL Cells */}
                    {data.cpls.map((cpl) => {
                      const item = sa.cplScores[cpl.code];
                      const score = item?.score ?? 0;
                      const isAch = item?.isAchieved ?? false;
                      return (
                        <td key={cpl.code} className="py-3 px-2 text-center bg-slate-50/40">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                              isAch
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {score.toFixed(1)}%
                          </span>
                        </td>
                      );
                    })}

                    {/* Nilai Mutu Peraturan Rektor No 12/2026 Pasal 47 & 52 */}
                    <td className="py-3 px-3 text-center bg-emerald-50/30">
                      <div className="inline-flex items-center gap-1">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded ${
                            sa.student.isRemedialApplied
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : sa.gradeHuruf === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : sa.gradeHuruf === 'B' || sa.gradeHuruf === 'B+' || sa.gradeHuruf === 'B-'
                              ? 'bg-sky-100 text-sky-800 border border-sky-300'
                              : sa.gradeHuruf === 'C'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {sa.student.isRemedialApplied
                            ? `${sa.remedialGradeHuruf || 'B'} (Remedial)`
                            : sa.gradeHuruf || 'B'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 font-mono">
                          ({(sa.student.isRemedialApplied ? sa.remedialGradeAngka : sa.gradeAngka)?.toFixed(2) || '3.00'})
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {sa.student.isRemedialApplied ? 'Maksimal B (Pasal 52)' : sa.gradeKategori || 'Baik'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {sa.isAllPassed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lulus Penuh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Remedial ({data.cpmks.length - sa.cpmkPassCount} CPMK)
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(sa)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                          title="Lihat Portofolio Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenRemedialModal(sa)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            sa.student.isRemedialApplied
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                          }`}
                          title="Input / Kelola Remedial Terkontrol (Pasal 52)"
                        >
                          {sa.student.isRemedialApplied ? 'Remedial ✓' : 'Remedial'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5 + data.cpmks.length + data.cpls.length}
                    className="py-10 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-xs text-slate-500 italic">
                        Tidak ditemukan data mahasiswa yang sesuai dengan pencarian atau filter.
                      </p>
                      {(searchTerm || selectedUnit !== 'all' || filterStatus !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedUnit('all');
                            setFilterStatus('all');
                          }}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
                        >
                          Reset Filter &amp; Tampilkan Semua Mahasiswa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal Remedial Terkontrol (Peraturan Rektor No. 12 Tahun 2026 Pasal 52) */}
      {remedialStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-md">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                    <span>PERATURAN REKTOR UNPATTI NO. 12/2026 PASAL 52</span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Formulir Ujian Remedial Terkontrol
                  </h3>
                  <p className="text-xs text-amber-100">
                    {remedialStudentModal.student.name} • NIM: {remedialStudentModal.student.nim}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRemedialStudentModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800">
              {/* Pasal 52 Notice Box */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Ketentuan Hukum Remedial (Pasal 52 Ayat 1 &amp; 2):</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900 pl-1">
                  <li>Mahasiswa yang belum mencapai <strong>nilai B (&lt; 70)</strong> berhak remedial 1 kali sebelum nilai diumumkan ke SIAKAD.</li>
                  <li><strong>Pasal 52 Ayat (2):</strong> Nilai maksimum yang diperoleh dari perbaikan melalui remedial adalah <strong>B (3,00)</strong>. Sistem otomatis mengunci batas atas nilai mutu.</li>
                </ul>
              </div>

              {/* Status Nilai Awal */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Skor Awal</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {remedialStudentModal.finalNumericScore?.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Huruf Mutu Awal</span>
                  <span className="text-sm font-black text-rose-700">
                    {remedialStudentModal.gradeHuruf} ({remedialStudentModal.gradeAngka?.toFixed(2)})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Presensi</span>
                  <span className="text-sm font-black text-emerald-700">
                    {remedialStudentModal.student.attendancePercent ?? 90}%
                  </span>
                </div>
              </div>

              {/* Input Nilai Remedial per Komponen */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block">
                  Input Nilai Perbaikan Komponen (0 - 100):
                </label>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {data.components.map((comp) => {
                    const currentScore = remedialInputScores[comp.id] ?? remedialStudentModal.student.scores[comp.id] ?? 0;
                    return (
                      <div key={comp.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 block">{comp.name}</span>
                          <span className="text-[10px] text-slate-500">Bobot: {comp.weight}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Asli: {remedialStudentModal.student.scores[comp.id] ?? 0}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={currentScore}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                              setRemedialInputScores((prev) => ({
                                ...prev,
                                [comp.id]: val,
                              }));
                            }}
                            className="w-16 text-center font-bold font-mono text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 focus:bg-white focus:outline-amber-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview of Capped Grade */}
              {(() => {
                let remSum = 0;
                let totW = 0;
                data.components.forEach((c) => {
                  const score = remedialInputScores[c.id] ?? remedialStudentModal.student.scores[c.id] ?? 0;
                  remSum += (score * c.weight) / 100;
                  totW += c.weight;
                });
                const normRemScore = totW > 0 ? (remSum * 100) / totW : remSum;
                const isCapped = normRemScore >= 70;

                return (
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-xs">Simulasi Nilai Akhir Pasca Remedial:</span>
                      <span className="text-[10px] text-purple-700">
                        Rata-rata Skor: <strong>{normRemScore.toFixed(2)}%</strong>
                        {isCapped && ' • Otomatis dipatok maksimal B (Pasal 52)'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black px-2.5 py-1 rounded-lg bg-purple-200 text-purple-950 border border-purple-300">
                        {isCapped ? 'B (3.00)' : normRemScore >= 55 ? 'C (2.00)' : 'D (1.00)'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setRemedialStudentModal(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleApplyRemedial}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan &amp; Sahkan Nilai Remedial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Portofolio Transkrip Mahasiswa */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Portofolio Ketercapaian Kompetensi OBE Mahasiswa
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {selectedStudent.student.name} • NIM: {selectedStudent.student.nim}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
              {/* Profile Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Mata Kuliah</span>
                  <strong className="text-slate-900">{data.courseName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Unit Kelas</span>
                  <strong className="text-slate-900">{selectedStudent.student.unitClassName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Rata-rata CPMK</span>
                  <strong className="text-indigo-700">{selectedStudent.averageCPMK.toFixed(2)}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Status Kelulusan</span>
                  <strong
                    className={selectedStudent.isAllPassed ? 'text-emerald-700' : 'text-rose-700'}
                  >
                    {selectedStudent.isAllPassed ? 'LULUS OBE' : 'PERLU REMEDIAL'}
                  </strong>
                </div>
              </div>

              {/* Spider Radar Chart of Student */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="font-bold text-slate-900 text-xs mb-1">
                  Radar Poligon Capaian Kompetensi Mahasiswa vs Target {targetBenchmark.toFixed(2)}%
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={studentRadarData} outerRadius="70%">
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar
                        name="Capaian Mahasiswa"
                        dataKey="skor"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name="Target Acuan (75%)"
                        dataKey="target"
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        fill="#ef4444"
                        fillOpacity={0.1}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabel Rincian CPMK Mahasiswa */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2">
                  Rincian Ketercapaian CPMK Mahasiswa
                </h4>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Kode CPMK</th>
                      <th className="py-2 px-3 text-center">Bobot</th>
                      <th className="py-2 px-3 text-right">Skor Mahasiswa</th>
                      <th className="py-2 px-3 text-center">Target</th>
                      <th className="py-2 px-3 text-center">Delta Gap</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.cpmks.map((c) => {
                      const item = selectedStudent.cpmkScores[c.code];
                      return (
                        <tr key={c.code}>
                          <td className="py-2 px-3 font-bold text-indigo-700">{c.code}</td>
                          <td className="py-2 px-3 text-center">{c.weight}%</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                            {item?.score.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-center text-slate-500">{targetBenchmark}%</td>
                          <td className="py-2 px-3 text-center font-bold">
                            <span
                              className={
                                (item?.gap ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }
                            >
                              {(item?.gap ?? 0) > 0 ? '+' : ''}
                              {item?.gap.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item?.isAchieved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item?.isAchieved ? 'TERCAPAI' : 'BELUM'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Saran Remedial Khusus Mahasiswa */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 text-indigo-950">
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Rekomendasi Bimbingan Dosen PA / Pengampu:</span>
                </div>
                <p className="leading-relaxed">
                  {selectedStudent.isAllPassed
                    ? `Mahasiswa atas nama ${selectedStudent.student.name} telah berhasil melampaui seluruh target ketercapaian CPMK dan CPL dengan performa sangat memuaskan. Direkomendasikan untuk mengikuti pengayaan riset atau kompetisi keilmuan terkait.`
                    : `Mahasiswa atas nama ${selectedStudent.student.name} masih memiliki defisit nilai pada CPMK yang belum tercapai. Perlu penjadwalan bimbingan mandiri (klinik tutorial) dan pengerjaan tugas perbaikan pada instrumen terkait sebelum yudisium akhir.`}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Transkrip Capaian OBE Mahasiswa • Auditor Mutu Akademik
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Tutup Portofolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
