import React, { useState } from 'react';
import {
  GraduationCap,
  Upload,
  BookOpen,
  BarChart3,
  FileCheck2,
  Settings,
  Sparkles,
  Layers,
  Database,
  Shield,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  CloudDownload,
  Lock,
  Unlock,
  LogOut,
  User,
  Users,
  Menu,
  X,
  Award,
  ChevronDown,
  Share2,
} from 'lucide-react';
import { OBEAssessmentData } from '../types/obe';
import { UserSession } from './LoginPage';
import { UnpattiLogo } from './UnpattiLogo';
import { isUniversalPortalLocked } from '../utils/prodiHelper';

export type UserRole = 'dosen' | 'kaprodi' | 'gjm' | 'admin';

interface NavHeaderProps {
  currentStage: number;
  onSelectStage: (stage: number) => void;
  data: OBEAssessmentData;
  onOpenUpload: () => void;
  onSelectSampleCourse: (key: string) => void;
  onResetData?: () => void;
  targetBenchmark: number;
  onChangeTarget: (target: number) => void;
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected?: boolean;
  onOpenLMSModal?: () => void;
  onOpenShareProdiModal?: () => void;
  userSession?: UserSession | null;
  onLogout?: () => void;
  maxUnlockedStageIndex?: number;
  freeNavigation?: boolean;
  onToggleFreeNavigation?: () => void;
  // Role-specific view mode switcher
  roleViewTab?: string;
  onSelectRoleViewTab?: (tab: string) => void;
}

export const NavigationHeader: React.FC<NavHeaderProps> = ({
  currentStage,
  onSelectStage,
  data,
  onOpenUpload,
  onSelectSampleCourse,
  onResetData,
  targetBenchmark,
  onChangeTarget,
  userRole,
  onChangeUserRole,
  onOpenSupabaseModal,
  isSupabaseConnected = false,
  onOpenLMSModal,
  onOpenShareProdiModal,
  userSession,
  onLogout,
  maxUnlockedStageIndex = 0,
  freeNavigation = false,
  onToggleFreeNavigation,
  roleViewTab = 'overview',
  onSelectRoleViewTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stages = [
    { num: 1, title: 'Tahap 1: RPS & CPL' },
    { num: 2, title: 'Tahap 2: Model (Pasal 47)' },
    { num: 3, title: 'Tahap 3: Pemetaan Bobot' },
    { num: 4, title: 'Tahap 4: Nilai Mahasiswa' },
    { num: 9, title: 'Individu Mhs (Pasal 47)', isSpecial: true },
    { num: 5, title: 'Tahap 5: Capaian CPMK' },
    { num: 6, title: 'Tahap 6: Capaian CPL' },
    { num: 7, title: 'Tahap 7: Analisis PPEPP' },
    { num: 8, title: 'Tahap 8: Laporan Final' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-lg">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800/80 p-1 flex items-center justify-center shadow-md shadow-indigo-950/40 border border-slate-700/60 shrink-0">
            <UnpattiLogo className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base lg:text-lg font-extrabold tracking-tight text-white leading-tight">
                OBE Assessment Specialist
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  userRole === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : userRole === 'kaprodi'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                    : userRole === 'gjm'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-indigo-500/30 text-indigo-300 border-indigo-400/30'
                }`}
              >
                {userRole === 'admin'
                  ? 'Admin IT'
                  : userRole === 'kaprodi'
                  ? 'Kaprodi'
                  : userRole === 'gjm'
                  ? 'GJM / Auditor Mutu'
                  : 'Dosen Pengampu'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">{userSession?.name || data.lecturerName}</span>
              <span>•</span>
              <span className="text-indigo-200 font-semibold truncate">{userSession?.prodi || data.studyProgram || 'Universitas Pattimura'}</span>
            </p>
          </div>
        </div>

        {/* Desktop Action Buttons (Responsive: Hidden on Mobile) */}
        <div className="hidden md:flex flex-wrap items-center gap-2 text-xs">
          
          {/* Fitur Dosen: Tarik LMS */}
          {userRole === 'dosen' && onOpenLMSModal && (
            <button
              onClick={onOpenLMSModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white font-bold transition-all border border-sky-500/60 shadow-sm cursor-pointer"
              title="Tarik otomatis RPS & Nilai Mahasiswa dari LMS"
            >
              <CloudDownload className="w-3.5 h-3.5 text-sky-200" />
              <span>Tarik LMS</span>
            </button>
          )}

          {/* Fitur Dosen: Upload RPS & Nilai */}
          {userRole === 'dosen' && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah RPS &amp; Nilai</span>
            </button>
          )}

          {/* Sample Course Selector (Dosen & Admin) */}
          {(userRole === 'dosen' || userRole === 'admin') && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={
                  data.courseCode === 'BDP344'
                    ? 'rpl'
                    : data.courseCode === 'BDP253425'
                    ? 'algo'
                    : 'empty'
                }
                onChange={(e) => {
                  if (e.target.value === 'empty') {
                    onResetData?.();
                  } else {
                    onSelectSampleCourse(e.target.value);
                  }
                }}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="empty" className="bg-slate-900 text-slate-400">
                  -- Data Kosong (Mulai Baru) --
                </option>
                <option value="algo" className="bg-slate-900 text-white">
                  Dasar-Dasar Genetika Ikan
                </option>
                <option value="rpl" className="bg-slate-900 text-white">
                  Genetika &amp; Pemuliaan Ikan
                </option>
              </select>
            </div>
          )}

          {/* Kosongkan / Reset Button for Dosen */}
          {userRole === 'dosen' && onResetData && (data.courseName || data.cpls.length > 0) && (
            <button
              onClick={onResetData}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/60 font-medium transition-all cursor-pointer"
              title="Kosongkan data untuk mata kuliah baru"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Admin Supabase Button */}
          {userRole === 'admin' && (
            <button
              onClick={onOpenSupabaseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-md cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-emerald-200" />
              <span>Setting Supabase</span>
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium transition-colors cursor-pointer"
              title="Keluar / Ganti Peran"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-slate-800 text-rose-400 border border-slate-700 cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-white border border-slate-700 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Responsive on iPhone / Android) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-3 space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300">
            <span>Peran Aktif: <strong className="text-white">{userRole.toUpperCase()}</strong></span>
            <span className="text-slate-400">{userSession?.name}</span>
          </div>

          {userRole === 'dosen' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUpload();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah RPS</span>
              </button>
              {onOpenLMSModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLMSModal();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-600 text-white font-bold"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>Tarik LMS</span>
                </button>
              )}
            </div>
          )}

          {(userRole === 'dosen' || userRole === 'admin') && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold block">Pilihan Mata Kuliah:</label>
              <select
                value={
                  data.courseCode === 'BDP344'
                    ? 'rpl'
                    : data.courseCode === 'BDP253425'
                    ? 'algo'
                    : 'empty'
                }
                onChange={(e) => {
                  setMobileMenuOpen(false);
                  if (e.target.value === 'empty') {
                    onResetData?.();
                  } else {
                    onSelectSampleCourse(e.target.value);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl"
              >
                <option value="empty">-- Data Kosong (Mulai Baru) --</option>
                <option value="algo">Dasar-Dasar Genetika Ikan</option>
                <option value="rpl">Genetika &amp; Pemuliaan Ikan</option>
              </select>
            </div>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSupabaseModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
            >
              <Database className="w-4 h-4" />
              <span>Pengaturan Supabase</span>
            </button>
          )}

          {onResetData && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onResetData();
              }}
              className="w-full py-2 rounded-xl bg-slate-900 text-rose-300 border border-rose-900/40 text-center font-semibold"
            >
              Kosongkan / Reset Data
            </button>
          )}
        </div>
      )}

      {/* SUB-HEADER NAVIGATION BAR BASED ON USER ROLE */}

      {/* 1. Dosen Pengampu Navigation: Tahap 1 s/d 9 Workflow */}
      {userRole === 'dosen' && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto flex items-center justify-between min-w-max gap-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {stages.map((stage, idx) => {
                const isActive = currentStage === stage.num;
                const isLocked =
                  !freeNavigation &&
                  userRole === 'dosen' &&
                  idx > maxUnlockedStageIndex;

                return (
                  <button
                    key={stage.num}
                    disabled={isLocked}
                    onClick={() => onSelectStage(stage.num)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : isLocked
                        ? 'text-slate-600 bg-slate-900/60 cursor-not-allowed border border-slate-800/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-white text-indigo-700'
                          : isLocked
                          ? 'bg-slate-800 text-slate-600'
                          : stage.isSpecial
                          ? 'bg-sky-950 text-sky-400 border border-sky-600'
                          : idx < maxUnlockedStageIndex
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : idx < maxUnlockedStageIndex && !isActive ? (
                        '✓'
                      ) : stage.isSpecial ? (
                        'M'
                      ) : (
                        stage.num
                      )}
                    </span>
                    <span className={`whitespace-nowrap ${stage.isSpecial && !isActive ? 'text-sky-300' : ''}`}>
                      {stage.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Unlock Button */}
            {onToggleFreeNavigation && (
              <div className="flex items-center gap-2 text-xs shrink-0 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={onToggleFreeNavigation}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    freeNavigation
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                  }`}
                  title={
                    freeNavigation
                      ? 'Navigasi bebas aktif (semua tahap terbuka)'
                      : 'Klik untuk membuka seluruh tahap'
                  }
                >
                  {freeNavigation ? (
                    <Unlock className="w-3 h-3 text-amber-300 shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                  )}
                  <span>{freeNavigation ? 'Bebas Akses' : 'Buka Kunci'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Kaprodi Navigation Tabs */}
      {userRole === 'kaprodi' && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center justify-between min-w-max gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectRoleViewTab?.('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  roleViewTab === 'dashboard'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Dashboard Eksekutif CPL Prodi</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectRoleViewTab?.('reviewCourse')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  roleViewTab === 'reviewCourse'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Tinjau &amp; Sahkan Laporan Dosen (Tahap 8)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectRoleViewTab?.('studentAnalysis')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  roleViewTab === 'studentAnalysis'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Rekap Mutu Mahasiswa (Pasal 47)</span>
              </button>
            </div>

            <div className="text-[11px] text-sky-300 font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Otoritas: Pengesahan &amp; Monitoring Lulusan Prodi</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. GJM / Auditor AMI Navigation Tabs */}
      {userRole === 'gjm' && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center justify-between min-w-max gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectRoleViewTab?.('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  roleViewTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Dashboard Audit Mutu &amp; Kepatuhan Pasal 47</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectRoleViewTab?.('reviewCourse')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  roleViewTab === 'reviewCourse'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Verifikasi Dokumen Asesmen Mata Kuliah</span>
              </button>
            </div>

            <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Otoritas: Audit Mutu Internal (AMI) &amp; Siklus PPEPP</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
