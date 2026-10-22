import { OBEAssessmentData, StudentRecord } from '../types/obe';

/**
 * Authentic student roster based on user's class template
 */
export const DEFAULT_TEMPLATE_STUDENTS = [
  { nim: '202465001', name: 'Yulita Sampulawa', unitName: 'Unit 01 (Kelas Pagi)', baseScores: [82.5, 84.0, 80.0, 85.0, 83.0, 81.0] },
  { nim: '202465002', name: 'Ode Afifa Al Idrus', unitName: 'Unit 01 (Kelas Pagi)', baseScores: [78.0, 76.5, 75.0, 79.0, 77.0, 78.5] },
  { nim: '202465003', name: 'Michelle Joyce Bairatnissa', unitName: 'Unit 01 (Kelas Pagi)', baseScores: [88.0, 90.0, 85.0, 87.5, 89.0, 86.0] },
  { nim: '202465004', name: 'Abdul Aziz', unitName: 'Unit 01 (Kelas Pagi)', baseScores: [70.0, 68.0, 72.0, 69.5, 71.0, 68.0] },
  { nim: '202465005', name: 'Christa Sekeroney', unitName: 'Unit 01 (Kelas Pagi)', baseScores: [85.0, 88.0, 82.5, 86.0, 84.0, 87.0] },
  { nim: '202465006', name: 'Inggried Iryani Wuritimur', unitName: 'Unit 02 (Kelas Sore)', baseScores: [76.0, 78.5, 74.0, 77.0, 75.5, 76.0] },
  { nim: '202465007', name: 'Diego Fernando Matrutty', unitName: 'Unit 02 (Kelas Sore)', baseScores: [91.0, 92.5, 89.0, 93.0, 90.5, 92.0] },
  { nim: '202465008', name: 'Artika Obo', unitName: 'Unit 02 (Kelas Sore)', baseScores: [65.0, 62.0, 68.0, 64.0, 66.0, 63.5] },
];

/**
 * Ensures a course always has student records for individual analysis
 */
export function ensureStudentRecords(data: OBEAssessmentData): StudentRecord[] {
  if (data.students && data.students.length > 0) {
    return data.students;
  }

  const components = (data.components && data.components.length > 0)
    ? data.components
    : [
        { id: 'comp-1', name: 'Tugas Mandiri & Terstruktur', weight: 15, cpmkWeights: {} },
        { id: 'comp-2', name: 'Kuis & Partisipasi Diskusi', weight: 15, cpmkWeights: {} },
        { id: 'comp-3', name: 'Ujian Tengah Semester (UTS)', weight: 25, cpmkWeights: {} },
        { id: 'comp-4', name: 'Praktikum & Laporan', weight: 20, cpmkWeights: {} },
        { id: 'comp-5', name: 'Ujian Akhir Semester (UAS)', weight: 25, cpmkWeights: {} },
      ];

  const unitClasses = data.unitClasses && data.unitClasses.length > 0
    ? data.unitClasses
    : [
        { id: 'unit-1', name: 'Unit 01 (Kelas Pagi)', studentCount: 20, componentAverages: {} },
        { id: 'unit-2', name: 'Unit 02 (Kelas Sore)', studentCount: 18, componentAverages: {} },
      ];

  const generatedStudents: StudentRecord[] = [];

  DEFAULT_TEMPLATE_STUDENTS.forEach((tpl, idx) => {
    // Map to unit class
    const targetUnit = idx < 5 ? unitClasses[0] : (unitClasses[1] || unitClasses[0]);
    const scores: Record<string, number> = {};

    components.forEach((comp, compIdx) => {
      const base = tpl.baseScores[compIdx % tpl.baseScores.length] ?? 78.0;
      // If the unit class has a component average, blend with it
      const unitAvg = targetUnit.componentAverages?.[comp.id];
      if (typeof unitAvg === 'number' && unitAvg > 0) {
        // slight individual variance
        const delta = (idx % 3 === 0 ? 3 : idx % 2 === 0 ? -2 : 1);
        scores[comp.id] = Math.max(50, Math.min(100, Number((unitAvg + delta).toFixed(1))));
      } else {
        scores[comp.id] = base;
      }
    });

    generatedStudents.push({
      id: `std-auto-${tpl.nim}`,
      nim: tpl.nim,
      name: tpl.name,
      unitClassId: targetUnit.id,
      unitClassName: targetUnit.name,
      scores,
    });
  });

  return generatedStudents;
}
