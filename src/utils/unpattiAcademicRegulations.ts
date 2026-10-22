/**
 * PERATURAN REKTOR UNIVERSITAS PATTIMURA NOMOR 12 TAHUN 2026
 * TENTANG PERATURAN AKADEMIK UNIVERSITAS PATTIMURA
 * PASAL 47: Penilaian Hasil Belajar Mahasiswa
 */

import { AssessmentComponent } from '../types/obe';

export interface UnpattiGradeScale {
  huruf: string;
  angka: number;
  kategori: string;
  isLulus: boolean;
  rentang: string;
}

/**
 * Pasal 47 Ayat (4):
 * Bentuk penilaian hasil belajar dinyatakan dalam nilai mutu untuk jenjang
 * DIPLOMA, SARJANA (S1), SARJANA TERAPAN, dan PROFESI.
 */
export function getGradeSarjanaUnpatti2026(score: number): UnpattiGradeScale {
  const rounded = Number(score.toFixed(2));

  if (rounded >= 85.0) {
    return {
      huruf: 'A',
      angka: 4.0,
      kategori: 'Sangat Baik',
      isLulus: true,
      rentang: '85 - 100',
    };
  } else if (rounded >= 70.0) {
    return {
      huruf: 'B',
      angka: 3.0,
      kategori: 'Baik',
      isLulus: true,
      rentang: '70 - 84.99',
    };
  } else if (rounded >= 55.0) {
    return {
      huruf: 'C',
      angka: 2.0,
      kategori: 'Cukup',
      isLulus: true,
      rentang: '55 - 69.99',
    };
  } else if (rounded >= 40.0) {
    return {
      huruf: 'D',
      angka: 1.0,
      kategori: 'Kurang',
      isLulus: false,
      rentang: '40 - 54.99',
    };
  } else {
    return {
      huruf: 'E',
      angka: 0.0,
      kategori: 'Gagal',
      isLulus: false,
      rentang: '0 - 39.99',
    };
  }
}

/**
 * Pasal 47 Ayat (5):
 * Bentuk penilaian hasil belajar dinyatakan dalam nilai mutu untuk jenjang
 * MAGISTER (S2), MAGISTER TERAPAN, SPESIALIS, DOKTOR (S3), DOKTOR TERAPAN, dan SUBSPESIALIS.
 */
export function getGradePascasarjanaUnpatti2026(score: number): UnpattiGradeScale {
  const rounded = Number(score.toFixed(2));

  if (rounded >= 90.0) {
    return {
      huruf: 'A',
      angka: 4.0,
      kategori: 'Sangat Baik',
      isLulus: true,
      rentang: '≥ 90',
    };
  } else if (rounded >= 85.0) {
    return {
      huruf: 'A-',
      angka: 3.7,
      kategori: 'Sangat Baik',
      isLulus: true,
      rentang: '85 - 89.99',
    };
  } else if (rounded >= 80.0) {
    return {
      huruf: 'B+',
      angka: 3.3,
      kategori: 'Baik',
      isLulus: true,
      rentang: '80 - 84.99',
    };
  } else if (rounded >= 70.0) {
    return {
      huruf: 'B',
      angka: 3.0,
      kategori: 'Baik',
      isLulus: true,
      rentang: '70 - 79.99',
    };
  } else if (rounded >= 65.0) {
    return {
      huruf: 'B-',
      angka: 2.7,
      kategori: 'Baik',
      isLulus: true,
      rentang: '65 - 69.99',
    };
  } else if (rounded >= 55.0) {
    return {
      huruf: 'C',
      angka: 2.0,
      kategori: 'Cukup',
      isLulus: true,
      rentang: '55 - 64.99',
    };
  } else {
    return {
      huruf: 'E',
      angka: 0.0,
      kategori: 'Gagal',
      isLulus: false,
      rentang: '< 55',
    };
  }
}

/**
 * General helper to get grade based on academic level
 */
export function getGradeUnpatti2026(
  score: number,
  isPascasarjana: boolean = false
): UnpattiGradeScale {
  return isPascasarjana
    ? getGradePascasarjanaUnpatti2026(score)
    : getGradeSarjanaUnpatti2026(score);
}

/**
 * Pasal 47 Ayat (2) & (3):
 * (2) Komponen penilaian hasil belajar terdiri atas:
 *     partisipasi mahasiswa (Aktivitas Partisipatif), tugas, kuis, praktik,
 *     proyek berbasis tim (Hasil Proyek), metode pemecahan kasus (Case Method), UTS, dan UAS.
 * (3) Pembobotan untuk proyek berbasis tim dan metode pemecahan kasus sekurang-kurangnya 50%.
 *     Komponen kognitif/ujian lainnya (Tugas, Kuis, UTS, UAS) paling banyak 50%.
 */
export interface Pasal47WeightValidation {
  totalWeight: number;
  participativeAndProjectWeight: number; // Case Method & Team-Based Project (Min 50%)
  cognitiveAndExamWeight: number;       // Tugas, Kuis, UTS, UAS (Max 50%)
  isTotal100: boolean;
  isProjectCompliant: boolean;          // >= 50%
  isExamCompliant: boolean;             // <= 50%
  isCompliant: boolean;                 // Both total 100% and project >= 50%
  message: string;
}

export function isCaseOrProjectComponent(compName: string): boolean {
  const lower = compName.toLowerCase();
  return (
    lower.includes('kasus') ||
    lower.includes('case') ||
    lower.includes('proyek') ||
    lower.includes('project') ||
    lower.includes('partisipasi') ||
    lower.includes('partisipatif') ||
    lower.includes('tim') ||
    lower.includes('team') ||
    lower.includes('praktik') ||
    lower.includes('praktikum')
  );
}

export function validatePasal47Weighting(
  components: AssessmentComponent[]
): Pasal47WeightValidation {
  let totalWeight = 0;
  let participativeAndProjectWeight = 0;
  let cognitiveAndExamWeight = 0;

  components.forEach((c) => {
    const w = c.weight || 0;
    totalWeight += w;
    if (isCaseOrProjectComponent(c.name)) {
      participativeAndProjectWeight += w;
    } else {
      cognitiveAndExamWeight += w;
    }
  });

  const isTotal100 = Math.abs(totalWeight - 100) < 0.1;
  const isProjectCompliant = participativeAndProjectWeight >= 50;
  const isExamCompliant = cognitiveAndExamWeight <= 50.1;
  const isCompliant = isTotal100 && isProjectCompliant;

  let message = '';
  if (!isTotal100) {
    message = `Total akumulasi bobot saat ini ${totalWeight}%, wajib tepat 100%.`;
  } else if (!isProjectCompliant) {
    message = `Bobot Metode Pemecahan Kasus & Proyek Berbasis Tim saat ini ${participativeAndProjectWeight}%, sekurang-kurangnya wajib 50% sesuai Pasal 47 Ayat (3).`;
  } else {
    message = `Sesuai penuh dengan Ketentuan Pasal 47 Ayat (3) (Proyek & Kasus ${participativeAndProjectWeight}% ≥ 50%, Total 100%).`;
  }

  return {
    totalWeight,
    participativeAndProjectWeight,
    cognitiveAndExamWeight,
    isTotal100,
    isProjectCompliant,
    isExamCompliant,
    isCompliant,
    message,
  };
}

/**
 * Standard Presets aligned with Peraturan Rektor No. 12 Tahun 2026 Pasal 47
 */
export const UNPATTI_PASAL_47_PRESETS = [
  {
    name: 'Model 1: Rekomendasi Standar OBE Unpatti (Case Method & Team Project)',
    description: 'Metode Kasus 30% + Proyek Tim 25% (Total 55% ≥ 50%), Tugas 15%, Kuis 5%, UTS 10%, UAS 15%',
    components: [
      { id: 'c1', name: 'Metode Pemecahan Kasus (Case Method)', weight: 30, cpmkWeights: {} },
      { id: 'c2', name: 'Proyek Berbasis Tim (Team-Based Project)', weight: 25, cpmkWeights: {} },
      { id: 'c3', name: 'Tugas Terstruktur Mandiri', weight: 15, cpmkWeights: {} },
      { id: 'c4', name: 'Kuis & Aktivitas Partisipatif', weight: 5, cpmkWeights: {} },
      { id: 'c5', name: 'Ujian Tengah Semester (UTS)', weight: 10, cpmkWeights: {} },
      { id: 'c6', name: 'Ujian Akhir Semester (UAS)', weight: 15, cpmkWeights: {} },
    ],
  },
  {
    name: 'Model 2: Berbasis Praktik Laboratorium & Proyek Lapangan',
    description: 'Hasil Proyek & Praktik 35% + Aktivitas Partisipatif 20% (Total 55% ≥ 50%), Tugas 15%, UTS 15%, UAS 15%',
    components: [
      { id: 'c1', name: 'Hasil Proyek & Praktik Lapangan', weight: 35, cpmkWeights: {} },
      { id: 'c2', name: 'Aktivitas Partisipatif & Diskusi Kasus', weight: 20, cpmkWeights: {} },
      { id: 'c3', name: 'Tugas & Analisis Data', weight: 15, cpmkWeights: {} },
      { id: 'c4', name: 'Ujian Tengah Semester (UTS)', weight: 15, cpmkWeights: {} },
      { id: 'c5', name: 'Ujian Akhir Semester (UAS)', weight: 15, cpmkWeights: {} },
    ],
  },
  {
    name: 'Model 3: Pembobotan Proporsional Seimbang (50% Proyek : 50% Evaluasi Kognitif)',
    description: 'Pemecahan Kasus 25% + Proyek 25% (Total 50%), Tugas 10%, Kuis 10%, UTS 15%, UAS 15%',
    components: [
      { id: 'c1', name: 'Metode Pemecahan Kasus (Case Method)', weight: 25, cpmkWeights: {} },
      { id: 'c2', name: 'Proyek Berbasis Tim (Team-Based Project)', weight: 25, cpmkWeights: {} },
      { id: 'c3', name: 'Tugas Terstruktur', weight: 10, cpmkWeights: {} },
      { id: 'c4', name: 'Kuis Berkala', weight: 10, cpmkWeights: {} },
      { id: 'c5', name: 'Ujian Tengah Semester (UTS)', weight: 15, cpmkWeights: {} },
      { id: 'c6', name: 'Ujian Akhir Semester (UAS)', weight: 15, cpmkWeights: {} },
    ],
  },
];
