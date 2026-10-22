import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  BorderStyle,
  VerticalAlign,
} from 'docx';
import {
  OBEAssessmentData,
  CPMKCalculationResult,
  CPLCalculationResult,
} from '../types/obe';
import { PDFChartImages } from './pdfGenerator';
import { getUnpattiLogoDataUrl } from './unpattiLogo';
import { getSingleLecturerName, getSingleLecturerNip } from './lecturerHelper';
import { generateCPMKBarChartImage, generateCPLBarChartImage, generateRadarSpiderWebChartImage } from './chartRenderer';
import { calculateStudentIndividualAchievements } from './calculator';

function base64ToUint8Array(base64DataUrl: string): Uint8Array {
  const base64 = base64DataUrl.split(',')[1] || base64DataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function exportOBEAssessmentToDOCX(
  data: OBEAssessmentData,
  cpmkResults: CPMKCalculationResult[],
  cplResults: CPLCalculationResult[],
  componentTotalAverages: Record<string, number>,
  targetBenchmark: number = 75.0,
  chartImages?: PDFChartImages
) {
  const totalStudents = data.unitClasses.reduce(
    (sum, u) => sum + (u.studentCount || 0),
    0
  );
  const overallAvg = (
    cpmkResults.reduce((acc, c) => acc + c.capaianAkhir, 0) /
    Math.max(1, cpmkResults.length)
  ).toFixed(2);

  const singleLecturer = getSingleLecturerName(data.lecturerName);
  const singleNip = getSingleLecturerNip(data.lecturerNip);

  const rawSem = (data.semester || '1').trim();
  const cleanSem = rawSem.replace(/^semester\s+semester\s+/i, 'Semester ');
  const semesterLabel = cleanSem.toLowerCase().startsWith('semester') ? cleanSem : `Semester ${cleanSem}`;

  const docChildren: any[] = [];

  // Helper for Section Headings (Exact match: bold dark slate with bottom border)
  const createHeading = (text: string) => {
    return new Paragraph({
      text: text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6, // ~0.75pt
          color: 'E2E8F0',
        },
      },
      run: {
        bold: true,
        color: '0F172A', // slate-950
        size: 22, // 11pt
        font: 'Arial',
      },
    });
  };

  // Helper for regular body text
  const createBodyParagraph = (text: string, isItalic = false) => {
    return new Paragraph({
      spacing: { before: 60, after: 100 },
      children: [
        new TextRun({
          text,
          italics: isItalic,
          size: 19, // ~9.5pt
          color: '334155', // slate-700
          font: 'Arial',
        }),
      ],
    });
  };

  // Helper for PPEPP colored cards (matching preview)
  const createCardBox = (
    title: string,
    content: string,
    fillColor: string,
    borderColor: string,
    titleColor: string,
    textColor: string = '334155'
  ) => {
    if (!content || !content.trim()) return;

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: fillColor },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
                  left: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
                  right: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
                },
                children: [
                  new Paragraph({
                    spacing: { after: 60 },
                    children: [
                      new TextRun({
                        text: title,
                        bold: true,
                        size: 19, // 9.5pt
                        color: titleColor,
                        font: 'Arial',
                      }),
                    ],
                  }),
                  ...content.split('\n').map(
                    (line) =>
                      new Paragraph({
                        spacing: { before: 40, after: 40 },
                        children: [
                          new TextRun({
                            text: line,
                            size: 18, // 9pt
                            color: textColor,
                            font: 'Arial',
                          }),
                        ],
                      })
                  ),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 80 } })
    );
  };

  // ==========================================
  // 1. KOP SURAT AKADEMIK RESMI (Matching Preview Gambar 1 & Gambar 5)
  // ==========================================
  const unpattiLogoData = getUnpattiLogoDataUrl(240, 264);
  let logoRun: ImageRun | null = null;
  if (unpattiLogoData) {
    try {
      const logoBytes = base64ToUint8Array(unpattiLogoData);
      logoRun = new ImageRun({
        data: logoBytes,
        type: 'png',
        transformation: {
          width: 76,
          height: 84,
        },
      });
    } catch (e) {
      console.warn('Gagal menambahkan logo Unpatti ke Word:', e);
    }
  }

  const borderless = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
  };

  const kopTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderless,
    rows: [
      new TableRow({
        children: [
          // Sisi Kiri: Logo UNPATTI 2 cm proporsional
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: borderless,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: logoRun ? [logoRun] : [],
              }),
            ],
          }),
          // Sisi Tengah: Teks Kop Resmi Berbaris Rapi
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: borderless,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 25 },
                children: [
                  new TextRun({
                    text: 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI',
                    bold: true,
                    size: 16, // 8pt
                    color: '475569',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 25 },
                children: [
                  new TextRun({
                    text: 'UNIVERSITAS PATTIMURA',
                    bold: true,
                    size: 24, // 12pt
                    color: '0F172A',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 25 },
                children: [
                  new TextRun({
                    text: (data.faculty || 'FAKULTAS PERIKANAN DAN ILMU KELAUTAN').toUpperCase(),
                    bold: true,
                    size: 20, // 10pt
                    color: '1E293B',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 35 },
                children: [
                  new TextRun({
                    text: (data.studyProgram || 'BUDIDAYA PERAIRAN').toUpperCase(),
                    bold: true,
                    size: 19, // 9.5pt
                    color: '0F172A',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 25 },
                children: [
                  new TextRun({
                    text: 'LAPORAN HASIL ASESMEN CAPAIAN PEMBELAJARAN LULUSAN (CPL) MATA KULIAH',
                    bold: true,
                    size: 21, // 10.5pt
                    color: '1E1B4B', // dark navy
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Kurikulum Berbasis Outcome (OBE) • ${semesterLabel} (${data.academicYear || '2024/2025'})`,
                    size: 16,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          // Sisi Kanan: Spacer penyeimbang
          new TableCell({
            width: { size: 14, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: borderless,
            children: [new Paragraph({})],
          }),
        ],
      }),
    ],
  });

  docChildren.push(kopTable);

  // Garis Ganda Kop Surat Resmi (Double Underline)
  docChildren.push(
    new Paragraph({
      spacing: { before: 40, after: 120 },
      border: {
        bottom: {
          style: BorderStyle.DOUBLE,
          size: 20, // ~2.5pt double border
          color: '0F172A',
        },
      },
      children: [],
    })
  );

  // ==========================================
  // SECTION 1: IDENTITAS MATA KULIAH (4-Kolom Box Card)
  // ==========================================
  docChildren.push(createHeading('1. IDENTITAS MATA KULIAH'));

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      rows: [
        new TableRow({
          children: [
            // Kolom 1
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { fill: 'F8FAFC' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Mata Kuliah:', size: 16, color: '64748B', font: 'Arial' })],
                }),
                new Paragraph({
                  spacing: { before: 40 },
                  children: [new TextRun({ text: data.courseName || '-', bold: true, size: 19, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
            // Kolom 2
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { fill: 'F8FAFC' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Kode & Beban:', size: 16, color: '64748B', font: 'Arial' })],
                }),
                new Paragraph({
                  spacing: { before: 40 },
                  children: [new TextRun({ text: `${data.courseCode} (${data.credits} SKS)`, bold: true, size: 19, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
            // Kolom 3
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { fill: 'F8FAFC' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Dosen Pengampu:', size: 16, color: '64748B', font: 'Arial' })],
                }),
                new Paragraph({
                  spacing: { before: 40 },
                  children: [new TextRun({ text: singleLecturer, bold: true, size: 19, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
            // Kolom 4
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { fill: 'F8FAFC' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Mahasiswa & Kelas:', size: 16, color: '64748B', font: 'Arial' })],
                }),
                new Paragraph({
                  spacing: { before: 40 },
                  children: [new TextRun({ text: `${totalStudents} Mahasiswa (${data.unitClasses.length} Unit)`, bold: true, size: 19, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // ==========================================
  // SECTION 2: MODEL DAN KOMPOSISI PENILAIAN
  // ==========================================
  docChildren.push(createHeading('2. MODEL DAN KOMPOSISI PENILAIAN'));
  if (data.narrativeNotes?.modelPenilaian) {
    docChildren.push(createBodyParagraph(data.narrativeNotes.modelPenilaian));
  }

  const compTableHeaders = ['No', 'Unsur Penilaian', 'Bobot (%)', 'Nilai Rata-rata Gabungan'];
  const compColWidths = [10, 50, 20, 20];

  const compTableRows = [
    new TableRow({
      tableHeader: true,
      children: compTableHeaders.map(
        (h, idx) =>
          new TableCell({
            width: { size: compColWidths[idx], type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' }, // light slate-100 (#F1F5F9)
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: idx === 1 ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [new TextRun({ text: h, bold: true, size: 18, color: '334155', font: 'Arial' })],
              }),
            ],
          })
      ),
    }),
    ...data.components.map(
      (c, i) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${i + 1}`, size: 18, color: '334155', font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: c.name, bold: true, size: 18, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${c.weight}%`, bold: true, size: 18, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: (componentTotalAverages[c.id] ?? 0).toFixed(2),
                      bold: true,
                      size: 18,
                      color: '4338CA', // bold indigo (#4338CA) exactly matching preview
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: compTableRows,
    })
  );

  // ==========================================
  // SECTION 3: PEMETAAN ASESMEN THDP CPMK
  // ==========================================
  docChildren.push(createHeading('3. PEMETAAN ASESMEN TERHADAP CPMK'));

  const cpmkHeadCells = [
    new TableCell({
      width: { size: 40, type: WidthType.PERCENTAGE },
      shading: { fill: 'F1F5F9' },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Unsur Penilaian', bold: true, size: 18, color: '334155', font: 'Arial' })],
        }),
      ],
    }),
    new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      shading: { fill: 'F1F5F9' },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Bobot', bold: true, size: 18, color: '334155', font: 'Arial' })],
        }),
      ],
    }),
    ...data.cpmks.map(
      (c) =>
        new TableCell({
          shading: { fill: 'F1F5F9' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${c.code}\n(${c.weight}%)`,
                  bold: true,
                  size: 17,
                  color: '334155',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        })
    ),
  ];

  const cpmkMappingDocxRows = [
    new TableRow({ tableHeader: true, children: cpmkHeadCells }),
    ...data.components.map(
      (comp) =>
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: comp.name, bold: true, size: 18, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${comp.weight}%`, bold: true, size: 18, color: '0F172A', font: 'Arial' })],
                }),
              ],
            }),
            ...data.cpmks.map((cpmk) => {
              const weightVal = comp.cpmkWeights?.[cpmk.code];
              return new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: weightVal ? `${weightVal}%` : '-',
                        bold: !!weightVal,
                        size: 18,
                        color: weightVal ? '0F172A' : '94A3B8',
                        font: 'Arial',
                      }),
                    ],
                  }),
                ],
              });
            }),
          ],
        })
    ),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: cpmkMappingDocxRows,
    })
  );

  // ==========================================
  // SECTION 4: HASIL CAPAIAN TIAP CPMK DAN ANALISIS
  // ==========================================
  docChildren.push(createHeading('4. HASIL CAPAIAN TIAP CPMK DAN ANALISIS'));

  // Embed CPMK Chart Image (always generated)
  const cpmkImgDataUrl = chartImages?.cpmkChart || generateCPMKBarChartImage(cpmkResults, targetBenchmark);
  if (cpmkImgDataUrl) {
    try {
      const imgBytes = base64ToUint8Array(cpmkImgDataUrl);
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [
            new ImageRun({
              data: imgBytes,
              type: cpmkImgDataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png',
              transformation: {
                width: 580,
                height: 278,
              },
            }),
          ],
        })
      );
    } catch (e) {
      console.warn('Gagal menambahkan gambar CPMK ke Word:', e);
    }
  }

  const cpmkHeaders = [
    'Kode CPMK',
    'Bobot (%)',
    'Nilai Awal',
    'Capaian Akhir',
    'Target',
    'Delta Gap',
    'Status Ketercapaian',
  ];

  const cpmkDocxRows = [
    new TableRow({
      tableHeader: true,
      children: cpmkHeaders.map(
        (h) =>
          new TableCell({
            shading: { fill: 'F1F5F9' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: h, bold: true, size: 17, color: '334155', font: 'Arial' })],
              }),
            ],
          })
      ),
    }),
    ...cpmkResults.map(
      (c) =>
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: c.cpmkCode, bold: true, size: 18, color: '312E81', font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${c.persentaseCPMK}%`, size: 18, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: c.nilaiAwalCPMK.toFixed(2), size: 18, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${c.capaianAkhir.toFixed(2)}%`,
                      bold: true,
                      size: 18,
                      color: '312E81',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${c.target.toFixed(2)}%`, size: 18, font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${c.gap > 0 ? '+' : ''}${c.gap.toFixed(2)}%`,
                      bold: true,
                      size: 18,
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI',
                      bold: true,
                      size: 17,
                      color: c.isAchieved ? '059669' : 'E11D48',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: cpmkDocxRows,
    })
  );

  if (data.narrativeNotes?.analisisCPMK) {
    createCardBox(
      'Analisis Kinerja Capaian CPMK:',
      data.narrativeNotes.analisisCPMK,
      'F8FAFC',
      'E2E8F0',
      '0F172A'
    );
  }

  // ==========================================
  // SECTION 5: KONTRIBUSI TERHADAP CPL DAN ANALISIS
  // ==========================================
  docChildren.push(createHeading('5. KONTRIBUSI TERHADAP CPL DAN ANALISIS'));

  // Embed CPL Chart Image (always generated)
  const cplImgDataUrl = chartImages?.cplChart || generateCPLBarChartImage(cplResults, targetBenchmark);
  if (cplImgDataUrl) {
    try {
      const imgBytes = base64ToUint8Array(cplImgDataUrl);
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [
            new ImageRun({
              data: imgBytes,
              type: cplImgDataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png',
              transformation: {
                width: 580,
                height: 278,
              },
            }),
          ],
        })
      );
    } catch (e) {
      console.warn('Gagal menambahkan gambar CPL ke Word:', e);
    }
  }

  const cplTableHeaders = [
    'Kode CPL',
    'Ranah',
    'Rincian Agregasi CPMK Penyusun',
    'Skor CPL',
    'Target',
    'Delta Gap',
    'Status Mutu',
  ];

  const cplDocxRows = [
    new TableRow({
      tableHeader: true,
      children: cplTableHeaders.map(
        (h) =>
          new TableCell({
            shading: { fill: 'F1F5F9' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: h, bold: true, size: 17, color: '334155', font: 'Arial' })],
              }),
            ],
          })
      ),
    }),
    ...cplResults.map((c) => {
      const rincianCPMK = c.contributingCPMKs
        .map(
          (cc) =>
            `${cc.cpmkCode} (${cc.weightInCPL}% × ${cc.cpmkScore.toFixed(1)} = ${cc.contribution.toFixed(1)}%)`
        )
        .join(' + ');
      return new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: c.cplCode, bold: true, size: 18, color: '312E81', font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: c.category, size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: rincianCPMK, size: 17, color: '475569', font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${c.capaianAkhir.toFixed(2)}%`,
                    bold: true,
                    size: 18,
                    color: '312E81',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${c.target.toFixed(2)}%`, size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${c.gap > 0 ? '+' : ''}${c.gap.toFixed(2)}%`,
                    bold: true,
                    size: 18,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: c.isAchieved ? 'TERCAPAI' : 'BELUM TERCAPAI',
                    bold: true,
                    size: 17,
                    color: c.isAchieved ? '059669' : 'D97706',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: cplDocxRows,
    })
  );

  if (data.narrativeNotes?.analisisCPL) {
    createCardBox(
      'Analisis Dampak terhadap Profil Lulusan (CPL):',
      data.narrativeNotes.analisisCPL,
      'F8FAFC',
      'E2E8F0',
      '0F172A'
    );
  }

  // Embed Radar Chart image if available
  const radarImgDataUrl = chartImages?.radarChart || generateRadarSpiderWebChartImage(cpmkResults, cplResults, targetBenchmark);
  if (radarImgDataUrl) {
    try {
      const imgBytes = base64ToUint8Array(radarImgDataUrl);
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new ImageRun({
              data: imgBytes,
              type: radarImgDataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png',
              transformation: {
                width: 480,
                height: 324,
              },
            }),
          ],
        })
      );
    } catch (e) {
      console.warn('Gagal menambahkan radar chart ke Word:', e);
    }
  }

  // ==========================================
  // SECTION 6: SIKLUS PENJAMINAN MUTU AKADEMIK (PPEPP)
  // ==========================================
  docChildren.push(createHeading('6. SIKLUS PENJAMINAN MUTU AKADEMIK (PPEPP)'));

  if (data.narrativeNotes?.modelPenilaian) {
    createCardBox(
      '[P - Perencanaan] Model & Komposisi Penilaian:',
      data.narrativeNotes.modelPenilaian,
      'EFF6FF',
      'BFDBFE',
      '1E3A8A'
    );
  }

  if (data.narrativeNotes?.pelaksanaanPembelajaran) {
    createCardBox(
      '[P - Pelaksanaan] Aktivitas Pembelajaran & Asesmen Terstruktur:',
      data.narrativeNotes.pelaksanaanPembelajaran,
      'FAF5FF',
      'E9D5FF',
      '581C87'
    );
  }

  const evaluasiSummary = `1. Evaluasi CPMK: ${data.narrativeNotes?.analisisCPMK || 'Telah memenuhi standar kelulusan.'}\n2. Evaluasi CPL: ${data.narrativeNotes?.analisisCPL || 'Kontribusi mata kuliah selaras dengan profil lulusan.'}`;
  createCardBox(
    '[E - Evaluasi CPMK & CPL] Analisis Ketercapaian Hasil Belajar:',
    evaluasiSummary,
    'FFFBEB',
    'FDE68A',
    '78350F'
  );

  if (data.narrativeNotes?.pengendalianMutu) {
    createCardBox(
      '[P - Pengendalian] Monitoring Deviasi Mutu & Tindakan Koreksi Cepat:',
      data.narrativeNotes.pengendalianMutu,
      'FFF1F2',
      'FECDD3',
      '881337'
    );
  }

  createCardBox(
    '[P - Peningkatan] Rencana Tindak Lanjut Berkelanjutan (Continuous Quality Improvement / CQI):',
    data.narrativeNotes?.rekomendasiCQI || '1. Memperkuat sesi tutorial dan responsi.\n2. Menyempurnakan rubrik asesmen berbasis kriteria.',
    'ECFDF5',
    'A7F3D0',
    '064E3B'
  );

  createCardBox(
    'Kesimpulan Akhir Siklus PPEPP:',
    data.narrativeNotes?.kesimpulan || `Secara keseluruhan ketercapaian mata kuliah berada pada rata-rata ${overallAvg}%.`,
    'F8FAFC',
    'E2E8F0',
    '0F172A'
  );

  // ==========================================
  // SECTION 7: PORTOFOLIO CAPAIAN INDIVIDU MAHASISWA (Matching Gambar 1)
  // ==========================================
  const studentAchievements = calculateStudentIndividualAchievements(data);
  if (studentAchievements && studentAchievements.length > 0) {
    docChildren.push(createHeading('7. ANALISIS CAPAIAN CPL & CPMK PER INDIVIDU MAHASISWA'));

    docChildren.push(
      new Paragraph({
        spacing: { before: 40, after: 60 },
        children: [
          new TextRun({
            text: `Evaluasi Ketercapaian Riil Mahasiswa Berdasarkan Standar Acuan Target ${targetBenchmark.toFixed(2)}%:`,
            italics: true,
            size: 17,
            color: '64748B',
            font: 'Arial',
          }),
        ],
      })
    );

    const stdHeaders = [
      'No',
      'NIM & Nama Mahasiswa',
      'Unit Kelas',
      ...data.cpmks.map((c) => `${c.code}\n(${c.weight}%)`),
      ...data.cpls.map((c) => c.code),
      'Status Evaluasi',
    ];

    const stdHeaderCells = stdHeaders.map(
      (h, idx) =>
        new TableCell({
          shading: { fill: 'F1F5F9' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
            right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
          },
          children: [
            new Paragraph({
              alignment: idx <= 1 ? AlignmentType.LEFT : AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 16,
                  color: '334155',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        })
    );

    const stdRows = [
      new TableRow({
        tableHeader: true,
        children: stdHeaderCells,
      }),
      ...studentAchievements.map((sa, idx) => {
        const cpmkCells = data.cpmks.map((c) => {
          const item = sa.cpmkScores[c.code];
          const score = item?.score ?? 0;
          const isAch = item?.isAchieved ?? false;
          return new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${score.toFixed(1)}%`,
                    bold: true,
                    size: 16,
                    color: isAch ? '059669' : 'E11D48',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          });
        });

        const cplCells = data.cpls.map((c) => {
          const item = sa.cplScores[c.code];
          const score = item?.score ?? 0;
          return new TableCell({
            shading: { fill: 'F8FAFC' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${score.toFixed(1)}%`,
                    bold: true,
                    size: 16,
                    color: '334155',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          });
        });

        return new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: String(idx + 1), size: 16, color: '64748B', font: 'Arial' })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: sa.student.name, bold: true, size: 17, color: '0F172A', font: 'Arial' })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: sa.student.nim, size: 15, color: '64748B', font: 'Courier New' })],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: sa.student.unitClassName || 'Reguler', size: 16, color: '475569', font: 'Arial' })],
                }),
              ],
            }),
            ...cpmkCells,
            ...cplCells,
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: sa.isAllPassed ? 'Lulus Penuh' : 'Remedial',
                      bold: true,
                      size: 16,
                      color: sa.isAllPassed ? '059669' : 'E11D48',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }),
    ];

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: stdRows,
      })
    );
  }

  // ==========================================
  // LEMBAR PENGESAHAN (TANDA TANGAN)
  // ==========================================
  docChildren.push(
    new Paragraph({
      spacing: { before: 240 },
      border: {
        top: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: 'E2E8F0',
        },
      },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Mengetahui,', size: 18, color: '334155', font: 'Arial' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Ketua Program Studi', bold: true, size: 19, color: '0F172A', font: 'Arial' })],
                }),
                new Paragraph({ spacing: { before: 500 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: data.headOfStudyProgram || 'Daniel G. Louhenapessy, S.Pi., M.Sc.',
                      bold: true,
                      underline: {},
                      size: 19,
                      color: '0F172A',
                      font: 'Arial',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'NIP. 19740510 199903 1 001',
                      size: 17,
                      color: '64748B',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `Disahkan di Kampus, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                      size: 18,
                      color: '334155',
                      font: 'Arial',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'Dosen Pengampu Mata Kuliah,', bold: true, size: 19, color: '0F172A', font: 'Arial' })],
                }),
                new Paragraph({ spacing: { before: 500 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: singleLecturer,
                      bold: true,
                      underline: {},
                      size: 19,
                      color: '0F172A',
                      font: 'Arial',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `NIP. ${singleNip}`,
                      size: 17,
                      color: '64748B',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // ==========================================
  // MANDATORY COMPLETION & SUCCESS BANNER
  // ==========================================
  docChildren.push(
    new Paragraph({ spacing: { before: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'ECFDF5' }, // emerald-50
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: 'A7F3D0' },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'A7F3D0' },
                left: { style: BorderStyle.SINGLE, size: 6, color: 'A7F3D0' },
                right: { style: BorderStyle.SINGLE, size: 6, color: 'A7F3D0' },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'SELAMAT HASIL PENGUKURAN DAN LAPORAN EVALUASI CAPAIAN CPL YANG DIBEBANKAN KE CP MATA KULIAH BAPAK/IBU TELAH SELESAI. SILAHKAN DITINDAKLANJUTI. SUKSES SELALU.',
                      bold: true,
                      size: 16,
                      color: '065F46', // emerald-800
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitizedTitle = (data.courseName || 'Laporan_OBE')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 30);
  a.download = `Laporan_OBE_${data.courseCode}_${sanitizedTitle}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
