import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  OBEAssessmentData,
  CPMKCalculationResult,
  CPLCalculationResult,
} from '../types/obe';
import { getUnpattiLogoDataUrl } from './unpattiLogo';
import { getSingleLecturerName, getSingleLecturerNip } from './lecturerHelper';
import {
  generateCPMKBarChartImage,
  generateCPLBarChartImage,
  generateRadarSpiderWebChartImage,
} from './chartRenderer';
import { calculateStudentIndividualAchievements } from './calculator';

export interface PDFChartImages {
  cpmkChart?: string;
  cplChart?: string;
  radarChart?: string;
}

export function exportOBEAssessmentToPDF(
  data: OBEAssessmentData,
  cpmkResults: CPMKCalculationResult[],
  cplResults: CPLCalculationResult[],
  componentTotalAverages: Record<string, number>,
  targetBenchmark: number = 75.0,
  chartImages?: PDFChartImages
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let currentY = 14;

  const totalStudents = data.unitClasses.reduce(
    (sum, u) => sum + (u.studentCount || 0),
    0
  );

  const singleLecturer = getSingleLecturerName(data.lecturerName);
  const singleNip = getSingleLecturerNip(data.lecturerNip);

  // Helper to ensure enough space on page, avoiding content truncation
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 16;
      return true;
    }
    return false;
  };

  // Helper for adding section titles (Exact match with preview)
  const addSectionTitle = (title: string, neededHeightAfter: number = 30) => {
    ensureSpace(neededHeightAfter);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, margin, currentY);
    currentY += 1.8;

    // Bottom subtle border line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.35);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;
  };

  // Helper for rendering a colored narrative card (matching preview and strict containment)
  const renderCardBox = (
    title: string,
    content: string,
    bgRgb: [number, number, number],
    borderRgb: [number, number, number],
    titleRgb: [number, number, number],
    textRgb: [number, number, number] = [51, 65, 85]
  ) => {
    if (!content || !content.trim()) return;

    // Sanitize Unicode characters that might cause font width errors in standard jsPDF Helvetica
    const cleanTitle = title
      .replace(/[≥]/g, '>= ')
      .replace(/[≤]/g, '<= ')
      .replace(/[–—]/g, '-')
      .replace(/[•]/g, '*');
    const cleanContent = content
      .replace(/[≥]/g, '>= ')
      .replace(/[≤]/g, '<= ')
      .replace(/[–—]/g, '-')
      .replace(/[•]/g, '*');

    // Safe padding: 6.5 mm on left, 8.5 mm on right to strictly prevent any border overflow
    const leftTextOffset = 6.5;
    const maxTextWidth = contentWidth - 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const splitTitle = doc.splitTextToSize(cleanTitle, maxTextWidth);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitContent = doc.splitTextToSize(cleanContent, maxTextWidth);

    const titleLineH = 3.9;
    const contentLineH = 3.6;
    const boxHeight =
      splitTitle.length * titleLineH + 2.0 + splitContent.length * contentLineH + 7.0;

    ensureSpace(boxHeight + 5);

    // 1. Card background & border
    doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'FD');

    // 2. Left colored accent stripe (2.5mm)
    doc.setFillColor(titleRgb[0], titleRgb[1], titleRgb[2]);
    doc.roundedRect(margin, currentY, 2.5, boxHeight, 1, 1, 'F');

    // 3. Render title lines with exact vertical positioning
    let curY = currentY + 4.8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(titleRgb[0], titleRgb[1], titleRgb[2]);
    splitTitle.forEach((line: string) => {
      doc.text(line, margin + leftTextOffset, curY);
      curY += titleLineH;
    });

    curY += 1.0;

    // 4. Render content lines with exact vertical positioning
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    splitContent.forEach((line: string) => {
      doc.text(line, margin + leftTextOffset, curY);
      curY += contentLineH;
    });

    currentY += boxHeight + 4.5;
  };

  // ==========================================
  // 1. KOP SURAT AKADEMIK RESMI UNIVERSITAS PATTIMURA
  // ==========================================
  const logoWidth = 20; // 2 cm proporsional
  const logoHeight = 20; // 2 cm proporsional
  const logoY = currentY;

  const unpattiLogoDataUrl = getUnpattiLogoDataUrl(300, 300);
  if (unpattiLogoDataUrl) {
    try {
      doc.addImage(unpattiLogoDataUrl, 'PNG', margin, logoY, logoWidth, logoHeight, undefined, 'FAST');
    } catch (e) {
      console.warn('Gagal menambahkan logo Unpatti ke PDF:', e);
    }
  }

  // Teks Lembaga / Institusi berbaris rapi di sebelah kanan logo
  const institutionCenterX = (margin + logoWidth + (pageWidth - margin)) / 2; // Center of available header area

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI',
    institutionCenterX,
    currentY + 1,
    { align: 'center' }
  );
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42); // slate-950
  doc.text('UNIVERSITAS PATTIMURA', institutionCenterX, currentY + 1, { align: 'center' });
  currentY += 5;

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // slate-900
  doc.text(
    (data.faculty || 'FAKULTAS PERIKANAN DAN ILMU KELAUTAN').toUpperCase(),
    institutionCenterX,
    currentY + 0.5,
    { align: 'center' }
  );
  currentY += 4.5;

  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    (data.studyProgram || 'BUDIDAYA PERAIRAN').toUpperCase(),
    institutionCenterX,
    currentY + 0.5,
    { align: 'center' }
  );

  // Posisikan judul laporan di bawah logo agar tidak bertabrakan / tumpang tindih
  currentY = Math.max(currentY + 5.5, logoY + logoHeight + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75); // dark navy (#1E1B4B)
  doc.text(
    'LAPORAN HASIL ASESMEN CAPAIAN PEMBELAJARAN LULUSAN (CPL) MATA KULIAH',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 4.2;

  const rawSem = (data.semester || '1').trim();
  const cleanSem = rawSem.replace(/^semester\s+semester\s+/i, 'Semester ');
  const semesterLabel = cleanSem.toLowerCase().startsWith('semester') ? cleanSem : `Semester ${cleanSem}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `Kurikulum Berbasis Outcome (OBE) • ${semesterLabel} (${data.academicYear || '2024/2025'})`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 3.5;

  // Garis Ganda Kop Surat Resmi (Tebal 2.5px & Tipis 0.8px)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 0.9;
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 7;

  // ==========================================
  // SECTION 1: IDENTITAS MATA KULIAH (Struktur Terstandar)
  // ==========================================
  addSectionTitle('1. IDENTITAS MATA KULIAH', 28);

  const identityRows = [
    [
      { content: 'Mata Kuliah', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
      { content: data.courseName || '-', styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
      { content: 'Kode & SKS', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
      { content: `${data.courseCode} • ${data.credits} SKS`, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Dosen Pengampu', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
      { content: `${singleLecturer}\nNIP. ${singleNip}`, styles: { textColor: [15, 23, 42] } },
      { content: 'Program Studi', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
      { content: `${data.studyProgram || 'Budidaya Perairan'}\n${data.faculty || 'Fakultas Perikanan dan Ilmu Kelautan'}`, styles: { textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Semester / T.A.', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
      { content: `${semesterLabel} (${data.academicYear || '2024/2025'})`, styles: { textColor: [15, 23, 42] } },
      { content: 'Peserta & Standar', styles: { fontStyle: 'bold', textColor: [71, 85, 105], fillColor: [248, 250, 252] } },
      { content: `${totalStudents} Mahasiswa (${data.unitClasses.length} Unit Kelas)\nTarget Acuan: ${targetBenchmark.toFixed(2)}%`, styles: { textColor: [15, 23, 42] } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 59 },
      2: { cellWidth: 32 },
      3: { cellWidth: 59 },
    },
    body: identityRows as any,
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================
  // SECTION 2: MODEL DAN KOMPOSISI PENILAIAN
  // ==========================================
  addSectionTitle('2. MODEL DAN KOMPOSISI PENILAIAN', 35);

  if (data.narrativeNotes?.modelPenilaian) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitNarrative = doc.splitTextToSize(
      data.narrativeNotes.modelPenilaian,
      contentWidth
    );
    doc.text(splitNarrative, margin, currentY);
    currentY += splitNarrative.length * 3.6 + 3.5;
  }

  const componentRows = data.components.map((c, i) => [
    (i + 1).toString(),
    c.name,
    `${c.weight}%`,
    (componentTotalAverages[c.id] ?? 0).toFixed(2),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100 (#F1F5F9)
      textColor: [51, 65, 85],   // slate-700
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240], // slate-200 border
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 92, fontStyle: 'bold' },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 32 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 'auto', textColor: [67, 56, 202] }, // bold indigo (#4338CA)
    },
    head: [['No', 'Unsur Penilaian', 'Bobot (%)', 'Nilai Rata-rata Gabungan']],
    body: componentRows,
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================
  // SECTION 3: PEMETAAN ASESMEN THDP CPMK
  // ==========================================
  addSectionTitle('3. PEMETAAN ASESMEN TERHADAP CPMK', 35);

  const cpmkHeaderCols = data.cpmks.map((c) => `${c.code}\n(${c.weight}%)`);
  const cpmkHeadRow = ['Unsur Penilaian', 'Bobot (%)', ...cpmkHeaderCols];

  const cpmkMappingRows = data.components.map((comp) => {
    const row = [comp.name, `${comp.weight}%`];
    data.cpmks.forEach((cpmk) => {
      const w = comp.cpmkWeights?.[cpmk.code];
      row.push(w ? `${w}%` : '-');
    });
    return row;
  });

  const cpmkColWidth = Number(((contentWidth - 72) / Math.max(1, data.cpmks.length)).toFixed(2));
  const mappingColStyles: any = {
    0: { cellWidth: 52, fontStyle: 'bold' },
    1: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
  };
  data.cpmks.forEach((_, idx) => {
    mappingColStyles[idx + 2] = { halign: 'center', cellWidth: cpmkColWidth };
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
    },
    columnStyles: mappingColStyles,
    head: [cpmkHeadRow],
    body: cpmkMappingRows,
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================
  // SECTION 4: HASIL CAPAIAN TIAP CPMK DAN ANALISIS
  // ==========================================
  addSectionTitle('4. HASIL CAPAIAN TIAP CPMK DAN ANALISIS', 40);

  // Insert CPMK Chart Image
  const cpmkImgDataUrl =
    chartImages?.cpmkChart || generateCPMKBarChartImage(cpmkResults, targetBenchmark);
  if (cpmkImgDataUrl) {
    const chartHeight = 65;
    ensureSpace(chartHeight + 16);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Visualisasi Grafik Capaian Tiap CPMK vs Target Benchmark ${targetBenchmark.toFixed(2)}%:`,
      margin,
      currentY
    );
    currentY += 4;
    try {
      const cpmkFmt = cpmkImgDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(cpmkImgDataUrl, cpmkFmt, margin, currentY, contentWidth, chartHeight, undefined, 'FAST');
      currentY += chartHeight + 5;
    } catch (e) {
      console.warn('Gagal menyematkan gambar grafik CPMK:', e);
    }
  }

  const cpmkTableRows = cpmkResults.map((c) => [
    c.cpmkCode,
    `${c.persentaseCPMK}%`,
    c.nilaiAwalCPMK.toFixed(2),
    `${c.capaianAkhir.toFixed(2)}%`,
    `${c.target.toFixed(2)}%`,
    `${c.gap > 0 ? '+' : ''}${c.gap.toFixed(2)}%`,
    c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI',
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 22, textColor: [49, 46, 129] },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 24, textColor: [49, 46, 129] },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 58 },
    },
    head: [
      [
        'Kode CPMK',
        'Bobot (%)',
        'Nilai Awal',
        'Capaian Akhir',
        'Target Acuan',
        'Delta Gap',
        'Status Ketercapaian',
      ],
    ],
    body: cpmkTableRows,
    didParseCell: (dataCell) => {
      if (dataCell.section === 'body' && dataCell.column.index === 6) {
        if (dataCell.cell.raw === 'TERCAPAI') {
          dataCell.cell.styles.textColor = [5, 150, 105];
        } else {
          dataCell.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  if (data.narrativeNotes?.analisisCPMK) {
    renderCardBox(
      'Analisis Kinerja Capaian CPMK:',
      data.narrativeNotes.analisisCPMK,
      [248, 250, 252],
      [226, 232, 240],
      [15, 23, 42]
    );
  }

  // ==========================================
  // SECTION 5: KONTRIBUSI TERHADAP CPL DAN ANALISIS
  // ==========================================
  addSectionTitle('5. KONTRIBUSI TERHADAP CPL DAN ANALISIS', 40);

  // Insert CPL Chart image (always generated)
  const cplImgDataUrl =
    chartImages?.cplChart || generateCPLBarChartImage(cplResults, targetBenchmark);
  if (cplImgDataUrl) {
    const chartHeight = 65;
    ensureSpace(chartHeight + 16);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Visualisasi Grafik Capaian CPL vs Target Benchmark ${targetBenchmark.toFixed(2)}%:`,
      margin,
      currentY
    );
    currentY += 4;
    try {
      const cplFmt = cplImgDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(cplImgDataUrl, cplFmt, margin, currentY, contentWidth, chartHeight, undefined, 'FAST');
      currentY += chartHeight + 5;
    } catch (e) {
      console.warn('Gagal menyematkan gambar grafik CPL:', e);
    }
  }

  const cplTableRows = cplResults.map((c) => {
    const rincianCPMK = c.contributingCPMKs
      .map(
        (cc) =>
          `${cc.cpmkCode} (${cc.weightInCPL}% × ${cc.cpmkScore.toFixed(1)} = ${cc.contribution.toFixed(1)}%)`
      )
      .join(' + ');
    return [
      c.cplCode,
      c.category,
      rincianCPMK,
      `${c.capaianAkhir.toFixed(2)}%`,
      `${c.target.toFixed(2)}%`,
      `${c.gap > 0 ? '+' : ''}${c.gap.toFixed(2)}%`,
      c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 18, textColor: [49, 46, 129] },
      1: { cellWidth: 22 },
      2: { cellWidth: 54 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 20, textColor: [49, 46, 129] },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 32 },
    },
    head: [
      [
        'Kode CPL',
        'Ranah',
        'Rincian Agregasi CPMK Penyusun',
        'Skor CPL',
        'Target',
        'Delta Gap',
        'Status Mutu',
      ],
    ],
    body: cplTableRows,
    didParseCell: (dataCell) => {
      if (dataCell.section === 'body' && dataCell.column.index === 6) {
        if (dataCell.cell.raw === 'TERCAPAI') {
          dataCell.cell.styles.textColor = [5, 150, 105];
        } else {
          dataCell.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  if (data.narrativeNotes?.analisisCPL) {
    renderCardBox(
      'Analisis Dampak terhadap Profil Lulusan (CPL):',
      data.narrativeNotes.analisisCPL,
      [248, 250, 252],
      [226, 232, 240],
      [15, 23, 42]
    );
  }

  // Insert Radar Chart if available
  const radarImgDataUrl =
    chartImages?.radarChart ||
    generateRadarSpiderWebChartImage(cpmkResults, cplResults, targetBenchmark);
  if (radarImgDataUrl) {
    const radarWidth = 115;
    const radarHeight = 76;
    ensureSpace(radarHeight + 16);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Peta Radar Spider Web: Profil Sebaran Kompetensi OBE vs Target Mutu:',
      margin,
      currentY
    );
    currentY += 4;
    try {
      const radarX = (pageWidth - radarWidth) / 2;
      const radarFmt = radarImgDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(radarImgDataUrl, radarFmt, radarX, currentY, radarWidth, radarHeight, undefined, 'FAST');
      currentY += radarHeight + 6;
    } catch (e) {
      console.warn('Gagal menyematkan gambar grafik Radar:', e);
    }
  }

  // ==========================================
  // SECTION 6: SIKLUS PENJAMINAN MUTU AKADEMIK (PPEPP)
  // ==========================================
  addSectionTitle('6. SIKLUS PENJAMINAN MUTU AKADEMIK (PPEPP)', 35);

  // 1. [P - Perencanaan]
  if (data.narrativeNotes?.modelPenilaian) {
    renderCardBox(
      '[P - Perencanaan] Model & Komposisi Penilaian:',
      data.narrativeNotes.modelPenilaian,
      [239, 246, 255], // blue-50
      [191, 219, 254], // blue-200
      [30, 58, 138] // blue-900
    );
  }

  // 2. [P - Pelaksanaan]
  if (data.narrativeNotes?.pelaksanaanPembelajaran) {
    renderCardBox(
      '[P - Pelaksanaan] Aktivitas Pembelajaran & Asesmen Terstruktur:',
      data.narrativeNotes.pelaksanaanPembelajaran,
      [250, 245, 255], // purple-50
      [233, 213, 255], // purple-200
      [88, 28, 135] // purple-900
    );
  }

  // 3. [E - Evaluasi CPMK & CPL]
  const evaluasiSummary = `1. Evaluasi CPMK: ${
    data.narrativeNotes?.analisisCPMK || 'Telah memenuhi standar kelulusan.'
  }\n2. Evaluasi CPL: ${
    data.narrativeNotes?.analisisCPL || 'Kontribusi mata kuliah selaras dengan profil lulusan.'
  }`;
  renderCardBox(
    '[E - Evaluasi CPMK & CPL] Analisis Ketercapaian Hasil Belajar:',
    evaluasiSummary,
    [255, 251, 235], // amber-50
    [253, 230, 138], // amber-200
    [120, 53, 15] // amber-900
  );

  // 4. [P - Pengendalian]
  if (data.narrativeNotes?.pengendalianMutu) {
    renderCardBox(
      '[P - Pengendalian] Monitoring Deviasi Mutu & Tindakan Koreksi Cepat:',
      data.narrativeNotes.pengendalianMutu,
      [255, 241, 242], // rose-50
      [254, 205, 211], // rose-200
      [136, 19, 55] // rose-900
    );
  }

  // 5. [P - Peningkatan]
  renderCardBox(
    '[P - Peningkatan] Rencana Tindak Lanjut Berkelanjutan (Continuous Quality Improvement / CQI):',
    data.narrativeNotes?.rekomendasiCQI ||
      '1. Memperkuat sesi tutorial dan responsi.\n2. Menyempurnakan rubrik asesmen berbasis kriteria.',
    [236, 253, 245], // emerald-50
    [167, 243, 208], // emerald-200
    [6, 78, 59] // emerald-900
  );

  // 6. Kesimpulan Akhir
  const overallAvg = (
    cpmkResults.reduce((acc, c) => acc + c.capaianAkhir, 0) / Math.max(1, cpmkResults.length)
  ).toFixed(2);
  renderCardBox(
    'Kesimpulan Akhir Siklus PPEPP:',
    data.narrativeNotes?.kesimpulan ||
      `Secara keseluruhan ketercapaian mata kuliah berada pada rata-rata ${overallAvg}%.`,
    [248, 250, 252],
    [226, 232, 240],
    [15, 23, 42]
  );

  // ==========================================
  // SECTION 7: PORTOFOLIO CAPAIAN INDIVIDU MAHASISWA (Matching Gambar 1)
  // ==========================================
  const studentAchievements = calculateStudentIndividualAchievements(data);
  if (studentAchievements && studentAchievements.length > 0) {
    addSectionTitle('7. ANALISIS CAPAIAN CPL & CPMK PER INDIVIDU MAHASISWA', 40);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Evaluasi Ketercapaian Riil Mahasiswa Berdasarkan Standar Acuan Target ${targetBenchmark.toFixed(2)}%:`,
      margin,
      currentY
    );
    currentY += 4;

    const stdHeaders = [
      'No',
      'NIM & Nama Mahasiswa',
      'Unit Kelas',
      ...data.cpmks.map((c) => `${c.code}\n(${c.weight}%)`),
      ...data.cpls.map((c) => c.code),
      'Status Evaluasi',
    ];

    const stdRows = studentAchievements.map((sa, idx) => {
      const cpmkCols = data.cpmks.map((c) => {
        const item = sa.cpmkScores[c.code];
        return item ? `${item.score.toFixed(1)}%` : '0.0%';
      });

      const cplCols = data.cpls.map((c) => {
        const item = sa.cplScores[c.code];
        return item ? `${item.score.toFixed(1)}%` : '0.0%';
      });

      return [
        String(idx + 1),
        `${sa.student.name}\n${sa.student.nim}`,
        sa.student.unitClassName || 'Reguler',
        ...cpmkCols,
        ...cplCols,
        sa.isAllPassed ? 'LULUS' : 'REMEDIAL',
      ];
    });

    // DYNAMIC & RESPONSIVE COLUMN WIDTHS:
    // Calculates exact widths so table never overflows or gets cut off (contentWidth = 182mm)
    const totalScoreCols = data.cpmks.length + data.cpls.length;
    const noWidth = 7;
    const nameWidth = totalScoreCols > 7 ? 35 : 40;
    const unitWidth = totalScoreCols > 7 ? 20 : 24;
    const statusWidth = totalScoreCols > 7 ? 16 : 18;
    const fixedWidth = noWidth + nameWidth + unitWidth + statusWidth;
    const remainingForScores = contentWidth - fixedWidth;
    const colScoreWidth = Number(
      (remainingForScores / Math.max(1, totalScoreCols)).toFixed(2)
    );

    const stdColStyles: Record<number, any> = {
      0: { halign: 'center', cellWidth: noWidth },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: nameWidth },
      2: { halign: 'center', cellWidth: unitWidth },
    };

    let colIdx = 3;
    data.cpmks.forEach(() => {
      stdColStyles[colIdx] = { halign: 'center', fontStyle: 'bold', cellWidth: colScoreWidth };
      colIdx++;
    });
    data.cpls.forEach(() => {
      stdColStyles[colIdx] = {
        halign: 'center',
        cellWidth: colScoreWidth,
        fillColor: [248, 250, 252],
      };
      colIdx++;
    });
    stdColStyles[colIdx] = { halign: 'center', fontStyle: 'bold', cellWidth: statusWidth };

    const fontSz = totalScoreCols > 8 ? 6 : 6.5;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: 'plain',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontSize: fontSz,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: fontSz,
        cellPadding: 1.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.25,
      },
      columnStyles: stdColStyles,
      head: [stdHeaders],
      body: stdRows,
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body') {
          // CPMK columns
          if (dataCell.column.index >= 3 && dataCell.column.index < 3 + data.cpmks.length) {
            const raw = parseFloat(String(dataCell.cell.raw));
            if (!isNaN(raw)) {
              if (raw >= targetBenchmark) {
                dataCell.cell.styles.textColor = [5, 150, 105];
              } else {
                dataCell.cell.styles.textColor = [225, 29, 72];
              }
            }
          }
          // Status column
          if (dataCell.column.index === 3 + data.cpmks.length + data.cpls.length) {
            if (dataCell.cell.raw === 'LULUS') {
              dataCell.cell.styles.textColor = [5, 150, 105];
            } else {
              dataCell.cell.styles.textColor = [225, 29, 72];
            }
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // ==========================================
  // LEMBAR PENGESAHAN (TANDA TANGAN)
  // ==========================================
  ensureSpace(48);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  const signCol1 = margin + contentWidth / 6;
  const signCol2 = margin + contentWidth / 2;
  const signCol3 = margin + (contentWidth * 5) / 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  doc.text('Mengetahui,', signCol1, currentY, { align: 'center' });
  doc.text('Diverifikasi & Diaudit,', signCol2, currentY, { align: 'center' });
  doc.text(
    `Disahkan di Ambon, ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    signCol3,
    currentY,
    { align: 'center' }
  );
  currentY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Ketua Program Studi,', signCol1, currentY, { align: 'center' });
  doc.text('Tim Gugus Jaminan Mutu (GJM),', signCol2, currentY, { align: 'center' });
  doc.text('Dosen Pengampu Mata Kuliah,', signCol3, currentY, { align: 'center' });
  currentY += 19;

  // Nama (bold)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    data.headOfStudyProgram || 'Daniel G. Louhenapessy, S.Pi., M.Sc.',
    signCol1,
    currentY,
    { align: 'center' }
  );
  doc.text('Dr. J. W. Mosse, S.Pi., M.Si.', signCol2, currentY, { align: 'center' });
  doc.text(singleLecturer, signCol3, currentY, { align: 'center' });
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP. 19740510 199903 1 001', signCol1, currentY, { align: 'center' });
  doc.text('NIP. 19710815 199702 1 002', signCol2, currentY, { align: 'center' });
  doc.text(`NIP. ${singleNip}`, signCol3, currentY, { align: 'center' });
  currentY += 8;

  // ==========================================
  // MANDATORY COMPLETION & SUCCESS BANNER
  // ==========================================
  ensureSpace(24);

  // Dashed border line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  if (typeof (doc as any).setLineDash === 'function') {
    (doc as any).setLineDash([3, 2]);
  }
  doc.line(margin, currentY, pageWidth - margin, currentY);
  if (typeof (doc as any).setLineDash === 'function') {
    (doc as any).setLineDash([]);
  }
  currentY += 5;

  const bannerText =
    'SELAMAT HASIL PENGUKURAN DAN LAPORAN EVALUASI CAPAIAN CPL YANG DIBEBANKAN KE CP MATA KULIAH BAPAK/IBU TELAH SELESAI. SILAHKAN DITINDAKLANJUTI. SUKSES SELALU.';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const splitBanner = doc.splitTextToSize(bannerText, contentWidth - 10);
  const bannerH = splitBanner.length * 3.4 + 5;

  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, bannerH, 2, 2, 'FD');

  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(splitBanner, pageWidth / 2, currentY + 3.8, { align: 'center' });

  // ==========================================
  // FOOTER ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `${data.courseCode} - ${data.courseName} • Universitas Pattimura`,
      margin,
      pageHeight - 6,
      { align: 'left' }
    );

    doc.text(
      `Dokumen Mutu OBE • Halaman ${i} dari ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Save the PDF
  const sanitizedTitle = (data.courseName || 'Laporan_OBE')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30);
  doc.save(`Laporan_OBE_${data.courseCode}_${sanitizedTitle}.pdf`);
}
