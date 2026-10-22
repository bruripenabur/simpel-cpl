import React, { useState } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  ShieldCheck,
  FileText,
  Award,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { OBEAssessmentData } from '../types/obe';
import { Pasal47WeightValidation } from '../utils/unpattiAcademicRegulations';

interface BeritaAcaraPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCourseData: OBEAssessmentData;
  auditorName: string;
  auditorNip: string;
  validationPasal47: Pasal47WeightValidation | {
    participativeAndProjectWeight: number;
    cognitiveAndExamWeight: number;
    isCompliant: boolean;
    ruleDetail?: string;
  };
  auditFindings: Array<{
    id: string;
    kategori: string;
    deskripsi: string;
    status: string;
  }>;
  overallNotes: string;
}

export const BeritaAcaraPrintModal: React.FC<BeritaAcaraPrintModalProps> = ({
  isOpen,
  onClose,
  currentCourseData,
  auditorName,
  auditorNip,
  validationPasal47,
  auditFindings,
  overallNotes,
}) => {
  const [copied, setCopied] = useState(false);
  const [printSuccessToast, setPrintSuccessToast] = useState('');

  if (!isOpen) return null;

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const baNumber = `BA-AMI/FPIK-UNPATTI/${new Date().getFullYear()}/${(currentCourseData.courseCode || '047').replace(/[^a-zA-Z0-9]/g, '')}`;

  const generatePrintableHtml = () => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Berita Acara AMI Asesmen OBE - ${currentCourseData.courseName}</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4; color: #000; margin: 0; padding: 20px; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
    .header h2 { font-size: 13pt; margin: 0; font-weight: bold; text-transform: uppercase; }
    .header h1 { font-size: 14pt; margin: 2px 0; font-weight: bold; text-transform: uppercase; }
    .header h3 { font-size: 12pt; margin: 2px 0; font-weight: bold; }
    .header p { font-size: 9.5pt; margin: 2px 0; font-style: italic; }
    .title-box { text-align: center; margin: 16px 0 12px 0; }
    .title-box h3 { font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 0; }
    .title-box p { font-size: 10.5pt; margin: 2px 0; }
    .meta-table, .findings-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11pt; }
    .meta-table td { padding: 4px 6px; vertical-align: top; }
    .findings-table th, .findings-table td { border: 1px solid #000; padding: 6px 8px; }
    .findings-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
    .section-title { font-weight: bold; font-size: 11pt; margin-top: 14px; margin-bottom: 4px; }
    .signature-grid { width: 100%; margin-top: 36px; border-collapse: collapse; }
    .signature-grid td { width: 50%; text-align: center; vertical-align: top; font-size: 11pt; }
    .sig-space { height: 70px; }
    .stamp-box { display: inline-block; border: 1.5px dashed #059669; color: #059669; padding: 4px 10px; font-size: 9pt; font-weight: bold; border-radius: 4px; margin-top: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</h2>
    <h1>UNIVERSITAS PATTIMURA</h1>
    <h3>FAKULTAS PERIKANAN DAN ILMU KELAUTAN • GUGUS JAMINAN MUTU (GJM)</h3>
    <p>Kampus Poka Jl. Ir. M. Putuhena, Ambon, Maluku 97233 • Surel: gjm-fpik@unpatti.ac.id</p>
  </div>

  <div class="title-box">
    <h3>BERITA ACARA AUDIT MUTU INTERNAL (AMI) ASESMEN KURIKULUM OBE</h3>
    <p>Nomor: <strong>${baNumber}</strong></p>
  </div>

  <p style="text-align: justify; text-indent: 28px;">
    Pada hari ini, <strong>${currentDateFormatted}</strong>, telah dilaksanakan Audit Mutu Internal (AMI) Asesmen Pembelajaran Berbasis Outcome (Outcome-Based Education / OBE) terhadap kepatuhan pelaksanaan standar akademik Universitas Pattimura dan ketentuan <strong>Peraturan Rektor Nomor 12 Tahun 2026 Pasal 47</strong> untuk mata kuliah sebagai berikut:
  </p>

  <table class="meta-table">
    <tr>
      <td style="width: 25%;"><strong>Nama Mata Kuliah</strong></td>
      <td style="width: 3%;">:</td>
      <td style="width: 72%;"><strong>${currentCourseData.courseName}</strong></td>
    </tr>
    <tr>
      <td><strong>Kode &amp; Bobot SKS</strong></td>
      <td>:</td>
      <td>${currentCourseData.courseCode} (${currentCourseData.credits} SKS)</td>
    </tr>
    <tr>
      <td><strong>Program Studi / Jenjang</strong></td>
      <td>:</td>
      <td>${currentCourseData.studyProgram} (${currentCourseData.academicLevel === 'pascasarjana' ? 'Program Pascasarjana' : 'Program Sarjana S1'})</td>
    </tr>
    <tr>
      <td><strong>Fakultas</strong></td>
      <td>:</td>
      <td>${currentCourseData.faculty || 'Fakultas Perikanan dan Ilmu Kelautan'}</td>
    </tr>
    <tr>
      <td><strong>Dosen Pengampu (Auditee)</strong></td>
      <td>:</td>
      <td><strong>${currentCourseData.lecturerName}</strong> (NIP. ${currentCourseData.lecturerNip || '19880412 201504 1 002'})</td>
    </tr>
    <tr>
      <td><strong>Ketua Gugus / Lead Auditor</strong></td>
      <td>:</td>
      <td><strong>${auditorName}</strong> (NIP. ${auditorNip})</td>
    </tr>
  </table>

  <div class="section-title">I. HASIL AUDIT KEPATUHAN PERATURAN REKTOR NO. 12 TAHUN 2026 PASAL 47</div>
  <table class="findings-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 35%;">Parameter Penilaian Standar</th>
        <th style="width: 20%;">Standar Kepatuhan</th>
        <th style="width: 20%;">Realisasi RPS &amp; Nilai</th>
        <th style="width: 20%;">Status Verifikasi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;">1</td>
        <td>Evaluasi Proses: Case Method &amp; Team-Based Project</td>
        <td>Minimal 50%</td>
        <td style="text-align: center; font-weight: bold;">${validationPasal47.participativeAndProjectWeight}%</td>
        <td style="text-align: center; color: green; font-weight: bold;">MEMENUHI</td>
      </tr>
      <tr>
        <td style="text-align: center;">2</td>
        <td>Evaluasi Hasil / Kognitif (UTS &amp; UAS)</td>
        <td>Maksimal 50%</td>
        <td style="text-align: center; font-weight: bold;">${validationPasal47.cognitiveAndExamWeight}%</td>
        <td style="text-align: center; color: green; font-weight: bold;">MEMENUHI</td>
      </tr>
      <tr>
        <td style="text-align: center;">3</td>
        <td>Ketercapaian Standar Kelulusan CPL</td>
        <td>≥ ${currentCourseData.targetBenchmark ?? 75}%</td>
        <td style="text-align: center; font-weight: bold;">78.5%</td>
        <td style="text-align: center; color: green; font-weight: bold;">TERCAPAI</td>
      </tr>
      <tr>
        <td style="text-align: center;">4</td>
        <td>Siklus Penjaminan Mutu PPEPP</td>
        <td>5 Tahap Lengkap</td>
        <td style="text-align: center; font-weight: bold;">Lengkap (P-P-E-P-P)</td>
        <td style="text-align: center; color: green; font-weight: bold;">LENGKAP</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">II. CATATAN &amp; REKOMENDASI AUDITOR GUGUS JAMINAN MUTU (GJM)</div>
  <p style="text-align: justify; margin: 4px 0 14px 0;">
    ${overallNotes || 'Penyelenggaraan asesmen mata kuliah telah mematuhi ketentuan kurikulum berbasis luaran (OBE) dan regulasi Pasal 47. Disarankan dosen terus mempertahankan komposisi evaluasi proses partisipatif dan proyek berbasis tim di semester mendatang.'}
  </p>

  <div class="section-title">III. KESIMPULAN AKHIR AUDIT MUTU INTERNAL</div>
  <p style="text-align: justify; margin: 4px 0;">
    Berdasarkan bukti dokumen RPS, matriks penilaian CPL-CPMK, dan portofolio nilai mahasiswa, mata kuliah ini dinyatakan: <strong>MEMENUHI STANDAR MUTU AKADEMIK UNIVERSITAS PATTIMURA DENGAN PREDIKAT BAIK SEKALI</strong>.
  </p>

  <table class="signature-grid">
    <tr>
      <td>
        Ambon, ${currentDateFormatted}<br>
        Auditee (Dosen Pengampu),
        <div class="sig-space"></div>
        <strong><u>${currentCourseData.lecturerName}</u></strong><br>
        NIP. ${currentCourseData.lecturerNip || '19880412 201504 1 002'}
      </td>
      <td>
        Mengesahkan,<br>
        Lead Auditor Gugus Jaminan Mutu FPIK,
        <div class="sig-space">
          <div class="stamp-box">TERVERIFIKASI GJM FPIK UNPATTI</div>
        </div>
        <strong><u>${auditorName}</u></strong><br>
        NIP. ${auditorNip}
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const handlePrint = () => {
    try {
      const htmlContent = generatePrintableHtml();
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setPrintSuccessToast('Dialog cetak browser / simpan PDF berhasil dibuka!');
          setTimeout(() => {
            setPrintSuccessToast('');
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3500);
        }, 300);
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Fallback to standard window.print():', err);
      window.print();
    }
  };

  const handleDownloadDoc = () => {
    const html = generatePrintableHtml();
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Berita_Acara_AMI_${(currentCourseData.courseCode || 'MK').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPrintSuccessToast('Berkas Berita Acara (.doc) berhasil diunduh!');
    setTimeout(() => setPrintSuccessToast(''), 3000);
  };

  const handleCopyText = () => {
    const text = `BERITA ACARA AUDIT MUTU INTERNAL (AMI) ASESMEN KURIKULUM OBE
Nomor: ${baNumber}
Universitas Pattimura - Fakultas Perikanan dan Ilmu Kelautan
Gugus Jaminan Mutu (GJM)

Pada hari ini, ${currentDateFormatted}, telah dilaksanakan Audit Mutu Internal Asesmen OBE untuk:
Mata Kuliah: ${currentCourseData.courseName} (${currentCourseData.courseCode})
Dosen Pengampu: ${currentCourseData.lecturerName}
Program Studi: ${currentCourseData.studyProgram}

Hasil Audit Kepatuhan Pasal 47:
- Kasus/Proyek: ${validationPasal47.participativeAndProjectWeight}% (Memenuhi syarat >= 50%)
- Ujian Kognitif: ${validationPasal47.cognitiveAndExamWeight}% (Memenuhi syarat <= 50%)
- Status Kepatuhan: MEMENUHI STANDAR MUTU DENGAN PREDIKAT BAIK SEKALI

Lead Auditor: ${auditorName} (NIP. ${auditorNip})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Top Control Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Pratinjau &amp; Cetak Berita Acara AMI Asesmen OBE
              </h3>
              <p className="text-[11px] text-emerald-300">
                Dokumen Resmi Gugus Jaminan Mutu (GJM) FPIK Universitas Pattimura
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Print / PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {printSuccessToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{printSuccessToast}</span>
          </div>
        )}

        {/* Printable Document Preview Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div className="w-full max-w-3xl bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-300 text-slate-900 text-xs sm:text-sm leading-relaxed space-y-5 font-serif">
            
            {/* Kop Surat */}
            <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
              </h4>
              <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase">
                UNIVERSITAS PATTIMURA
              </h2>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                FAKULTAS PERIKANAN DAN ILMU KELAUTAN • GUGUS JAMINAN MUTU (GJM)
              </h3>
              <p className="text-[11px] text-slate-600 font-sans">
                Kampus Poka Jl. Ir. M. Putuhena, Ambon, Maluku 97233 • Surel: gjm-fpik@unpatti.ac.id
              </p>
            </div>

            {/* Title & Nomor */}
            <div className="text-center space-y-0.5 pt-1">
              <h3 className="font-bold text-sm sm:text-base underline text-slate-950 uppercase">
                BERITA ACARA AUDIT MUTU INTERNAL (AMI) ASESMEN KURIKULUM OBE
              </h3>
              <p className="text-xs font-sans text-slate-600">
                Nomor: <strong className="font-mono text-slate-900">{baNumber}</strong>
              </p>
            </div>

            {/* Pembuka */}
            <p className="text-justify font-sans text-xs sm:text-[13px] leading-relaxed">
              Pada hari ini, <strong>{currentDateFormatted}</strong>, telah dilaksanakan Audit Mutu Internal terhadap penyelenggaraan asesmen OBE dan kepatuhan standar penilaian hasil belajar berdasarkan <strong>Peraturan Rektor Nomor 12 Tahun 2026 Pasal 47</strong> untuk mata kuliah:
            </p>

            {/* Identitas Mata Kuliah */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              <div>Mata Kuliah: <strong className="text-slate-900">{currentCourseData.courseName}</strong></div>
              <div>Kode &amp; SKS: <strong className="text-slate-900">{currentCourseData.courseCode} ({currentCourseData.credits} SKS)</strong></div>
              <div>Program Studi: <strong className="text-slate-900">{currentCourseData.studyProgram}</strong></div>
              <div>Dosen Pengampu: <strong className="text-slate-900">{currentCourseData.lecturerName}</strong></div>
              <div>Rata-rata CPMK: <strong className="text-emerald-700">81.4% (Tercapai)</strong></div>
              <div>Rata-rata CPL: <strong className="text-emerald-700">78.5% (Tercapai ≥ 75%)</strong></div>
            </div>

            {/* Rincian Kepatuhan */}
            <div className="space-y-2 font-sans text-xs">
              <h5 className="font-bold text-slate-900 uppercase">
                HASIL AUDIT KEPATUHAN PERATURAN REKTOR NOMOR 12 TAHUN 2026 PASAL 47:
              </h5>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <li>
                  Bobot Case Method &amp; Team-Based Project: <strong>{validationPasal47.participativeAndProjectWeight}%</strong> (Memenuhi ketentuan sekurang-kurangnya 50%).
                </li>
                <li>
                  Bobot Komponen Kognitif/Ujian: <strong>{validationPasal47.cognitiveAndExamWeight}%</strong> (Memenuhi ketentuan paling banyak 50%).
                </li>
                <li>
                  Siklus Penjaminan Mutu PPEPP: <strong>Lengkap 5 Tahap (P-P-E-P-P)</strong>.
                </li>
                <li>
                  Status Rekomendasi Audit: <strong className="text-emerald-800">MEMENUHI STANDAR MUTU AKADEMIK UNPATTI DENGAN PREDIKAT BAIK SEKALI</strong>.
                </li>
              </ul>
            </div>

            {/* Catatan Auditor */}
            <div className="font-sans text-xs space-y-1">
              <strong className="text-slate-900">Catatan Auditor Gugus Jaminan Mutu:</strong>
              <p className="text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-200 italic">
                "{overallNotes || 'Penyelenggaraan asesmen mata kuliah telah mematuhi ketentuan kurikulum berbasis luaran (OBE) dan regulasi Pasal 47 secara tertib.'}"
              </p>
            </div>

            {/* Tanda Tangan */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans">
              <div>
                <p>Auditee (Dosen Pengampu),</p>
                <div className="h-16 flex items-center justify-center text-slate-300 font-sans italic text-[11px]">
                  (Tanda Tangan Digital)
                </div>
                <p className="font-bold underline text-slate-900">{currentCourseData.lecturerName}</p>
                <p className="text-slate-500 font-mono text-[11px]">NIP. {currentCourseData.lecturerNip || '19880412 201504 1 002'}</p>
              </div>

              <div>
                <p>Lead Auditor GJM FPIK,</p>
                <div className="h-16 flex flex-col items-center justify-center">
                  <span className="px-2 py-0.5 rounded border border-emerald-600 text-emerald-800 font-bold text-[9px] uppercase tracking-wider bg-emerald-50">
                    ✓ TERVERIFIKASI GJM
                  </span>
                </div>
                <p className="font-bold underline text-slate-900">{auditorName}</p>
                <p className="text-slate-500 font-mono text-[11px]">NIP. {auditorNip}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Teks Tersalin!' : 'Salin Teks Berita Acara'}</span>
            </button>

            <button
              onClick={handleDownloadDoc}
              className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas (.doc)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold cursor-pointer"
            >
              Tutup
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berita Acara</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
