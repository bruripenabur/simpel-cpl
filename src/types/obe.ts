export interface CPLItem {
  id: string;
  code: string; // e.g. "CPL-01"
  description: string;
  category: 'Sikap' | 'Pengetahuan' | 'Keterampilan Umum' | 'Keterampilan Khusus';
  target: number; // default 75.00
}

export interface CPMKMappingToCPL {
  cplCode: string;
  weightInCPL: number; // percentage contribution to this CPL (e.g. 50%)
}

export interface CPMKItem {
  id: string;
  code: string; // e.g. "CPMK-1"
  description: string;
  weight: number; // bobot persentase total terhadap MK (e.g. 25%)
  cplMappings: CPMKMappingToCPL[];
}

export interface AssessmentComponent {
  id: string;
  name: string; // e.g. "Tugas & Kuis", "Praktikum / Proyek", "UTS", "UAS"
  weight: number; // persentase total (e.g. 20%)
  cpmkWeights: Record<string, number>; // component contribution to CPMKs, e.g. { "CPMK-1": 10, "CPMK-2": 10 }
}

export interface UnitClass {
  id: string;
  name: string; // e.g. "Unit 01 (Kelas Pagi)", "Unit 02 (Kelas Sore)"
  studentCount: number;
  componentAverages: Record<string, number>; // componentId -> score (0-100)
}

export interface StudentRecord {
  id: string;
  nim: string;
  name: string;
  unitClassId: string;
  unitClassName?: string;
  scores: Record<string, number>; // componentId -> score
  remedialScores?: Record<string, number>; // componentId -> remedial score
  isRemedialApplied?: boolean;
  statusTL?: Record<string, boolean>; // componentId -> true if Tidak Lengkap (Pasal 51)
  attendancePercent?: number; // Persentase kehadiran kuliah (Pasal 51 min 75%)
}

export interface StudentOBEAchievement {
  student: StudentRecord;
  cpmkScores: Record<string, { score: number; isAchieved: boolean; gap: number }>;
  cplScores: Record<string, { score: number; isAchieved: boolean; gap: number }>;
  averageCPMK: number;
  averageCPL: number;
  cpmkPassCount: number;
  cplPassCount: number;
  isAllPassed: boolean;
  // Peraturan Rektor Universitas Pattimura No. 12 Tahun 2026 Pasal 47 & 52
  finalNumericScore?: number;
  gradeHuruf?: string; // e.g. "A", "B", "C", "D", "E"
  gradeAngka?: number; // e.g. 4.00, 3.00, 2.00, 1.00, 0.00
  gradeKategori?: string; // e.g. "Sangat Baik", "Baik", "Cukup", "Kurang", "Gagal"
  isRemedialEligible?: boolean; // True jika nilai < B (Pasal 52 Ayat 1)
  remedialGradeHuruf?: string; // Maksimal B (Pasal 52 Ayat 2)
  remedialGradeAngka?: number;
  remedialScore?: number;
  isAttendanceEligible?: boolean; // True jika kehadiran >= 75% (Pasal 51 Ayat 3)
}

export interface OBEAssessmentData {
  courseCode: string;
  courseName: string;
  credits: number;
  semester: string;
  academicYear: string;
  studyProgram: string;
  faculty: string;
  prodiId?: string; // Multi-tenant Study Program Identifier (e.g. '54201', '54242', '54231')
  facultyId?: string; // Multi-tenant Faculty Identifier
  academicLevel?: 'sarjana' | 'pascasarjana'; // Peraturan Rektor No 12/2026 Pasal 47 Ayat 4 vs Ayat 5
  lecturerName: string;
  lecturerNip?: string;
  headOfStudyProgram?: string;
  targetBenchmark: number; // Default 75.00
  cpls: CPLItem[];
  cpmks: CPMKItem[];
  components: AssessmentComponent[];
  unitClasses: UnitClass[];
  students?: StudentRecord[];
  narrativeNotes?: {
    modelPenilaian?: string; // [P - Perencanaan]
    pelaksanaanPembelajaran?: string; // [P - Pelaksanaan]
    analisisCPMK?: string; // [E - Evaluasi CPMK]
    analisisCPL?: string; // [E - Evaluasi CPL]
    pengendalianMutu?: string; // [P - Pengendalian]
    rekomendasiCQI?: string; // [P - Peningkatan CQI]
    kesimpulan?: string; // Kesimpulan Penutup PPEPP
  };
  auditLogs?: CourseAuditLog[];
}

export interface CPMKCalculationResult {
  cpmkCode: string;
  description: string;
  persentaseCPMK: number;
  nilaiAwalCPMK: number;
  capaianAkhir: number; // (nilai awal CPMK * 100) / persentaseCPMK
  target: number;
  gap: number;
  isAchieved: boolean;
  componentContributions: Array<{
    componentId: string;
    componentName: string;
    componentAvg: number;
    weightAllocated: number;
    contribution: number;
  }>;
}

export interface CPLCalculationResult {
  cplCode: string;
  description: string;
  category: string;
  capaianAkhir: number;
  target: number;
  gap: number;
  isAchieved: boolean;
  contributingCPMKs: Array<{
    cpmkCode: string;
    weightInCPL: number;
    cpmkScore: number;
    contribution: number;
  }>;
}

export interface AssessmentReportSummary {
  overallAverage: number;
  cpmkPassRate: number; // percentage of CPMKs achieving >= target
  cplPassRate: number; // percentage of CPLs achieving >= target
  totalStudents: number;
  highestCPMK: { code: string; score: number };
  lowestCPMK: { code: string; score: number };
  highestCPL: { code: string; score: number };
  lowestCPL: { code: string; score: number };
}

export type StageAuditStatus = 'compliant' | 'minor_finding' | 'major_finding' | 'not_reviewed';

export interface StageAuditItem {
  stageNumber: number;
  stageName: string;
  status: StageAuditStatus;
  comment: string;
  evaluatedAt?: string;
  auditorName?: string;
}

export interface CourseAuditLog {
  id?: string;
  courseCode: string;
  courseName: string;
  studyProgram: string;
  prodiId?: string;
  facultyId?: string;
  academicYear: string;
  auditorName: string;
  auditorNip: string;
  auditedAt: string;
  overallConclusion: 'SANGAT_BAIK' | 'BAIK_DENGAN_CATATAN' | 'PERLU_PERBAIKAN';
  overallNotes: string;
  stageLogs: Record<number, StageAuditItem>;
}
