import * as XLSX from 'xlsx';
import { OBEAssessmentData } from '../types/obe';

export type AssessmentModelChoice = 1 | 2 | 3;

export interface ModelColumnDef {
  name: string;
  weight: number;
}

export interface ModelTemplateDefinition {
  modelNumber: AssessmentModelChoice;
  name: string;
  category: string;
  caseAndProjectWeight: number; // e.g. 55% or 50%
  description: string;
  columns: ModelColumnDef[];
}

export const ASSESSMENT_MODEL_DEFINITIONS: Record<AssessmentModelChoice, ModelTemplateDefinition> = {
  1: {
    modelNumber: 1,
    name: 'Model 1 (55% Kasus / Proyek)',
    category: 'Dominan Case Method & Team-Based Project',
    caseAndProjectWeight: 55,
    description: 'Sesuai Pasal 47: Case Method (30%) + Team-Based Project (25%) = 55% evaluasi proses, ujian teori dibatasi maksimal 25%.',
    columns: [
      { name: 'Metode Pemecahan Kasus (Case Method)', weight: 30 },
      { name: 'Proyek Berbasis Tim (Team-Based Project)', weight: 25 },
      { name: 'Tugas Terstruktur Mandiri', weight: 15 },
      { name: 'Kuis & Aktivitas Partisipatif', weight: 5 },
      { name: 'Ujian Tengah Semester (UTS)', weight: 10 },
      { name: 'Ujian Akhir Semester (UAS)', weight: 15 },
    ],
  },
  2: {
    modelNumber: 2,
    name: 'Model 2 (Praktik / Proyek)',
    category: 'Praktik Lapangan, Laboratorium & Diskusi Kasus',
    caseAndProjectWeight: 55,
    description: 'Sesuai Pasal 47: Hasil Proyek & Praktik Lapangan (35%) + Partisipatif & Diskusi (20%) = 55% evaluasi proses.',
    columns: [
      { name: 'Hasil Proyek & Praktik Lapangan', weight: 35 },
      { name: 'Aktivitas Partisipatif & Diskusi Kasus', weight: 20 },
      { name: 'Tugas & Analisis Data', weight: 15 },
      { name: 'Ujian Tengah Semester (UTS)', weight: 15 },
      { name: 'Ujian Akhir Semester (UAS)', weight: 15 },
    ],
  },
  3: {
    modelNumber: 3,
    name: 'Model 3 (Portofolio Seimbang)',
    category: 'Portofolio Berimbang Kasus, Proyek & Ujian',
    caseAndProjectWeight: 50,
    description: 'Sesuai Pasal 47: Case Method (25%) + Team Project (25%) = 50% evaluasi proses, ujian UTS+UAS tepat 30%.',
    columns: [
      { name: 'Metode Pemecahan Kasus (Case Method)', weight: 25 },
      { name: 'Proyek Berbasis Tim (Team-Based Project)', weight: 25 },
      { name: 'Tugas Terstruktur', weight: 10 },
      { name: 'Kuis Berkala', weight: 10 },
      { name: 'Ujian Tengah Semester (UTS)', weight: 15 },
      { name: 'Ujian Akhir Semester (UAS)', weight: 15 },
    ],
  },
};

/**
 * Utility to generate and download grade templates (.xlsx / .csv)
 * based on selected assessment model (Peraturan Rektor No. 12 Tahun 2026 Pasal 47).
 */
export function downloadGradeTemplateExcel(
  modelChoice: AssessmentModelChoice = 1,
  courseData?: OBEAssessmentData
) {
  const modelDef = ASSESSMENT_MODEL_DEFINITIONS[modelChoice] || ASSESSMENT_MODEL_DEFINITIONS[1];
  const columns = modelDef.columns;

  // Column header row
  const headers = [
    'No',
    'NIM',
    'Nama Mahasiswa',
    'Unit Kelas',
    ...columns.map((c) => `${c.name} (${c.weight}%)`),
  ];

  // Rows with empty cells for template usage (35 numbered empty rows)
  const rows: any[][] = [headers];
  for (let i = 1; i <= 35; i++) {
    const emptyRow: any[] = [i, '', '', '', ...columns.map(() => '')];
    rows.push(emptyRow);
  }

  // Create worksheet from AOA
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability in Excel
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // NIM
    { wch: 32 }, // Nama Mahasiswa
    { wch: 18 }, // Unit Kelas
    ...columns.map(() => ({ wch: 34 })), // Component columns
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const sheetName = `Model_${modelChoice}_Pasal47`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate buffer and trigger download as genuine .xlsx
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Template_Nilai_OBE_Model_${modelChoice}_Pasal47.xlsx`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download template as standard CSV with same blank rows and clear header
 */
export function downloadGradeTemplateCSV(
  modelChoice: AssessmentModelChoice = 1,
  courseData?: OBEAssessmentData
) {
  const modelDef = ASSESSMENT_MODEL_DEFINITIONS[modelChoice] || ASSESSMENT_MODEL_DEFINITIONS[1];
  const columns = modelDef.columns;

  const headers = [
    'No',
    'NIM',
    'Nama Mahasiswa',
    'Unit Kelas',
    ...columns.map((c) => `${c.name} (${c.weight}%)`),
  ];

  const lines: string[] = [];
  lines.push(headers.map(escapeCSVField).join(','));

  // 35 empty rows for lecturer entry
  for (let i = 1; i <= 35; i++) {
    const emptyRow = [String(i), '', '', '', ...columns.map(() => '')];
    lines.push(emptyRow.map(escapeCSVField).join(','));
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Template_Nilai_OBE_Model_${modelChoice}_Pasal47.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export detailed student individual achievements to CSV
 */
export function downloadStudentIndividualAchievementsCSV(
  courseData: OBEAssessmentData,
  achievements: any[]
) {
  const headers = [
    'No',
    'NIM',
    'Nama Mahasiswa',
    'Unit Kelas',
    'Nilai Angka Akhir',
    'Grade Huruf',
    'Indeks Angka',
    'Predikat Kategori',
    'Kehadiran (%)',
    'Status Kelulusan',
    ...courseData.cpmks.map((c) => `Capaian ${c.code} (%)`),
    ...courseData.cpls.map((c) => `Capaian ${c.code} (%)`),
  ];

  const lines: string[] = [];
  lines.push(headers.map(escapeCSVField).join(','));

  achievements.forEach((ach, index) => {
    const student = ach.student || {};
    const cpmkVals = courseData.cpmks.map((c) => {
      const scoreObj = ach.cpmkScores?.[c.code];
      return scoreObj ? scoreObj.score.toFixed(1) : '-';
    });
    const cplVals = courseData.cpls.map((c) => {
      const scoreObj = ach.cplScores?.[c.code];
      return scoreObj ? scoreObj.score.toFixed(1) : '-';
    });

    const row = [
      String(index + 1),
      student.nim || '',
      student.name || '',
      student.unitClassName || student.unitClassId || '',
      ach.finalNumericScore !== undefined ? ach.finalNumericScore.toFixed(2) : '',
      ach.gradeHuruf || '',
      ach.gradeAngka !== undefined ? ach.gradeAngka.toFixed(2) : '',
      ach.gradeKategori || '',
      student.attendancePercent !== undefined ? `${student.attendancePercent}%` : '100%',
      ach.isAllPassed ? 'Lulus CPL' : 'Belum Lulus CPL',
      ...cpmkVals,
      ...cplVals,
    ];
    lines.push(row.map(escapeCSVField).join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanCode = (courseData.courseCode || 'MK').replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute(
    'download',
    `Rekap_Nilai_OBE_Individu_${cleanCode}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

