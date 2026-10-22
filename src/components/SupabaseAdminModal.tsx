import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Server,
  Zap,
  CloudUpload,
  CloudDownload,
  ShieldCheck,
  BookOpen,
  Terminal,
  Settings,
  Activity,
  Layers,
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Key,
} from 'lucide-react';
import { OBEAssessmentData } from '../types/obe';
import {
  loadSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  syncCourseToSupabase,
  fetchCoursesFromSupabase,
  ConnectionTestResult,
  SupabaseConfig,
} from '../utils/supabaseClient';
import {
  SUPABASE_SQL_DDL,
  SUPABASE_SETUP_STEPS,
  MULTI_TENANT_RLS_SQL_SNIPPET,
  DATABASE_MIGRATION_SQL_SNIPPET,
} from '../data/supabaseSetupGuide';
import {
  verifyAdminPassword,
  updateAdminPassword,
  resetAdminPassword,
} from '../utils/adminAuth';
import {
  LIST_PROGRAM_STUDI,
  getProdiShareableLink,
  getFacultyShareableLink,
  getJenjangShareableLink,
} from '../utils/prodiHelper';

interface SupabaseAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: OBEAssessmentData;
  onLoadCourseData?: (data: OBEAssessmentData) => void;
}

export const SupabaseAdminModal: React.FC<SupabaseAdminModalProps> = ({
  isOpen,
  onClose,
  courseData,
  onLoadCourseData,
}) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Change password states
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ success: boolean; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'config' | 'sync' | 'guide' | 'multi-tenancy'>('config');
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Cloud sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [remoteCourses, setRemoteCourses] = useState<Array<{ course_code: string; course_name: string; updated_at: string; data_payload: OBEAssessmentData }>>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const [copiedMigrationSql, setCopiedMigrationSql] = useState(false);
  const [copiedLinkText, setCopiedLinkText] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setPasswordInput('');
      setPasswordError(null);
      setShowChangePwd(false);
      setPwdMessage(null);
      const saved = loadSupabaseConfig();
      setProjectUrl(saved.projectUrl || '');
      setAnonKey(saved.anonKey || '');
      setSaveMessage(null);
      setSyncStatus(null);
      if (saved.projectUrl && saved.anonKey) {
        handleTestConnection(saved);
      }
    } else {
      // Re-lock when closed
      setIsAuthenticated(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setPasswordError('Silakan masukkan kata sandi admin.');
      return;
    }

    if (verifyAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      setPasswordError(null);
      setPasswordInput('');
    } else {
      setPasswordError('Password salah! Silakan periksa kembali kata sandi Administrator.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setPwdMessage({ success: false, text: 'Kata sandi baru minimal 4 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMessage({ success: false, text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    const success = updateAdminPassword(newPassword);
    if (success) {
      setPwdMessage({ success: true, text: 'Kata sandi admin berhasil diperbarui!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePwd(false);
        setPwdMessage(null);
      }, 3000);
    } else {
      setPwdMessage({ success: false, text: 'Gagal memperbarui kata sandi.' });
    }
  };

  const handleResetPasswordToDefault = () => {
    if (window.confirm('Kembalikan kata sandi admin ke setelan awal default sistem?')) {
      resetAdminPassword();
      setPwdMessage({ success: true, text: 'Kata sandi berhasil dikembalikan ke bawaan sistem.' });
      setTimeout(() => setPwdMessage(null), 3000);
    }
  };

  const handleTestConnection = async (overrideCfg?: SupabaseConfig) => {
    const cfg = overrideCfg || {
      projectUrl,
      anonKey,
    };

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(cfg);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSaveConfig = () => {
    setIsSaving(true);
    const cfg: SupabaseConfig = {
      projectUrl: projectUrl.trim(),
      anonKey: anonKey.trim(),
    };
    saveSupabaseConfig(cfg);
    setIsSaving(false);
    setSaveMessage('Konfigurasi API Supabase berhasil disimpan di peramban!');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleClearConfig = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus konfigurasi koneksi Supabase?')) {
      clearSupabaseConfig();
      setProjectUrl('');
      setAnonKey('');
      setTestResult(null);
      setSaveMessage('Konfigurasi berhasil dihapus.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);

    const res = await syncCourseToSupabase(courseData, { projectUrl, anonKey });
    setSyncStatus(res);
    setIsSyncing(false);

    if (res.success) {
      // Refresh list
      handleFetchRemoteCourses();
    }
  };

  const handleFetchRemoteCourses = async () => {
    setIsLoadingRemote(true);
    const res = await fetchCoursesFromSupabase({ projectUrl, anonKey });
    if (res.success && res.courses) {
      setRemoteCourses(res.courses);
    }
    setIsLoadingRemote(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const isConnected = testResult?.success === true;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Pengaturan Koneksi API & Database Supabase
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Role: Admin Sistem
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Integrasi langsung ke Cloud PostgreSQL Supabase untuk persistensi dan sinkronisasi data asesmen OBE.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold flex items-center gap-1">
                  <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Akses Terverifikasi</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthenticated(false);
                    setPasswordInput('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Kunci kembali akses pengaturan Supabase"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Kunci</span>
                </button>
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Memerlukan Password</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          /* Password Authentication Gate Screen */
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto space-y-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 ring-4 ring-emerald-500/10">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-900 shadow-xs">
                <Key className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Verifikasi Hak Akses Admin Supabase
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pengaturan API, kredensial koneksi, dan sinkronisasi database cloud PostgreSQL Supabase dilindungi oleh kata sandi Administrator.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="w-full space-y-3.5 text-left">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Masukkan Password Admin
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Ketik password saja"
                    autoFocus
                    className={`w-full text-xs p-3 pr-10 rounded-xl border font-mono transition-all ${
                      passwordError
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                        : 'border-slate-300 bg-white focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    } shadow-2xs`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Masukkan kata sandi Administrator Sistem yang berwenang untuk melanjutkan verifikasi.
                </p>
                {passwordError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Security Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-[11px] text-slate-600 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Akses ini dilindungi dan hanya diperuntukkan bagi Administrator Sistem yang berwenang.</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('config')}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'config'
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>1. Konfigurasi & Uji Koneksi</span>
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('sync');
                  if (isConnected && remoteCourses.length === 0) {
                    handleFetchRemoteCourses();
                  }
                }}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'sync'
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <CloudUpload className="w-4 h-4 text-indigo-600" />
                <span>2. Sinkronisasi Data Cloud</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'guide'
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-sky-600" />
                <span>3. Petunjuk Lengkap & Skrip SQL DDL</span>
              </button>

              <button
                onClick={() => setActiveTab('multi-tenancy')}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'multi-tenancy'
                    ? 'border-indigo-600 text-indigo-800 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>4. Panduan Multi-Tenancy & RLS</span>
              </button>
            </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              {/* Status Header Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                  isConnected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : testResult && !testResult.success
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="mt-0.5">
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : testResult && !testResult.success ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <Activity className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm">
                      Status Koneksi Supabase:
                      <span
                        className={`ml-1.5 font-extrabold ${
                          isConnected
                            ? 'text-emerald-700'
                            : testResult && !testResult.success
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {isConnected
                          ? 'TERHUBUNG (ONLINE)'
                          : testResult && !testResult.success
                          ? 'GAGAL TERHUBUNG'
                          : 'BELUM TERUJI / STANDBY'}
                      </span>
                    </h4>
                    {testResult?.latencyMs && (
                      <span className="text-[11px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                        Latensi: {testResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed">
                    {testResult?.message ||
                      'Masukkan Supabase Project URL dan Anon Public Key di bawah ini untuk menghubungkan aplikasi secara langsung ke database cloud PostgreSQL Anda.'}
                  </p>
                  {testResult?.details && (
                    <p className="text-[11px] font-mono text-slate-500 mt-1.5 p-2 bg-white/60 rounded border border-slate-200">
                      Rincian: {testResult.details}
                    </p>
                  )}
                </div>
              </div>

              {saveMessage && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {/* Form Input */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Supabase Project URL</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                    >
                      <span>Buka Dashboard Supabase</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="url"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="Contoh: https://xyzcompanyproj.supabase.co"
                    className="w-full text-xs font-mono p-2.5 bg-white rounded-xl border border-slate-300 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ditemukan di Supabase: <strong>Project Settings → API → Project URL</strong>.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Supabase Anon Public Key (API Key)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">public (anon) key</span>
                  </div>
                  <textarea
                    rows={3}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs font-mono p-2.5 bg-white rounded-xl border border-slate-300 focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ditemukan di Supabase: <strong>Project Settings → API → Project API Keys (anon public)</strong>.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestConnection()}
                      disabled={isTesting || !projectUrl || !anonKey}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Sedang Menguji Koneksi...' : 'Uji Koneksi Langsung'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      disabled={isSaving || !projectUrl || !anonKey}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Konfigurasi</span>
                    </button>
                  </div>

                  {(projectUrl || anonKey) && (
                    <button
                      type="button"
                      onClick={handleClearConfig}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Hapus Konfigurasi
                    </button>
                  )}
                </div>
              </div>

              {/* Card Pengaturan Password Admin */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Keamanan Kata Sandi Koneksi Supabase
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Kelola kata sandi otorisasi Administrator untuk mengamankan akses konfigurasi cloud database.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowChangePwd(!showChangePwd)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {showChangePwd ? 'Tutup Form' : 'Ganti Password Admin'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPasswordToDefault}
                      className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                      title="Kembalikan kata sandi ke bawaan sistem"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                {pwdMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      pwdMessage.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}
                  >
                    {pwdMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span>{pwdMessage.text}</span>
                  </div>
                )}

                {showChangePwd && (
                  <form onSubmit={handleChangePasswordSubmit} className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Password Baru (min. 4 karakter)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Password baru..."
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru..."
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowChangePwd(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                      >
                        Simpan Password Baru
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Quick Guide Card */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sky-900">
                    Belum memiliki Database Supabase atau belum membuat tabel?
                  </p>
                  <p className="text-sky-800 leading-relaxed text-[11px]">
                    Buka tab <strong>"3. Petunjuk Lengkap & Skrip SQL DDL"</strong> di atas. Kami telah menyiapkan panduan 5 langkah mudah dan skrip SQL otomatis yang siap di-copy-paste ke SQL Editor Supabase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">
                    Mata Kuliah Aktif Saat Ini
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {courseData.courseCode} - {courseData.courseName}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {courseData.studyProgram} • Semester {courseData.semester} • {courseData.cpmks.length} CPMK & {courseData.cpls.length} CPL
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSyncToCloud}
                  disabled={isSyncing || !projectUrl || !anonKey}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                >
                  <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Sedang Menyinkronkan...' : 'Unggah & Simpan ke Supabase'}</span>
                </button>
              </div>

              {syncStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    syncStatus.success
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border border-rose-300 text-rose-900'
                  }`}
                >
                  {syncStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
              )}

              {/* Remote courses list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Daftar Mata Kuliah Tersimpan di Supabase Cloud</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleFetchRemoteCourses}
                    disabled={isLoadingRemote || !projectUrl || !anonKey}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRemote ? 'animate-spin' : ''}`} />
                    <span>Muat Ulang Data Cloud</span>
                  </button>
                </div>

                {remoteCourses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      {projectUrl && anonKey
                        ? 'Belum ada data mata kuliah yang tersimpan di Supabase Anda, atau tabel `obe_courses` belum dibuat.'
                        : 'Silakan isi konfigurasi Supabase di Tab 1 terlebih dahulu.'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Klik "Unggah & Simpan ke Supabase" untuk menyimpan data asesmen mata kuliah aktif.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {remoteCourses.map((c, i) => (
                      <div
                        key={i}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {c.course_code}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {c.course_name}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Scope Prodi: {c.data_payload?.studyProgram || 'Umum'} (ID: {c.data_payload?.prodiId || '54242'})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Diperbarui: {new Date(c.updated_at).toLocaleString('id-ID')} • Fakultas: {c.data_payload?.faculty || 'Fakultas Perikanan dan Ilmu Kelautan'}
                          </span>
                        </div>

                        {onLoadCourseData && c.data_payload && (
                          <button
                            type="button"
                            onClick={() => {
                              onLoadCourseData(c.data_payload);
                              alert(`Data mata kuliah ${c.course_code} berhasil dimuat ke aplikasi!`);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>Terapkan ke Aplikasi</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GUIDE & SQL DDL */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Step pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
                {SUPABASE_SETUP_STEPS.map((stepItem) => (
                  <button
                    key={stepItem.step}
                    type="button"
                    onClick={() => setActiveStep(stepItem.step)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeStep === stepItem.step
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        activeStep === stepItem.step
                          ? 'bg-emerald-400 text-slate-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {stepItem.step}
                    </span>
                    <span>Tahap {stepItem.step}</span>
                  </button>
                ))}
              </div>

              {/* Active Step Details */}
              {(() => {
                const step = SUPABASE_SETUP_STEPS.find((s) => s.step === activeStep)!;
                return (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Tahap {step.step} dari {SUPABASE_SETUP_STEPS.length}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {step.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {step.shortDesc}
                        </p>
                      </div>

                      {activeStep < SUPABASE_SETUP_STEPS.length && (
                        <button
                          type="button"
                          onClick={() => setActiveStep(activeStep + 1)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>Lanjut</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                      {step.details.map((desc, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-slate-200">
                            {idx + 1}
                          </span>
                          <span>{desc}</span>
                        </div>
                      ))}
                    </div>

                    {step.tips && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5 font-bold">Catatan Praktis:</strong>
                          <span>{step.tips}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SQL DDL Script Box with 1-Click Copy */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-600" />
                      <span>Skrip SQL DDL Siap Eksekusi (Supabase SQL Editor)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Termasuk tabel `obe_courses`, `obe_cpls`, `obe_cpmks`, `obe_student_grades`, prodi_id, index & RLS policies.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                      copiedSql
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Skrip SQL Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Seluruh Skrip SQL DDL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                  <div className="bg-slate-900 px-4 py-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-b border-slate-800">
                    <span>schema.sql • Standar LAM/BAN-PT OBE Engine & Multi-Tenancy</span>
                    <span>PostgreSQL 15+</span>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
                    {SUPABASE_SQL_DDL}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-TENANCY & RLS GUIDE */}
          {activeTab === 'multi-tenancy' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-700 shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-wider">
                    Arsitektur Multi-Tenancy Enterprise
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold">
                    Tingkat 1, 2, & 3 Aktif
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Panduan Menjual &amp; Membagikan Aplikasi ke Prodi / Fakultas dengan Isolasi Penuh
                </h3>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  Agar setiap program studi dan fakultas hanya dapat mengakses dan mengelola datanya sendiri tanpa melihat data prodi lain, sistem menggunakan strategi <strong>3-Lapis Multi-Tenancy (Three-Tier Multi-Tenancy)</strong>.
                </p>
              </div>

              {/* 3 Tiers Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Direct Portal Locking</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Mekanisme penguncian URL instan via parameter query (misal: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">?prodi=54201</code> atau <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">?fakultas=...</code>). Antarmuka langsung terkunci ke lingkup prodi/fakultas tersebut.
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Sudah Aktif di Aplikasi
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Database Schema Scope</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Setiap tabel database (<code className="bg-slate-100 px-1 py-0.5 rounded">obe_courses</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">obe_audit_logs</code>) menyertakan kolom <code className="text-indigo-700 font-bold">prodi_id</code> dan <code className="text-indigo-700 font-bold">faculty_id</code>. Seluruh query simpan dan muat otomatis terfilter.
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Terimplementasi di Codebase
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Row Level Security (RLS)</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Kebijakan keamanan di level mesin database PostgreSQL Supabase. Bahkan jika ada upaya akses langsung melalui API, Supabase menolak baris data di luar penugasan role dan <code className="text-indigo-700 font-bold">prodi_id</code>.
                  </p>
                  <span className="inline-block text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    ✓ Skrip SQL Siap Eksekusi
                  </span>
                </div>
              </div>

              {/* URL Generator / Link Tester */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                    <span>Daftar Tautan Portal Terkunci (Direct Link untuk Klien / Fakultas)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    1 Codebase Terpusat • Hemat Biaya Server
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Prodi S1 Agribisnis */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-900 block">S1 Agribisnis (Kode: 54201)</span>
                      <span className="text-[10px] text-slate-500 font-mono">?prodi=54201</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = getProdiShareableLink('54201');
                        navigator.clipboard.writeText(link);
                        setCopiedLinkText('54201');
                        setTimeout(() => setCopiedLinkText(null), 2500);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLinkText === '54201' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLinkText === '54201' ? 'Disalin!' : 'Salin URL'}</span>
                    </button>
                  </div>

                  {/* Prodi S1 Manajemen Sumberdaya Perairan */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-900 block">S1 Manajemen Sumberdaya Perairan</span>
                      <span className="text-[10px] text-slate-500 font-mono">?prodi=54241</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = getProdiShareableLink('54241');
                        navigator.clipboard.writeText(link);
                        setCopiedLinkText('54241');
                        setTimeout(() => setCopiedLinkText(null), 2500);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLinkText === '54241' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLinkText === '54241' ? 'Disalin!' : 'Salin URL'}</span>
                    </button>
                  </div>

                  {/* Fakultas Perikanan & Ilmu Kelautan */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-900 block">Fakultas Perikanan &amp; Ilmu Kelautan (FPIK)</span>
                      <span className="text-[10px] text-slate-500 font-mono">?fakultas=Fakultas Perikanan dan Ilmu Kelautan</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = getFacultyShareableLink('Fakultas Perikanan dan Ilmu Kelautan');
                        navigator.clipboard.writeText(link);
                        setCopiedLinkText('fpik');
                        setTimeout(() => setCopiedLinkText(null), 2500);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLinkText === 'fpik' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLinkText === 'fpik' ? 'Disalin!' : 'Salin URL'}</span>
                    </button>
                  </div>

                  {/* Program Pascasarjana (S2) */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="font-bold text-slate-900 block">Program Pascasarjana (Magister S2)</span>
                      <span className="text-[10px] text-slate-500 font-mono">?jenjang=s2</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = getJenjangShareableLink('s2');
                        navigator.clipboard.writeText(link);
                        setCopiedLinkText('s2');
                        setTimeout(() => setCopiedLinkText(null), 2500);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLinkText === 's2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLinkText === 's2' ? 'Disalin!' : 'Salin URL'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RLS Implementation Steps */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Langkah Konfigurasi Row Level Security (RLS) di Dashboard Supabase</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">Perbarui Skema Database dengan Kolom prodi_id:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Jalankan Skrip DDL yang ada pada Tab 3. Skrip ini secara otomatis menambahkan kolom <code className="text-indigo-700 font-mono">prodi_id</code> dan <code className="text-indigo-700 font-mono">faculty_id</code> ke seluruh tabel asesmen, serta membuat indeks untuk performa query cepat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900">Buat Tabel Otorisasi Tenant (user_tenant_assignments):</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Tabel ini memetakan setiap akun pengguna Supabase Auth (<code className="text-slate-800 font-mono">user_id</code>) ke <code className="text-slate-800 font-mono">role</code> ('kaprodi', 'dosen', 'gjm') dan <code className="text-slate-800 font-mono">prodi_id</code> / <code className="text-slate-800 font-mono">faculty_id</code> mereka.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900">Aktifkan Kebijakan Row Level Security (RLS) di PostgreSQL:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Gunakan skrip SQL RLS khusus di bawah ini. Ketika Kaprodi S1 Agribisnis (54201) mengakses Supabase, PostgreSQL hanya akan mengembalikan baris data dengan <code className="font-mono text-emerald-700">prodi_id = '54201'</code>. Kaprodi tidak akan pernah dapat melihat atau mengubah data milik S1 MSP atau prodi lain.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-slate-900">Hak Akses Khusus GJM dan Admin IT:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Gugus Jaminan Mutu (GJM) memiliki akses tingkat fakultas (<code className="font-mono text-slate-800">faculty_id</code>) untuk mengaudit seluruh prodi di bawah naungan fakultasnya. Sedangkan Admin IT Sistem Pusat memiliki izin bypass untuk pemeliharaan dan backup universitas secara menyeluruh.
                      </p>
                    </div>
                  </div>
                </div>

                {/* RLS SQL Box */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-indigo-600" />
                      <span>Skrip SQL Row Level Security (RLS) Multi-Tenancy</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(MULTI_TENANT_RLS_SQL_SNIPPET);
                        setCopiedRlsSql(true);
                        setTimeout(() => setCopiedRlsSql(false), 3000);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                        copiedRlsSql
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {copiedRlsSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Skrip RLS Berhasil Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Skrip SQL RLS Multi-Tenant</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                    <div className="bg-slate-900 px-4 py-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-b border-slate-800">
                      <span>rls_multi_tenancy_policies.sql</span>
                      <span>PostgreSQL RLS Engine</span>
                    </div>
                    <pre className="p-4 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-60 overflow-y-auto leading-relaxed scrollbar-thin">
                      {MULTI_TENANT_RLS_SQL_SNIPPET}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Database Migration Guide & SQL Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Panduan Langkah-demi-Langkah Migrasi Skema Database ke Multi-Tenant (prodi_id &amp; faculty_id)</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">Tahap 1 - Penambahan Kolom Baru (ALTER TABLE):</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Menambahkan kolom <code className="text-indigo-700 font-mono font-bold">prodi_id VARCHAR(50)</code> dan <code className="text-indigo-700 font-mono font-bold">faculty_id VARCHAR(150)</code> pada tabel <code className="font-mono">obe_courses</code>, <code className="font-mono">obe_audit_logs</code>, <code className="font-mono">obe_student_grades</code>, <code className="font-mono">obe_cpls</code>, <code className="font-mono">obe_cpmks</code>, dan <code className="font-mono">obe_continuous_improvement</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900">Tahap 2 - Migrasi &amp; Backfill Data Lama (UPDATE Massal):</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Memetakan baris data yang sudah ada sebelumnya berdasarkan nama prodi (<code className="font-mono">study_program</code>) dan kode mata kuliah ke kode prodi resmi (misal: S3 Administrasi Pendidikan &rarr; <code className="font-mono font-bold text-emerald-700">86004</code>, S1 Agribisnis &rarr; <code className="font-mono font-bold text-emerald-700">54201</code>, S1 MSP &rarr; <code className="font-mono font-bold text-emerald-700">54241</code>, S1 BDP &rarr; <code className="font-mono font-bold text-emerald-700">54242</code>). Serta mengisi child-table secara otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900">Tahap 3 - Penegakan Integritas Data (DEFAULT &amp; NOT NULL):</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Mengunci kolom <code className="font-mono text-indigo-700">prodi_id</code> dengan nilai default dan constraint NOT NULL agar di masa mendatang tidak ada mata kuliah atau log audit yang tersimpan tanpa identitas tenant.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-slate-900">Tahap 4 - Penambahan Indeks Query Cepat (B-Tree Indexing):</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Membuat <code className="font-mono">CREATE INDEX idx_obe_courses_prodi</code> dan <code className="font-mono">idx_obe_courses_faculty</code> sehingga proses filtering per tenant berjalan dalam orde &lt;5 milidetik walaupun database memiliki puluhan ribu mahasiswa.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      5
                    </span>
                    <div>
                      <strong className="text-slate-900">Tahap 5 - Verifikasi Keberhasilan Migrasi:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Jalankan <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">SELECT course_code, course_name, study_program, prodi_id, faculty_id FROM public.obe_courses LIMIT 10;</code> di SQL Editor Supabase untuk memverifikasi seluruh baris terisi kode prodi yang benar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-600" />
                      <span>Skrip SQL Migrasi Skema &amp; Backfill Data Lama</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(DATABASE_MIGRATION_SQL_SNIPPET);
                        setCopiedMigrationSql(true);
                        setTimeout(() => setCopiedMigrationSql(false), 3000);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                        copiedMigrationSql
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {copiedMigrationSql ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Skrip Migrasi Berhasil Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Skrip SQL Migrasi Multi-Tenant</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                    <div className="bg-slate-900 px-4 py-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-b border-slate-800">
                      <span>migration_multi_tenant_prodi_faculty.sql</span>
                      <span>PostgreSQL Schema Migration</span>
                    </div>
                    <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60 overflow-y-auto leading-relaxed scrollbar-thin">
                      {DATABASE_MIGRATION_SQL_SNIPPET}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span>
              {isConnected
                ? 'Status: Supabase Cloud Connected'
                : 'Status: Standalone Local Storage'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </>
    )}
  </div>
</div>
  );
};
