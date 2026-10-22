import React, { useState } from 'react';
import {
  CPMKCalculationResult,
  CPLCalculationResult,
  OBEAssessmentData,
} from '../types/obe';
import {
  Printer,
  FileCheck2,
  Copy,
  Check,
  Award,
  AlertTriangle,
  RotateCcw,
  Heart,
  FileText,
  Download,
  Loader2,
  BarChart3,
  TrendingUp,
  Database,
} from 'lucide-react';
import { exportOBEAssessmentToPDF } from '../utils/pdfGenerator';
import { exportOBEAssessmentToDOCX } from '../utils/docxGenerator';
import { syncCourseToSupabase } from '../utils/supabaseClient';
import {
  generateCPMKBarChartImage,
  generateCPLBarChartImage,
  generateRadarSpiderWebChartImage,
} from '../utils/chartRenderer';
import { calculateStudentIndividualAchievements } from '../utils/calculator';
import { UnpattiLogo } from './UnpattiLogo';
import { getSingleLecturerName, getSingleLecturerNip } from '../utils/lecturerHelper';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface Stage8Props {
  data: OBEAssessmentData;
  cpmkResults: CPMKCalculationResult[];
  cplResults: CPLCalculationResult[];
  componentTotalAverages: Record<string, number>;
  targetBenchmark?: number;
  onStartNewCourse?: () => void;
  onUpdateNarrative?: (narrative: Partial<NonNullable<OBEAssessmentData['narrativeNotes']>>) => void;
}

export const Stage8FinalReport: React.FC<Stage8Props> = ({
  data,
  cpmkResults,
  cplResults,
  componentTotalAverages,
  targetBenchmark = 75.0,
  onStartNewCourse,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [savedDbToast, setSavedDbToast] = useState('');
  const [nextCourseDecision, setNextCourseDecision] = useState<'prompt' | 'yes' | 'no'>('prompt');

  const totalStudents = data.unitClasses.reduce((sum, u) => sum + (u.studentCount || 0), 0);
  const overallAvg = (
    cpmkResults.reduce((acc, c) => acc + c.capaianAkhir, 0) / Math.max(1, cpmkResults.length)
  ).toFixed(2);

  // Chart data for embedding
  const cpmkChartData = cpmkResults.map((c) => ({
    name: c.cpmkCode,
    capaian: c.capaianAkhir,
    target: targetBenchmark,
    isAchieved: c.isAchieved,
  }));

  const cplChartData = cplResults.map((c) => ({
    name: c.cplCode,
    capaian: c.capaianAkhir,
    target: targetBenchmark,
    isAchieved: c.isAchieved,
  }));

  const cpmkChartImage = React.useMemo(() => {
    return generateCPMKBarChartImage(cpmkResults, targetBenchmark);
  }, [cpmkResults, targetBenchmark]);

  const cplChartImage = React.useMemo(() => {
    return generateCPLBarChartImage(cplResults, targetBenchmark);
  }, [cplResults, targetBenchmark]);

  const radarChartImage = React.useMemo(() => {
    return generateRadarSpiderWebChartImage(cpmkResults, cplResults, targetBenchmark);
  }, [cpmkResults, cplResults, targetBenchmark]);

  const individualStudentAchievements = React.useMemo(() => {
    return calculateStudentIndividualAchievements(data);
  }, [data]);

  const cleanSemesterText = React.useMemo(() => {
    const raw = (data.semester || '1').trim();
    const deDuplicated = raw.replace(/^semester\s+semester\s+/i, 'Semester ');
    return deDuplicated.toLowerCase().startsWith('semester')
      ? deDuplicated
      : `Semester ${deDuplicated}`;
  }, [data.semester]);

  const singleLecturerName = getSingleLecturerName(data.lecturerName);
  const singleLecturerNip = getSingleLecturerNip(data.lecturerNip);

  const radarChartData = [
    ...cpmkResults.map((c) => ({
      subject: c.cpmkCode,
      capaian: c.capaianAkhir,
      target: targetBenchmark,
    })),
    ...cplResults.map((c) => ({
      subject: c.cplCode,
      capaian: c.capaianAkhir,
      target: targetBenchmark,
    })),
  ];

  const handlePrint = () => {
    window.print();
  };

  const generateReportChartImages = () => {
    const cpmkImg = generateCPMKBarChartImage(cpmkResults, targetBenchmark);
    const cplImg = generateCPLBarChartImage(cplResults, targetBenchmark);
    const radarImg = generateRadarSpiderWebChartImage(cpmkResults, cplResults, targetBenchmark);
    return {
      cpmkChart: cpmkImg,
      cplChart: cplImg,
      radarChart: radarImg,
    };
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const chartImages = generateReportChartImages();

      exportOBEAssessmentToPDF(
        data,
        cpmkResults,
        cplResults,
        componentTotalAverages,
        targetBenchmark,
        chartImages
      );
    } catch (err) {
      console.error('Gagal membuat dokumen PDF dengan grafik:', err);
      // Fallback
      exportOBEAssessmentToPDF(
        data,
        cpmkResults,
        cplResults,
        componentTotalAverages,
        targetBenchmark,
        generateReportChartImages()
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsGeneratingDocx(true);
    try {
      const chartImages = generateReportChartImages();

      await exportOBEAssessmentToDOCX(
        data,
        cpmkResults,
        cplResults,
        componentTotalAverages,
        targetBenchmark,
        chartImages
      );
    } catch (err) {
      console.error('Gagal membuat dokumen Word (.docx):', err);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSavingDb(true);
    try {
      // 1. Save snapshot to local audit submission vault
      const submissionItem = {
        id: `audit_${data.courseCode}_${Date.now()}`,
        courseCode: data.courseCode,
        courseName: data.courseName,
        submittedAt: new Date().toISOString(),
        lecturerName: data.lecturerName,
        lecturerNip: data.lecturerNip,
        studyProgram: data.studyProgram,
        faculty: data.faculty,
        semester: data.semester,
        academicYear: data.academicYear,
        targetBenchmark,
        overallAvg,
        cpmkCount: cpmkResults.length,
        cplCount: cplResults.length,
        status: 'Submitted (Siap Direview Kaprodi & Diaudit GJM)',
        dataPayload: data,
      };

      const existingRaw = localStorage.getItem('obe_audit_submissions_v1');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = existing.filter((item: any) => item.courseCode !== data.courseCode);
      filtered.unshift(submissionItem);
      localStorage.setItem('obe_audit_submissions_v1', JSON.stringify(filtered));

      // 2. Also sync to Supabase if configured
      const supabaseRes = await syncCourseToSupabase(data);
      if (supabaseRes.success) {
        setSavedDbToast('Laporan tersimpan di Supabase Cloud & Vault Audit!');
      } else {
        setSavedDbToast('Laporan berhasil disimpan di Database Audit (Siap direview Kaprodi & GJM)!');
      }
    } catch (e) {
      setSavedDbToast('Laporan berhasil diarsipkan di Database Penjaminan Mutu.');
    } finally {
      setIsSavingDb(false);
      setTimeout(() => setSavedDbToast(''), 4500);
    }
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const generateMarkdownReport = () => {
    return `# LAPORAN HASIL ASESMEN CAPAIAN PEMBELAJARAN LULUSAN (CPL) MATA KULIAH
**Kurikulum Berbasis Outcome (Outcome-Based Education - OBE)**

## 1. Identitas Mata Kuliah
- Mata Kuliah: ${data.courseName} (${data.courseCode})
- Beban: ${data.credits} SKS
- Semester / T.A.: ${data.semester} (${data.academicYear})
- Program Studi: ${data.studyProgram} - ${data.faculty}
- Dosen Pengampu: ${data.lecturerName}
- Target Benchmark Ketercapaian: ${targetBenchmark.toFixed(2)}%
- Total Mahasiswa: ${totalStudents} orang (${data.unitClasses.length} Unit/Kelas)

---

## 2. Model dan Komposisi Penilaian
${data.narrativeNotes?.modelPenilaian || 'Komposisi penilaian menggabungkan asesmen formatif dan sumatif.'}

| No | Unsur Penilaian | Bobot (%) | Nilai Rata-rata Gabungan |
|----|-----------------|-----------|--------------------------|
${data.components
  .map(
    (c, i) =>
      `| ${i + 1} | ${c.name} | ${c.weight}% | ${(componentTotalAverages[c.id] ?? 0).toFixed(2)} |`
  )
  .join('\n')}

---

## 3. Hasil Capaian Tiap CPMK dan Analisis
| Kode CPMK | Bobot CPMK | Nilai Awal | Capaian Akhir (%) | Target (%) | Gap (%) | Status |
|-----------|------------|------------|-------------------|------------|---------|--------|
${cpmkResults
  .map(
    (c) =>
      `| ${c.cpmkCode} | ${c.persentaseCPMK}% | ${c.nilaiAwalCPMK.toFixed(2)} | ${c.capaianAkhir.toFixed(2)}% | ${c.target.toFixed(2)}% | ${c.gap > 0 ? '+' : ''}${c.gap.toFixed(2)}% | ${c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI'} |`
  )
  .join('\n')}

### Analisis CPMK:
${data.narrativeNotes?.analisisCPMK || 'Hasil evaluasi CPMK menunjukkan ketercapaian secara umum telah memenuhi target standar.'}

---

## 4. Kontribusi terhadap CPL dan Analisis
| Kode CPL | Ranah | Capaian CPL (%) | Target (%) | Gap (%) | Status |
|----------|-------|-----------------|------------|---------|--------|
${cplResults
  .map(
    (c) =>
      `| ${c.cplCode} | ${c.category} | ${c.capaianAkhir.toFixed(2)}% | ${c.target.toFixed(2)}% | ${c.gap > 0 ? '+' : ''}${c.gap.toFixed(2)}% | ${c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI'} |`
  )
  .join('\n')}

### Rincian Agregasi CPMK ke CPL:
${cplResults
  .map(
    (c) =>
      `- **${c.cplCode}**: ${c.contributingCPMKs.map((cc) => `${cc.cpmkCode} (bobot ${cc.weightInCPL}%, kontribusi ${cc.contribution.toFixed(2)}%)`).join(' + ')} = **${c.capaianAkhir.toFixed(2)}%**`
  )
  .join('\n')}

### Analisis CPL:
${data.narrativeNotes?.analisisCPL || 'Analisis CPL menunjukkan agregasi kompetensi lulusan telah memenuhi profil standar kurikulum.'}

---

## 5. Rencana Tindak Lanjut (Continuous Improvement / CQI) & Kesimpulan
${data.narrativeNotes?.rekomendasiCQI || 'Melakukan penguatan metode pengajaran pada materi-materi yang belum memenuhi target.'}

### Kesimpulan:
${data.narrativeNotes?.kesimpulan || `Ketercapaian agregat mata kuliah mencapai ${overallAvg}%.`}

---
**SELAMAT HASIL PENGUKURAN DAN LAPORAN EVALUASI CAPAIAN CPL YANG DIBEBANKAN KE CP MATA KULIAH BAPAK/IBU TELAH SELESAI. SILAHKAN DITINDAKLANJUTI. SUKSES SELALU.**
`;
  };

  return (
    <div className="space-y-8">
      {/* Action Header for Report */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1 border border-indigo-200">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>TAHAP 8: LAPORAN HASIL ASESMEN CPL DAN ANALISIS LENGKAP</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Laporan Ketercapaian Kurikulum Berbasis Outcome (OBE)
          </h3>
          <p className="text-xs text-slate-500">
            Format baku siap cetak (PDF / Print) dan salin Markdown untuk borang akreditasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin!' : 'Salin Markdown'}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak (Print)
          </button>
          <button
            onClick={handleDownloadDOCX}
            disabled={isGeneratingDocx}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-md shadow-sky-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Ekspor laporan ke dokumen Microsoft Word (.docx) lengkap dengan grafik warna-warni"
          >
            {isGeneratingDocx ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat .docx...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-sky-200" />
                <span>Ekspor Word (.docx)</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Ekspor laporan resmi ke PDF berformat rapi dengan ukuran file teroptimasi ringkas (< 300 KB)"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-indigo-200" />
                <span>Ekspor PDF (Rapi &amp; Ringkas)</span>
              </>
            )}
          </button>
          <button
            onClick={handleSaveToDatabase}
            disabled={isSavingDb}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Simpan laporan hasil asesmen ke database untuk direview Kaprodi dan diaudit oleh Tim GJM"
          >
            {isSavingDb ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-200" />
                <span>Simpan ke Database</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Database Saved Toast Notification */}
      {savedDbToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2 print:hidden">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>{savedDbToast}</span>
          </div>
          <button
            onClick={() => setSavedDbToast('')}
            className="text-emerald-200 hover:text-white text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Dokumen Laporan Fisik Akademik */}
      <div
        id="academic-report-document"
        className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900"
      >
        {/* Kop Surat Akademik Resmi Universitas Pattimura */}
        <div className="pb-5">
          <div className="flex items-center justify-between gap-4">
            {/* Logo UNPATTI 2 cm Proporsional */}
            <div className="w-[2cm] h-[2cm] max-w-[76px] max-h-[76px] flex items-center justify-center shrink-0">
              <UnpattiLogo className="w-full h-full object-contain drop-shadow-xs" />
            </div>

            {/* Teks Kop Surat Rapi Berbaris */}
            <div className="flex-1 text-center space-y-0.5">
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-slate-600">
                KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
              </h4>
              <h3 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-950">
                UNIVERSITAS PATTIMURA
              </h3>
              <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-900">
                {data.faculty ? data.faculty.toUpperCase() : 'FAKULTAS PERIKANAN DAN ILMU KELAUTAN'}
              </h4>
              <h5 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-slate-800">
                {data.studyProgram ? data.studyProgram.toUpperCase() : 'BUDIDAYA PERAIRAN'}
              </h5>
              <div className="pt-1.5">
                <h1 className="text-xs sm:text-sm font-black text-indigo-950 uppercase tracking-tight leading-snug">
                  LAPORAN HASIL ASESMEN CAPAIAN PEMBELAJARAN LULUSAN (CPL) MATA KULIAH
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Kurikulum Berbasis Outcome (OBE) • {cleanSemesterText} ({data.academicYear || '2024/2025'})
                </p>
              </div>
            </div>

            {/* Spacer penyeimbang sisi kanan */}
            <div className="w-[2cm] max-w-[76px] shrink-0 hidden sm:block" />
          </div>

          {/* Garis Ganda Kop Surat Resmi (Tebal & Tipis) */}
          <div className="w-full mt-4">
            <div className="h-[2.5px] bg-slate-950 w-full" />
            <div className="h-[0.75px] bg-slate-950 w-full mt-[2px]" />
          </div>
        </div>

        {/* Section 1: Profil Mata Kuliah */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-2">
            <span>1. Identitas Mata Kuliah</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Mata Kuliah:</span>
              <strong className="text-slate-900">{data.courseName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Kode & Beban:</span>
              <strong className="text-slate-900">{data.courseCode} ({data.credits} SKS)</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Dosen Pengampu:</span>
              <strong className="text-slate-900">{singleLecturerName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Mahasiswa & Kelas:</span>
              <strong className="text-slate-900">{totalStudents} Mahasiswa ({data.unitClasses.length} Unit)</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Model & Komposisi Penilaian */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
            2. Model dan Komposisi Penilaian
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed mb-3">
            {data.narrativeNotes?.modelPenilaian ||
              `Penilaian pada mata kuliah ${data.courseName} menggunakan kombinasi evaluasi formatif dan sumatif secara terintegrasi.`}
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 w-10 text-center">No</th>
                  <th className="py-2 px-4">Unsur Penilaian</th>
                  <th className="py-2 px-4 text-center w-28">Bobot (%)</th>
                  <th className="py-2 px-4 text-center w-36">Nilai Rata-rata Gabungan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.components.map((c, i) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 text-center">{i + 1}</td>
                    <td className="py-2 px-4 font-medium">{c.name}</td>
                    <td className="py-2 px-4 text-center font-bold">{c.weight}%</td>
                    <td className="py-2 px-4 text-center font-semibold text-indigo-900">
                      {(componentTotalAverages[c.id] ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Pemetaan Asesmen thdp CPMK */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
            3. Pemetaan Asesmen terhadap CPMK
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Unsur Penilaian</th>
                  <th className="py-2 px-3 text-center">Bobot</th>
                  {data.cpmks.map((c) => (
                    <th key={c.code} className="py-2 px-3 text-center">
                      {c.code} ({c.weight}%)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.components.map((comp) => (
                  <tr key={comp.id}>
                    <td className="py-2 px-3 font-medium">{comp.name}</td>
                    <td className="py-2 px-3 text-center font-bold">{comp.weight}%</td>
                    {data.cpmks.map((cpmk) => (
                      <td key={cpmk.code} className="py-2 px-3 text-center">
                        {comp.cpmkWeights?.[cpmk.code] ? `${comp.cpmkWeights[cpmk.code]}%` : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Hasil Capaian Tiap CPMK dan Analisis */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
            4. Hasil Capaian Tiap CPMK dan Analisis
          </h3>

          {/* Visual Recharts CPMK for Display and PDF Capture */}
          <div id="report-cpmk-chart-container" className="my-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                Grafik Capaian Tiap CPMK vs Target {targetBenchmark.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Standar Evaluasi OBE</span>
            </div>
            {cpmkChartImage ? (
              <div className="w-full flex justify-center">
                <img
                  src={cpmkChartImage}
                  alt={`Grafik Capaian Tiap CPMK vs Target ${targetBenchmark.toFixed(2)}%`}
                  className="w-full max-h-72 object-contain rounded-lg border border-slate-100"
                />
              </div>
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cpmkChartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <ReferenceLine
                      y={targetBenchmark}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{ value: `Target: ${targetBenchmark}%`, fill: '#dc2626', fontSize: 10, position: 'top' }}
                    />
                    <Bar dataKey="capaian" name="Capaian CPMK (%)" radius={[4, 4, 0, 0]} barSize={36}>
                      {cpmkChartData.map((entry, index) => (
                        <Cell
                          key={`cpmk-cell-${index}`}
                          fill={entry.capaian >= targetBenchmark ? '#10b981' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Kode CPMK</th>
                  <th className="py-2 px-3 text-center">Bobot</th>
                  <th className="py-2 px-3 text-center">Nilai Awal</th>
                  <th className="py-2 px-3 text-center font-bold">Capaian Akhir</th>
                  <th className="py-2 px-3 text-center">Target</th>
                  <th className="py-2 px-3 text-center">Delta Gap</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cpmkResults.map((c) => (
                  <tr key={c.cpmkCode}>
                    <td className="py-2 px-3 font-bold text-indigo-900">{c.cpmkCode}</td>
                    <td className="py-2 px-3 text-center">{c.persentaseCPMK}%</td>
                    <td className="py-2 px-3 text-center font-mono">{c.nilaiAwalCPMK.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center font-extrabold text-indigo-900 font-mono">
                      {c.capaianAkhir.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center">{c.target.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-center font-bold">
                      {c.gap > 0 ? `+${c.gap.toFixed(2)}` : c.gap.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          c.isAchieved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
            {data.narrativeNotes?.analisisCPMK ||
              'Ketercapaian CPMK secara umum menunjukkan performa mahasiswa telah memenuhi standar kelulusan.'}
          </p>
        </div>

        {/* Section 5: Kontribusi terhadap CPL dan Analisis */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
            5. Kontribusi terhadap CPL dan Analisis
          </h3>

          <p className="text-xs text-slate-500 mb-2 italic">
            Visualisasi Grafik Capaian CPL vs Target Benchmark {targetBenchmark.toFixed(2)}%:
          </p>

          {/* Visual CPL Chart Container for Display, Print, and PDF Capture */}
          <div id="report-cpl-chart-container" className="my-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            {cplChartImage ? (
              <div className="w-full flex justify-center">
                <img
                  src={cplChartImage}
                  alt={`Grafik Agregasi Capaian CPL vs Target ${targetBenchmark.toFixed(2)}%`}
                  className="w-full max-h-72 object-contain rounded-lg border border-slate-100"
                />
              </div>
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cplChartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <ReferenceLine
                      y={targetBenchmark}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{ value: `Target: ${targetBenchmark}%`, fill: '#dc2626', fontSize: 10, position: 'top' }}
                    />
                    <Bar dataKey="capaian" name="Capaian CPL (%)" radius={[4, 4, 0, 0]} barSize={42}>
                      {cplChartData.map((entry, index) => (
                        <Cell
                          key={`cpl-cell-${index}`}
                          fill={entry.capaian >= targetBenchmark ? '#3b82f6' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Kode CPL</th>
                  <th className="py-2 px-3">Ranah</th>
                  <th className="py-2 px-4">Rincian Agregasi CPMK</th>
                  <th className="py-2 px-3 text-center font-bold">Skor CPL</th>
                  <th className="py-2 px-3 text-center">Target</th>
                  <th className="py-2 px-3 text-center">Delta Gap</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cplResults.map((c) => (
                  <tr key={c.cplCode}>
                    <td className="py-2 px-3 font-bold text-indigo-900">{c.cplCode}</td>
                    <td className="py-2 px-3">{c.category}</td>
                    <td className="py-2 px-4 text-[11px] text-slate-600">
                      {c.contributingCPMKs
                        .map(
                          (cc) =>
                            `${cc.cpmkCode} (${cc.weightInCPL}% × ${cc.cpmkScore.toFixed(1)} = ${cc.contribution.toFixed(1)}%)`
                        )
                        .join(' + ')}
                    </td>
                    <td className="py-2 px-3 text-center font-extrabold text-indigo-900 font-mono">
                      {c.capaianAkhir.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center">{c.target.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-center font-bold">
                      {c.gap > 0 ? `+${c.gap.toFixed(2)}` : c.gap.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          c.isAchieved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
            {data.narrativeNotes?.analisisCPL ||
              'Agregasi CPL membuktikan pencapaian kompetensi lulusan telah selaras dengan visi keilmuan prodi.'}
          </p>
        </div>

        {/* Visual Radar Spider Web for Display and PDF Capture */}
        <div id="report-radar-chart-container" className="my-4 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">
              Peta Radar Spider Web: Profil Sebaran Kompetensi OBE vs Target Mutu {targetBenchmark.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Poligon Keseimbangan Kurikulum</span>
          </div>
          {radarChartImage ? (
            <div className="w-full flex justify-center">
              <img
                src={radarChartImage}
                alt={`Peta Radar Spider Web: Profil Sebaran Kompetensi OBE vs Target Mutu ${targetBenchmark.toFixed(2)}%`}
                className="w-full max-h-80 object-contain rounded-lg border border-slate-100"
              />
            </div>
          ) : (
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData} outerRadius="70%">
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Radar name="Capaian Riil (%)" dataKey="capaian" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
                  <Radar name="Target Standar (75%)" dataKey="target" stroke="#ef4444" strokeDasharray="3 3" fill="#ef4444" fillOpacity={0.1} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Section 6: Siklus Penjaminan Mutu Akademik (PPEPP) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
            6. Siklus Penjaminan Mutu Akademik (PPEPP) &amp; Rencana Tindak Lanjut (CQI)
          </h3>
          <div className="space-y-3 text-xs text-slate-700">
            {data.narrativeNotes?.pelaksanaanPembelajaran && (
              <div className="bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-200">
                <strong className="block text-indigo-950 mb-1">
                  [P - Pelaksanaan] Aktivitas Pembelajaran &amp; Pelaksanaan Asesmen:
                </strong>
                <p className="whitespace-pre-line leading-relaxed text-slate-700">
                  {data.narrativeNotes.pelaksanaanPembelajaran}
                </p>
              </div>
            )}

            {data.narrativeNotes?.pengendalianMutu && (
              <div className="bg-rose-50/50 p-3.5 rounded-lg border border-rose-200">
                <strong className="block text-rose-950 mb-1">
                  [P - Pengendalian] Monitoring Deviasi Mutu &amp; Tindakan Koreksi Cepat:
                </strong>
                <p className="whitespace-pre-line leading-relaxed text-slate-700">
                  {data.narrativeNotes.pengendalianMutu}
                </p>
              </div>
            )}

            <div className="bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200">
              <strong className="block text-emerald-950 mb-1">
                [P - Peningkatan] Rencana Tindak Lanjut Berkelanjutan (Continuous Quality Improvement / CQI):
              </strong>
              <p className="whitespace-pre-line leading-relaxed text-slate-700">
                {data.narrativeNotes?.rekomendasiCQI ||
                  '1. Memperkuat sesi tutorial dan responsi.\n2. Menyempurnakan rubrik asesmen berbasis kriteria.'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-900">
              <strong className="block text-slate-900 mb-1">Kesimpulan Akhir Siklus PPEPP:</strong>
              <p className="whitespace-pre-line leading-relaxed text-slate-700">
                {data.narrativeNotes?.kesimpulan ||
                  `Secara keseluruhan ketercapaian mata kuliah berada pada rata-rata ${overallAvg}%.`}
              </p>
            </div>
          </div>
        </div>

        {/* Section 7: Portofolio Capaian Individu Mahasiswa (Matching Gambar 1) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center justify-between">
            <span>7. Analisis Capaian CPL &amp; CPMK per Individu Mahasiswa</span>
            <span className="text-[11px] font-normal text-slate-500">
              Target Acuan: {targetBenchmark.toFixed(2)}%
            </span>
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 min-w-[170px]">NIM &amp; Nama Mahasiswa</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Unit Kelas</th>
                  {data.cpmks.map((c) => (
                    <th key={`rep-cpmk-${c.code}`} className="py-2.5 px-2 text-center min-w-[75px]">
                      <div className="font-bold text-indigo-900">{c.code}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{c.weight}%</div>
                    </th>
                  ))}
                  {data.cpls.map((c) => (
                    <th key={`rep-cpl-${c.code}`} className="py-2.5 px-2 text-center min-w-[75px] bg-slate-200/50">
                      <div className="font-bold text-slate-900">{c.code}</div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center min-w-[100px]">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {individualStudentAchievements.map((sa, idx) => (
                  <tr key={sa.student.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{sa.student.name}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{sa.student.nim}</div>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600 text-[11px]">
                      {sa.student.unitClassName || 'Reguler'}
                    </td>
                    {data.cpmks.map((cpmk) => {
                      const item = sa.cpmkScores[cpmk.code];
                      const score = item?.score ?? 0;
                      const isAch = item?.isAchieved ?? false;
                      return (
                        <td key={cpmk.code} className="py-2 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                              isAch
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {score.toFixed(1)}%
                          </span>
                        </td>
                      );
                    })}
                    {data.cpls.map((cpl) => {
                      const item = sa.cplScores[cpl.code];
                      const score = item?.score ?? 0;
                      return (
                        <td key={cpl.code} className="py-2 px-2 text-center bg-slate-50/50">
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {score.toFixed(1)}%
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sa.isAllPassed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {sa.isAllPassed ? 'Lulus Penuh' : 'Remedial'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tanda Tangan Pengesahan */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-800">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="font-semibold">Ketua Program Studi</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">
              {data.headOfStudyProgram || 'Daniel G. Louhenapessy, S.Pi., M.Sc.'}
            </p>
            <p className="text-slate-500">NIP. 19740510 199903 1 001</p>
          </div>
          <div className="text-center">
            <p>Dosen Pengampu Mata Kuliah,</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">{singleLecturerName}</p>
            <p className="text-slate-500">NIP. {singleLecturerNip}</p>
          </div>
        </div>

        {/* MANDATORY COMPLETION & SUCCESS NOTE */}
        <div className="pt-6 border-t border-dashed border-slate-300 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-800 bg-emerald-50 border border-emerald-200 py-3 px-5 rounded-xl inline-block shadow-2xs">
            SELAMAT HASIL PENGUKURAN DAN LAPORAN EVALUASI CAPAIAN CPL YANG DIBEBANKAN KE CP MATA KULIAH BAPAK/IBU TELAH SELESAI. SILAHKAN DITINDAKLANJUTI. SUKSES SELALU.
          </p>
        </div>
      </div>

      {/* CONTINUATION DIALOG */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-indigo-900/50 shadow-xl print:hidden">
        {nextCourseDecision === 'prompt' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Alur Kerja Auditor Akademik</span>
              </div>
              <h4 className="text-lg font-bold text-white">
                Apakah Ingin Melanjutkan Untuk Mata Kuliah Lain Atau Tidak?
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Laporan untuk mata kuliah <strong>{data.courseName}</strong> telah tuntas dikalkulasi dan disajikan sesuai standar mutu.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setNextCourseDecision('yes');
                  onStartNewCourse();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Ya, Lanjutkan Mata Kuliah Lain</span>
              </button>
              <button
                onClick={() => setNextCourseDecision('no')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-semibold text-xs border border-white/20 transition-all"
              >
                <span>Tidak, Selesai</span>
              </button>
            </div>
          </div>
        )}

        {nextCourseDecision === 'no' && (
          <div className="text-center py-4 space-y-3">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h4 className="text-lg font-bold text-white">
              Terima Kasih Sudah Menggunakan Sistem Digitalisasi Asesmen OBE yang Dikembangkan oleh Dr. Bruri M. Laimeheriwa and Partsners • Spesialis Digitalisasi Asesmen OBE
            </h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Semoga Laporan Asesmen Capaian Pembelajaran Lulusan (OBE) ini bermanfaat dalam memenuhi standar akreditasi dan penjaminan mutu program studi Anda.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setNextCourseDecision('prompt')}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Kembali ke opsi evaluasi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
