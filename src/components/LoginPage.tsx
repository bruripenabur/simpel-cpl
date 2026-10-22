import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Database,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { UnpattiLogo } from './UnpattiLogo';
import { DEFAULT_LECTURER_NAME, DEFAULT_LECTURER_NIP } from '../utils/lecturerHelper';
import {
  LIST_PROGRAM_STUDI,
  ProgramStudiInfo,
  getProdiFromUrl,
  getProdiShareableLink,
  isUniversalPortalLocked,
  copyToClipboard,
} from '../utils/prodiHelper';
import { UNPATTI_PRODI_117, UnpattiProdi } from '../data/unpattiProdiList';
import { ShareProdiModal } from './ShareProdiModal';
import { Share2, Check, ExternalLink, RefreshCw, Copy } from 'lucide-react';

export type UserRole = 'dosen' | 'kaprodi' | 'gjm' | 'admin';

export interface UserSession {
  role: UserRole;
  name: string;
  nipOrId: string;
  title: string;
  prodi?: string;
  prodiId?: string;
  faculty?: string;
  facultyId?: string;
}

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
}

export const DEFAULT_ROLE_PASSWORDS: Record<UserRole, string> = {
  dosen: '123',
  kaprodi: 'kaprodi123',
  gjm: 'gjm321',
  admin: 'AdminIT1122',
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('dosen');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Universal Direct Portal Lock info
  const [lockedInfo] = useState(() => isUniversalPortalLocked());

  // Multi-Prodi state (supports ?prodi=... in URL)
  const [selectedProdi, setSelectedProdi] = useState<ProgramStudiInfo | null>(() => {
    return lockedInfo.prodi || getProdiFromUrl() || null;
  });

  // Fields for Prodi Code, Prodi Name, User Name & Faculty (Kosongkan secara default agar aplikasi siap dipublish)
  const [fullName, setFullName] = useState<string>('');
  const [prodiCode, setProdiCode] = useState<string>(() => {
    if (lockedInfo.prodi?.code) return lockedInfo.prodi.code;
    const urlProdi = getProdiFromUrl();
    if (urlProdi?.code) return urlProdi.code;
    return '';
  });
  const [prodiName, setProdiName] = useState<string>(() => {
    if (lockedInfo.prodi?.name) return lockedInfo.prodi.name;
    const urlProdi = getProdiFromUrl();
    if (urlProdi?.name) return urlProdi.name;
    return '';
  });
  const [facultyName, setFacultyName] = useState<string>(() => {
    if (lockedInfo.prodi?.faculty) return lockedInfo.prodi.faculty;
    const urlProdi = getProdiFromUrl();
    if (urlProdi?.faculty) return urlProdi.faculty;
    return '';
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Handle auto-matching when typing or choosing Prodi Code
  const handleProdiCodeChange = (codeVal: string) => {
    setProdiCode(codeVal);
    const trimmed = codeVal.trim().toUpperCase();
    const match = UNPATTI_PRODI_117.find((p) => p.kode.toUpperCase() === trimmed) ||
      LIST_PROGRAM_STUDI.find((p) => p.code.toUpperCase() === trimmed);
    if (match) {
      const matchName = 'nama' in match ? match.nama : match.name;
      const matchFaculty = 'fakultas' in match ? match.fakultas : match.faculty;
      setProdiName(matchName);
      setFacultyName(matchFaculty);
    }
  };

  // Handle auto-matching when typing or choosing Prodi Name
  const handleProdiNameChange = (nameVal: string) => {
    setProdiName(nameVal);
    const trimmed = nameVal.trim().toLowerCase();
    const match = UNPATTI_PRODI_117.find((p) => p.nama.toLowerCase() === trimmed) ||
      LIST_PROGRAM_STUDI.find((p) => p.name.toLowerCase() === trimmed);
    if (match) {
      const matchCode = 'kode' in match ? match.kode : match.code;
      const matchFaculty = 'fakultas' in match ? match.fakultas : match.faculty;
      setProdiCode(matchCode);
      setFacultyName(matchFaculty);
    }
  };

  // Handle switching role tabs (tidak mengisi default agar tetap bersih sesuai isian pengguna)
  const handleSelectRoleTab = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setPassword('');
  };

  const handleCopyCurrentProdiLink = async () => {
    const link = getProdiShareableLink(prodiCode || selectedProdi?.slug || '');
    const success = await copyToClipboard(link);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }
  };

  const executeLogin = (roleToUse: UserRole) => {
    const activeName = fullName.trim() || 'Pengguna ' + roleToUse;
    const activeProdiCode = prodiCode.trim();
    const activeProdiName = prodiName.trim();
    const activeFaculty = facultyName.trim() || 'Universitas Pattimura';

    let session: UserSession;
    if (roleToUse === 'dosen') {
      session = {
        role: 'dosen',
        name: activeName,
        nipOrId: username.trim() || DEFAULT_LECTURER_NIP,
        title: activeProdiName ? `Dosen Pengampu ${activeProdiName}` : 'Dosen Pengampu',
        prodi: activeProdiName,
        prodiId: activeProdiCode,
        faculty: activeFaculty,
        facultyId: activeFaculty,
      };
    } else if (roleToUse === 'kaprodi') {
      session = {
        role: 'kaprodi',
        name: activeName,
        nipOrId: username.trim() || (selectedProdi?.defaultKaprodiNip || '19700512 199603 1 002'),
        title: activeProdiName ? `Ketua Program Studi ${activeProdiName}` : 'Ketua Program Studi',
        prodi: activeProdiName,
        prodiId: activeProdiCode,
        faculty: activeFaculty,
        facultyId: activeFaculty,
      };
    } else if (roleToUse === 'gjm') {
      session = {
        role: 'gjm',
        name: activeName,
        nipOrId: username.trim() || '19690815 199403 1 003',
        title: `Gugus Jaminan Mutu (GJM) & Lead Auditor AMI${activeProdiName ? ` - ${activeProdiName}` : ''}`,
        prodi: activeProdiName,
        prodiId: activeProdiCode,
        faculty: activeFaculty,
        facultyId: activeFaculty,
      };
    } else {
      session = {
        role: 'admin',
        name: activeName || 'Administrator IT Sistem OBE',
        nipOrId: username.trim() || 'ADM-SYS-001',
        title: 'Admin Sistem & Integrasi Database',
        prodi: activeProdiName || 'Universitas Pattimura',
        prodiId: activeProdiCode || '00000',
        faculty: activeFaculty,
        facultyId: activeFaculty,
      };
    }

    onLogin(session);
  };

  const handlePerformLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Silakan isi Nama Lengkap & Gelar Pengguna.');
      return;
    }

    // Mandatorily require Kode Prodi and Nama Prodi for Dosen, Kaprodi, and GJM
    if (selectedRole !== 'admin') {
      if (!prodiCode.trim()) {
        setErrorMessage('Wajib mengisi Kode Program Studi sebelum masuk portal.');
        return;
      }
      if (!prodiName.trim()) {
        setErrorMessage('Wajib mengisi Nama Program Studi sebelum masuk portal.');
        return;
      }
    }

    if (!username.trim()) {
      setErrorMessage('Silakan masukkan Username / NIP Pengguna.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Silakan masukkan Kata Sandi Otorisasi.');
      return;
    }

    const expectedPwd = DEFAULT_ROLE_PASSWORDS[selectedRole];
    if (password.trim() !== expectedPwd && password.trim() !== 'AdminIT1122') {
      const roleName = selectedRole === 'dosen' ? 'Dosen' : selectedRole === 'kaprodi' ? 'Kaprodi' : selectedRole === 'gjm' ? 'GJM / AMI' : 'Admin IT';
      setErrorMessage(`Kata sandi otorisasi salah. Silakan periksa kembali kata sandi untuk role ${roleName}.`);
      return;
    }

    executeLogin(selectedRole);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Nav */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-800/90 p-1 flex items-center justify-center shadow-lg shadow-indigo-950/40 border border-slate-700/60 shrink-0">
            <UnpattiLogo className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              OBE Assessment Specialist
            </h1>
            <p className="text-xs text-slate-400">
              Universitas Pattimura • Peraturan Rektor No. 12 Tahun 2026 Pasal 47
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sistem Otoritas Berbasis Peran (RBAC)</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Info Panel (Roles Summary) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800/90 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pemisahan Menu Berdasarkan Peran</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Portal Akses Terpisah &amp; Fokus Tugas
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                Setiap peran memiliki menu khusus: Dosen fokus asesmen mata kuliah, Kaprodi memantau CPL prodi &amp; pengesahan, dan GJM mengaudit mutu akademik.
              </p>

              {/* Roles Breakdown */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Dosen */}
                <div
                  onClick={() => handleSelectRoleTab('dosen')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                    selectedRole === 'dosen'
                      ? 'bg-indigo-600/20 border-indigo-500/80 ring-1 ring-indigo-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white block truncate">1. Dosen Pengampu</span>
                      <span className="text-[11px] text-slate-400 block leading-tight">
                        Input RPS, Nilai Mahasiswa, Kalkulasi Tahap 1-9 &amp; Ekspor MK
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Kaprodi */}
                <div
                  onClick={() => handleSelectRoleTab('kaprodi')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                    selectedRole === 'kaprodi'
                      ? 'bg-sky-600/20 border-sky-500/80 ring-1 ring-sky-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white block truncate">2. Ketua Program Studi (Kaprodi)</span>
                      <span className="text-[11px] text-slate-400 block leading-tight">
                        Rekap CPL Prodi, Approval Laporan Dosen, Sebaran Nilai Pasal 47
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. GJM / Auditor Mutu */}
                <div
                  onClick={() => handleSelectRoleTab('gjm')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                    selectedRole === 'gjm'
                      ? 'bg-emerald-600/20 border-emerald-500/80 ring-1 ring-emerald-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white block truncate">3. GJM &amp; Auditor Mutu (AMI)</span>
                      <span className="text-[11px] text-slate-400 block leading-tight">
                        Audit Kepatuhan Pasal 47 (Proyek ≥50%), Matriks PPEPP &amp; Berita Acara
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Admin */}
                <div
                  onClick={() => handleSelectRoleTab('admin')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                    selectedRole === 'admin'
                      ? 'bg-amber-600/20 border-amber-500/80 ring-1 ring-amber-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-white block truncate">4. Administrator IT</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Setting Database &amp; API Supabase
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              Dikembangkan oleh <strong className="text-slate-300">Dr. Bruri Melky Laimeheriwa and Partners</strong> • Spesialis Digitalisasi Asesmen OBE
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Masuk ke Portal Asesmen
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih peran dan otorisasi akses sistem
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    selectedRole === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : selectedRole === 'kaprodi'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : selectedRole === 'gjm'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {selectedRole === 'admin'
                    ? 'Role: Admin IT'
                    : selectedRole === 'kaprodi'
                    ? 'Role: Kaprodi'
                    : selectedRole === 'gjm'
                    ? 'Role: GJM / AMI'
                    : 'Role: Dosen Pengampu'}
                </span>
              </div>

              {/* Role Selector Tabs (Responsive Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 my-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSelectRoleTab('dosen')}
                  className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                    selectedRole === 'dosen'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dosen
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRoleTab('kaprodi')}
                  className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                    selectedRole === 'kaprodi'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kaprodi
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRoleTab('gjm')}
                  className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                    selectedRole === 'gjm'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  GJM / AMI
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRoleTab('admin')}
                  className={`py-2 rounded-lg transition-all cursor-pointer text-center ${
                    selectedRole === 'admin'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin IT
                </button>
              </div>

              {/* Tautan Langsung Terkunci (Hanya tampil jika dibuka via direct link ?prodi=..., ?fakultas=..., atau ?jenjang=...) */}
              {lockedInfo.isLocked && (
                <div className="mb-3 space-y-2">
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                      <span className="text-slate-300 text-xs truncate">
                        Portal Terkunci:{' '}
                        <strong className="text-white">
                          {lockedInfo.type === 'prodi' && lockedInfo.prodi
                            ? lockedInfo.prodi.name
                            : lockedInfo.type === 'faculty'
                            ? lockedInfo.faculty
                            : `Jenjang ${lockedInfo.jenjang}`}
                        </strong>
                      </span>
                    </div>
                    {lockedInfo.prodi?.code && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-mono text-[10px] font-extrabold border border-indigo-800 shrink-0">
                        {lockedInfo.prodi.code}
                      </span>
                    )}
                    {lockedInfo.type === 'faculty' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-mono text-[10px] font-extrabold border border-emerald-800 shrink-0">
                        Lingkup Fakultas
                      </span>
                    )}
                  </div>

                  {/* Jika terkunci di tingkat fakultas dan ada beberapa prodi dalam fakultas tersebut */}
                  {lockedInfo.type === 'faculty' && lockedInfo.scopedProdis && lockedInfo.scopedProdis.length > 1 && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <label className="text-[11px] font-semibold text-slate-400 shrink-0">
                        Pilih Prodi di {lockedInfo.faculty}:
                      </label>
                      <select
                        value={selectedProdi?.code || prodiCode || ''}
                        onChange={(e) => {
                          const p = lockedInfo.scopedProdis?.find((pr) => pr.code === e.target.value);
                          if (p) {
                            setSelectedProdi(p);
                            setProdiCode(p.code);
                            setProdiName(p.name);
                            setFacultyName(p.faculty);
                          }
                        }}
                        className="bg-slate-900 text-white font-semibold text-xs rounded-lg px-2 py-1 border border-slate-700 focus:outline-hidden focus:border-indigo-500 max-w-xs truncate"
                      >
                        {lockedInfo.scopedProdis.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.code} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handlePerformLogin} className="space-y-3.5">
                {/* 1. Nama Dosen / Kaprodi / Auditor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Lengkap &amp; Gelar Pengguna <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap & gelar..."
                    className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Nama ini akan tercantum resmi pada header portal, RPS, dan berita acara asesmen.
                  </span>
                </div>

                {/* 2. Field Kode Prodi & Nama Prodi (Wajib untuk Dosen, Kaprodi, GJM) */}
                <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-xs font-bold text-white">Lingkup Program Studi (Multi-Tenancy)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Wajib Diisi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Kode Prodi <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={prodiCode}
                        onChange={(e) => handleProdiCodeChange(e.target.value)}
                        placeholder="Kode prodi..."
                        className="w-full text-xs font-mono font-bold p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required={selectedRole !== 'admin'}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Nama Program Studi <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        list="unpatti-prodi-list-options"
                        value={prodiName}
                        onChange={(e) => handleProdiNameChange(e.target.value)}
                        placeholder="Pilih atau ketik nama program studi..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                        required={selectedRole !== 'admin'}
                      />
                      <datalist id="unpatti-prodi-list-options">
                        {UNPATTI_PRODI_117.map((pr) => (
                          <option key={pr.kode} value={pr.nama}>
                            {pr.kode} - {pr.nama} ({pr.fakultasShort})
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Fakultas preview */}
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800 text-slate-400">
                    <span>Fakultas / Unit Pengelola:</span>
                    <span className="text-indigo-200 font-semibold truncate">
                      {facultyName || <span className="text-slate-500 italic font-normal">Otomatis terisi saat memilih prodi</span>}
                    </span>
                  </div>
                </div>

                {/* 3. Username / NIP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username / NIP Pengguna <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username atau NIP..."
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* 4. Kata Sandi Otorisasi */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Kata Sandi Otorisasi
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ketik kata sandi"
                      className="w-full text-xs p-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer overflow-hidden"
                  >
                    <span className="truncate">
                      Masuk Portal ({selectedRole === 'admin'
                        ? 'Admin IT'
                        : selectedRole === 'kaprodi'
                        ? 'Kaprodi'
                        : selectedRole === 'gjm'
                        ? 'GJM / AMI'
                        : 'Dosen Pengampu'})
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Share Prodi Modal */}
      <ShareProdiModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeProdiSlug={selectedProdi?.slug || ''}
        onSelectProdi={(prodi) => {
          setSelectedProdi(prodi);
          setProdiCode(prodi.code);
          setProdiName(prodi.name);
          setFacultyName(prodi.faculty);
          const url = new URL(window.location.href);
          url.searchParams.set('prodi', prodi.slug);
          window.history.replaceState({}, '', url.toString());
        }}
      />

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        OBE Assessment Specialist &amp; Auditor Mutu Akademik • Universitas Pattimura • Peraturan Rektor No. 12 Tahun 2026 Pasal 47
      </footer>
    </div>
  );
};
