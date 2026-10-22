import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  GraduationCap,
  Award,
  Building2,
  Search,
  Sparkles,
  Link as LinkIcon,
  Filter,
  CheckCircle2,
  BookOpen,
  Lock,
} from 'lucide-react';
import {
  LIST_PROGRAM_STUDI,
  LIST_FAKULTAS,
  ProgramStudiInfo,
  getProdiShareableLink,
  getJenjangShareableLink,
  copyToClipboard,
} from '../utils/prodiHelper';

interface ShareProdiModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProdiSlug?: string;
  onSelectProdi?: (prodi: ProgramStudiInfo) => void;
}

export const ShareProdiModal: React.FC<ShareProdiModalProps> = ({
  isOpen,
  onClose,
  activeProdiSlug,
  onSelectProdi,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string>('Semua Fakultas & Pascasarjana / PSDKU (12)');
  const [selectedDegree, setSelectedDegree] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = async (prodi: ProgramStudiInfo, role?: string) => {
    // Generate link using the official kode or slug
    const link = getProdiShareableLink(prodi.code || prodi.slug, role);
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedKey(`${prodi.code}_${role || 'all'}`);
      setToastMessage(
        `Link langsung untuk ${prodi.name} (?prodi=${prodi.code}) berhasil disalin ke clipboard!`
      );
      setTimeout(() => {
        setCopiedKey(null);
        setToastMessage(null);
      }, 3500);
    }
  };

  const handleCopyJenjangLink = async (jenjangKey: string, label: string) => {
    const link = getJenjangShareableLink(jenjangKey);
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedKey(`jenjang_${jenjangKey}`);
      setToastMessage(
        `Link langsung jenjang ${label} (?jenjang=${jenjangKey}) berhasil disalin ke clipboard!`
      );
      setTimeout(() => {
        setCopiedKey(null);
        setToastMessage(null);
      }, 3500);
    }
  };

  const filteredProdis = useMemo(() => {
    return LIST_PROGRAM_STUDI.filter((p) => {
      const matchFaculty =
        selectedFaculty === 'Semua Fakultas & Pascasarjana / PSDKU (12)' ||
        selectedFaculty === 'Semua Fakultas' ||
        p.faculty === selectedFaculty;
      const matchDegree =
        selectedDegree === 'Semua' || p.degree === selectedDegree;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.faculty.toLowerCase().includes(q) ||
        p.degree.toLowerCase().includes(q);
      return matchFaculty && matchDegree && matchSearch;
    });
  }, [selectedFaculty, selectedDegree, searchQuery]);

  // Color mapper matching desain-rpsobe style
  const getColorStyles = (scheme: string = 'blue', isActive: boolean = false) => {
    if (isActive) {
      return {
        card: 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/30 shadow-md',
        badge: 'bg-indigo-600 text-white border-indigo-700',
        degreeBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold',
        codeBadge: 'bg-indigo-900 text-white font-mono',
        btnCopy: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-300',
        textAccent: 'text-indigo-950',
      };
    }

    switch (scheme) {
      case 'cyan':
        return {
          card: 'bg-white hover:bg-cyan-50/30 border-cyan-200/80 hover:border-cyan-400 shadow-xs hover:shadow-md',
          badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          degreeBadge: 'bg-cyan-100/90 text-cyan-900 border-cyan-300 font-bold',
          codeBadge: 'bg-cyan-900 text-cyan-100 font-mono',
          btnCopy: 'bg-cyan-700 hover:bg-cyan-800 text-white shadow-cyan-200',
          textAccent: 'text-cyan-950',
        };
      case 'purple':
        return {
          card: 'bg-white hover:bg-purple-50/30 border-purple-200/80 hover:border-purple-400 shadow-xs hover:shadow-md',
          badge: 'bg-purple-50 text-purple-800 border-purple-200',
          degreeBadge: 'bg-purple-100/90 text-purple-900 border-purple-300 font-bold',
          codeBadge: 'bg-purple-900 text-purple-100 font-mono',
          btnCopy: 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-200',
          textAccent: 'text-purple-950',
        };
      case 'green':
        return {
          card: 'bg-white hover:bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-400 shadow-xs hover:shadow-md',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          degreeBadge: 'bg-emerald-100/90 text-emerald-900 border-emerald-300 font-bold',
          codeBadge: 'bg-emerald-900 text-emerald-100 font-mono',
          btnCopy: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-200',
          textAccent: 'text-emerald-950',
        };
      case 'amber':
        return {
          card: 'bg-white hover:bg-amber-50/30 border-amber-200/80 hover:border-amber-400 shadow-xs hover:shadow-md',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          degreeBadge: 'bg-amber-100/90 text-amber-900 border-amber-300 font-bold',
          codeBadge: 'bg-amber-900 text-amber-100 font-mono',
          btnCopy: 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-200',
          textAccent: 'text-amber-950',
        };
      case 'rose':
        return {
          card: 'bg-white hover:bg-rose-50/30 border-rose-200/80 hover:border-rose-400 shadow-xs hover:shadow-md',
          badge: 'bg-rose-50 text-rose-800 border-rose-200',
          degreeBadge: 'bg-rose-100/90 text-rose-900 border-rose-300 font-bold',
          codeBadge: 'bg-rose-900 text-rose-100 font-mono',
          btnCopy: 'bg-rose-700 hover:bg-rose-800 text-white shadow-rose-200',
          textAccent: 'text-rose-950',
        };
      case 'indigo':
        return {
          card: 'bg-white hover:bg-indigo-50/30 border-indigo-200/80 hover:border-indigo-400 shadow-xs hover:shadow-md',
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          degreeBadge: 'bg-indigo-100/90 text-indigo-900 border-indigo-300 font-bold',
          codeBadge: 'bg-indigo-900 text-indigo-100 font-mono',
          btnCopy: 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-indigo-200',
          textAccent: 'text-indigo-950',
        };
      case 'blue':
      default:
        return {
          card: 'bg-white hover:bg-blue-50/30 border-blue-200/80 hover:border-blue-400 shadow-xs hover:shadow-md',
          badge: 'bg-blue-50 text-blue-800 border-blue-200',
          degreeBadge: 'bg-blue-100/90 text-blue-900 border-blue-300 font-bold',
          codeBadge: 'bg-blue-900 text-blue-100 font-mono',
          btnCopy: 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-200',
          textAccent: 'text-blue-950',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 sm:p-6 flex items-start justify-between border-b border-indigo-900/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl font-black tracking-tight text-white">
                  Universal Direct Portal Link (117 Prodi &amp; Jenjang)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  1 Codebase Terpusat
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Salin link khusus per Program Studi atau Jenjang. Saat dibuka, nama prodi, fakultas, dan aturan penilaian langsung terkunci otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-inner animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Universal Concept Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed space-y-1">
              <strong className="font-bold text-indigo-950 block">
                Prinsip Universal 1 Codebase dengan Direct Portal Link:
              </strong>
              <p className="text-slate-700">
                Aplikasi tetap 1 codebase terpusat di server, namun setiap prodi atau jenjang memiliki parameter URL khusus (misal: <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono font-bold text-indigo-900">?prodi=54201</code> atau <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono font-bold text-indigo-900">?jenjang=s2</code>).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600 font-medium">
                <div>✓ <strong>Hemat Waktu:</strong> Update OBE/Permendikbudristek di 1 tempat, 117 prodi otomatis ter-update.</div>
                <div>✓ <strong>Terkunci Otomatis:</strong> Nama prodi, fakultas, batas semester, &amp; regulasi terkunci otomatis.</div>
              </div>
            </div>
          </div>

          {/* Direct Portal Link per Jenjang KKNI */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-black text-white">Tautan Akses Cepat Berdasarkan Jenjang KKNI (Universal):</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Contoh: Dosen S2 membuka ?jenjang=s2</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { key: 's1', label: 'Jenjang S1 (Sarjana)', param: '?jenjang=s1', color: 'text-indigo-400' },
                { key: 's2', label: 'Jenjang S2 (Magister)', param: '?jenjang=s2', color: 'text-sky-400' },
                { key: 's3', label: 'Jenjang S3 (Doktor)', param: '?jenjang=s3', color: 'text-cyan-400' },
                { key: 'profesi', label: 'Program Profesi', param: '?jenjang=profesi', color: 'text-purple-400' },
                { key: 'sp-1', label: 'Spesialis (Sp-1)', param: '?jenjang=sp-1', color: 'text-rose-400' },
              ].map((j) => (
                <button
                  key={j.key}
                  type="button"
                  onClick={() => handleCopyJenjangLink(j.key, j.label)}
                  className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-left border border-slate-700/80 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                  title={`Salin tautan langsung untuk ${j.label}`}
                >
                  <span className="text-[11px] font-extrabold text-slate-200 group-hover:text-white truncate">
                    {j.label}
                  </span>
                  <span className={`text-[10px] font-mono ${j.color} flex items-center justify-between mt-1 pt-1 border-t border-slate-700/60`}>
                    <span>{j.param}</span>
                    {copiedKey === `jenjang_${j.key}` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search & Degree Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode (contoh: 54201, 54231, 86004), nama prodi, atau fakultas..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Jenjang Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 overflow-x-auto text-xs font-semibold">
              {['Semua', 'S1', 'S2', 'S3', 'Profesi', 'Sp-1'].map((deg) => (
                <button
                  key={deg}
                  onClick={() => setSelectedDegree(deg)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedDegree === deg
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {deg}
                </button>
              ))}
            </div>
          </div>

          {/* Faculty Horizontal Pill Filters (12 Fakultas / PSDKU) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
              <span>Filter Berdasarkan Fakultas &amp; Unit Pengelola:</span>
              <span>Menampilkan {filteredProdis.length} dari {LIST_PROGRAM_STUDI.length} Program Studi</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold scrollbar-none">
              {LIST_FAKULTAS.map((fac) => {
                const isSelected = selectedFaculty === fac;
                const count =
                  fac === 'Semua Fakultas & Pascasarjana / PSDKU (12)' || fac === 'Semua Fakultas'
                    ? LIST_PROGRAM_STUDI.length
                    : LIST_PROGRAM_STUDI.filter((p) => p.faculty === fac).length;

                // Clean shorthand label
                const shortLabel = fac
                  .replace('Semua Fakultas & Pascasarjana / PSDKU (12)', 'Semua (117)')
                  .replace('Fakultas Perikanan dan Ilmu Kelautan', 'FPIK')
                  .replace('Fakultas Keguruan dan Ilmu Pendidikan', 'FKIP')
                  .replace('Fakultas Matematika dan Ilmu Pengetahuan Alam', 'FMIPA')
                  .replace('Fakultas Pertanian', 'FAPERTA')
                  .replace('Fakultas Ekonomi dan Bisnis', 'FEB')
                  .replace('Fakultas Hukum', 'FH')
                  .replace('Fakultas Ilmu Sosial dan Ilmu Politik', 'FISIP')
                  .replace('Fakultas Kedokteran', 'FK')
                  .replace('Fakultas Sains dan Teknologi', 'FST')
                  .replace('Fakultas Teknik', 'FATEK')
                  .replace('Program Pascasarjana', 'Pascasarjana')
                  .replace('PSDKU Kab. Kepulauan Aru', 'PSDKU Aru')
                  .replace('PSDKU Kab. Maluku Barat Daya', 'PSDKU MBD');

                return (
                  <button
                    key={fac}
                    onClick={() => setSelectedFaculty(fac)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{shortLabel}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Prodis (Exact Desain-RPS OBE Card Format) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {filteredProdis.length === 0 ? (
              <div className="col-span-full text-center py-10 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                Tidak ada program studi yang cocok dengan filter atau kata kunci &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredProdis.map((prodi, idx) => {
                const isActive =
                  activeProdiSlug === prodi.slug ||
                  activeProdiSlug === prodi.code ||
                  activeProdiSlug === prodi.id;
                const directLink = getProdiShareableLink(prodi.code || prodi.slug);
                const styles = getColorStyles(prodi.colorScheme, isActive);

                return (
                  <div
                    key={prodi.id + prodi.code}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${styles.card}`}
                  >
                    <div className="space-y-2">
                      {/* Top Badges: Kode, Jenjang, Semester */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold shadow-2xs ${styles.codeBadge}`}>
                            {prodi.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] border ${styles.degreeBadge}`}>
                            {prodi.degree}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {prodi.semester} Semester
                          </span>
                        </div>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                            <Check className="w-3 h-3" />
                            <span>Terkunci Aktif</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Faculty */}
                      <div>
                        <h4 className={`font-black text-sm sm:text-base leading-snug ${styles.textAccent}`}>
                          {prodi.name}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prodi.faculty}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          Kaprodi: {prodi.defaultKaprodi}
                        </div>
                      </div>

                      {/* Shareable Link Box Preview */}
                      <div className="pt-1">
                        <div className="text-[11px] text-indigo-900 font-mono truncate bg-slate-100/90 px-2.5 py-1.5 rounded-lg border border-slate-200/90 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{directLink}</span>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-bold shrink-0">?prodi={prodi.code}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 font-mono">
                        #{idx + 1}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(prodi)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            copiedKey === `${prodi.code}_all`
                              ? 'bg-emerald-600 text-white'
                              : styles.btnCopy
                          }`}
                          title={`Salin tautan langsung untuk ${prodi.name}`}
                        >
                          {copiedKey === `${prodi.code}_all` ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        {onSelectProdi && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProdi(prodi);
                              onClose();
                            }}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            <span>Kunci Prodi Ini</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Ekosistem OBE Universitas Pattimura • 117 Program Studi Resmi Terdaftar</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
