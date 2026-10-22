import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  HelpCircle,
  Sparkles,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';

export const InstructionGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-sky-50 to-white rounded-2xl border border-indigo-100 p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Petunjuk & Panduan Penggunaan OBE Assessment Specialist
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                Auditor Mutu Akademik
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Alur kerja 6-Tahapan Kalkulasi Otomatis + 2 Tahapan Pelaporan Komprehensif Akreditasi (LAM/BAN-PT).
            </p>
          </div>
        </div>

        <button
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <>
              Tutup Panduan <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Buka Petunjuk Lengkap <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-indigo-100 space-y-4 text-xs text-slate-700 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2 text-indigo-700">
                <UploadCloud className="w-4 h-4" />
                <span>1. Persiapan Berkas</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Siapkan 2 berkas utama mata kuliah Anda:
              </p>
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-600">
                <li><strong>File RPS (PDF):</strong> CPL, CPMK, & bobot asesmen.</li>
                <li><strong>File Nilai (Excel/CSV):</strong> Nilai mahasiswa per unit kelas.</li>
              </ul>
              <div className="mt-2 text-[10px] bg-emerald-50 text-emerald-800 p-1.5 rounded border border-emerald-200">
                💡 Tombol <strong>"Unduh Template Nilai"</strong> tersedia di sebelah kanan Berkas 2 & Tahap 4.
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2 text-indigo-700">
                <Sparkles className="w-4 h-4" />
                <span>2. Ekstraksi AI & Audit</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Gunakan <strong>"Unggah Berkas"</strong> untuk parsing AI otomatis, atau <strong>"Contoh Data"</strong> untuk eksplorasi instan. Semua angka dapat disunting langsung di tabel.
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2 text-indigo-700">
                <Award className="w-4 h-4" />
                <span>3. Evaluasi & Laporan</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Sistem menghitung capaian CPMK & CPL terhadap target benchmark <strong>75.00</strong>, menampilkan diagram visual, analisis perorangan mahasiswa, dan ekspor PDF/Word dengan grafik warna-warni.
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs bg-gradient-to-b from-emerald-50/40 to-white">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2 text-emerald-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>4. Database Supabase</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Role <strong>Admin Sistem</strong> dapat mengatur API Supabase via tombol <strong>"Setting Supabase"</strong> di header (dilindungi kata sandi otorisasi) untuk menyimpan & menyinkronkan data asesmen secara cloud.
              </p>
            </div>
          </div>

          {/* Alur 8 Tahapan Ringkas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 text-indigo-900">
              Struktur Baku Alur Kerja OBE Assessment:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 1: RPS Mapping</span>
                Identifikasi Mata Kuliah, CPL, dan CPMK turunan.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 2: Model Penilaian</span>
                Unsur penilaian & bobot % (Tugas, UTS, UAS, Proyek = 100%).
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 3: Pemetaan CPMK</span>
                Distribusi bobot unsur terhadap setiap CPMK.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 4: Nilai Mahasiswa</span>
                Rata-rata per Unit Kelas & Rata-rata Gabungan.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 5: Capaian CPMK</span>
                Rumus: (Nilai Awal × 100%) / %CPMK vs Target 75.00.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 6: Capaian CPL</span>
                Agregasi kontribusi per CPMK terhadap tiap CPL.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 7: Analisis CQI</span>
                Identifikasi gap dan rencana perbaikan semester depan.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-600 block">Tahap 8: Laporan Final</span>
                Laporan asesmen lengkap siap cetak / PDF akreditasi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
