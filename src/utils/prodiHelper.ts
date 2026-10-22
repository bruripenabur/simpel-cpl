import {
  UNPATTI_PRODI_117,
  UNPATTI_FAKULTAS_LIST,
  UnpattiProdi,
} from '../data/unpattiProdiList';

export interface ProgramStudiInfo {
  id: string;
  slug: string;
  code: string;
  name: string;
  faculty: string;
  degree: 'S1' | 'S2' | 'S3' | 'Profesi' | 'Sp-1' | 'Spesialis';
  semester: number;
  colorScheme: 'cyan' | 'purple' | 'blue' | 'green' | 'amber' | 'rose' | 'indigo';
  defaultKaprodi: string;
  defaultKaprodiNip: string;
}

export const LIST_FAKULTAS = UNPATTI_FAKULTAS_LIST;

// Specific known Kaprodi data for FPIK and key programs
const KNOWN_KAPRODI: Record<string, { kaprodi: string; nip: string }> = {
  '54242': { kaprodi: 'Daniel G. Louhenapessy, S.Pi., M.Sc.', nip: '19740510 199903 1 001' }, // BDP
  '54241': { kaprodi: 'Dr. Ir. Pieter T. Berhimpon, M.Si.', nip: '19680312 199303 1 002' }, // MSP
  '54244': { kaprodi: 'Dr. Theopilus W. Watuguly, S.Pi., M.Si.', nip: '19750918 200112 1 003' }, // THP
  '54243': { kaprodi: 'Dr. Ir. Marcus L. Tupamahu, M.Si.', nip: '19700420 199512 1 001' }, // PSP
  '54245': { kaprodi: 'Dra. Hellen R. Matrutty, M.Si.', nip: '19661125 199203 2 001' }, // AGP
  '54246': { kaprodi: 'Dr. Gino V. Limmon, M.Sc.', nip: '19671204 199403 1 002' }, // IKL
  '54101': { kaprodi: 'Prof. Dr. Ir. J. M. S. Tetelepta, M.Sc.', nip: '19630718 198903 1 002' }, // S2 IKP
  '55201': { kaprodi: 'Dr. Ir. Samuel A. Mandowen, M.Cs.', nip: '19750814 200012 1 002' }, // T-INF
  '55202': { kaprodi: 'Hendry Silooy, S.Kom., M.Cs.', nip: '19810614 200812 1 002' }, // ILKOM
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export const LIST_PROGRAM_STUDI: ProgramStudiInfo[] = UNPATTI_PRODI_117.map((item) => {
  const known = KNOWN_KAPRODI[item.kode];
  const slug = `${item.kode.toLowerCase()}-${slugify(item.nama)}`;
  return {
    id: item.kode.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    slug: slug,
    code: item.kode,
    name: item.nama,
    faculty: item.fakultas,
    degree: item.jenjang,
    semester: item.semester,
    colorScheme: item.colorScheme,
    defaultKaprodi: known ? known.kaprodi : `Koordinator Program Studi ${item.nama}`,
    defaultKaprodiNip: known ? known.nip : '19780512 200501 1 002',
  };
});

/**
 * Reads program studi from URL query string (?prodi=slug_or_code)
 */
export function getProdiFromUrl(): ProgramStudiInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const paramProdi = params.get('prodi') || params.get('program_studi');
    if (!paramProdi) return null;

    const clean = paramProdi.trim().toLowerCase();
    const cleanNoDash = clean.replace(/[-_]/g, ' ');
    const found = LIST_PROGRAM_STUDI.find(
      (p) =>
        p.code.toLowerCase() === clean ||
        p.slug.toLowerCase() === clean ||
        p.id.toLowerCase() === clean ||
        p.slug.toLowerCase().replace(/[-_]/g, ' ').includes(cleanNoDash) ||
        p.name.toLowerCase().includes(cleanNoDash) ||
        cleanNoDash.includes(p.name.toLowerCase()) ||
        p.code.toLowerCase().includes(clean)
    );
    if (found) return found;

    // Custom prodi if not found in pre-defined list
    return {
      id: clean.replace(/[^a-z0-9]/g, '_'),
      slug: clean.replace(/[^a-z0-9]/g, '-'),
      code: clean.slice(0, 5).toUpperCase(),
      name: paramProdi,
      faculty: 'Universitas Pattimura',
      degree: 'S1',
      semester: 8,
      colorScheme: 'blue',
      defaultKaprodi: 'Ketua Program Studi',
      defaultKaprodiNip: '-',
    };
  } catch {
    return null;
  }
}

/**
 * Builds the full shareable URL for a Program Studi
 */
export function getProdiShareableLink(prodiCodeOrSlug: string, role?: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete('jenjang');
  url.searchParams.set('prodi', prodiCodeOrSlug);
  if (role) {
    url.searchParams.set('role', role);
  } else {
    url.searchParams.delete('role');
  }
  return url.toString();
}

/**
 * Reads jenjang/degree parameter from URL (?jenjang=s1|s2|s3|profesi|sp-1)
 */
export function getJenjangFromUrl(): 'S1' | 'S2' | 'S3' | 'Profesi' | 'Sp-1' | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('jenjang') || params.get('degree');
    if (!param) return null;
    const clean = param.trim().toLowerCase();
    if (clean === 's2' || clean === 'magister') return 'S2';
    if (clean === 's3' || clean === 'doktor') return 'S3';
    if (clean === 'profesi' || clean === 'pr') return 'Profesi';
    if (clean === 'sp-1' || clean === 'sp1' || clean === 'spesialis') return 'Sp-1';
    if (clean === 's1' || clean === 'sarjana') return 'S1';
    return null;
  } catch {
    return null;
  }
}

/**
 * Builds the shareable URL for a specific Jenjang (e.g., ?jenjang=s2)
 */
export function getJenjangShareableLink(jenjang: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete('prodi');
  url.searchParams.delete('role');
  url.searchParams.set('jenjang', jenjang.toLowerCase());
  return url.toString();
}

/**
 * Reads faculty parameter from URL (?fakultas=... or ?faculty=...)
 */
export function getFacultyFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('fakultas') || params.get('faculty');
    if (!param) return null;
    const clean = param.trim().toLowerCase();

    const found = LIST_FAKULTAS.find(
      (f) =>
        f.toLowerCase() === clean ||
        f.toLowerCase().includes(clean) ||
        clean.includes(f.toLowerCase())
    );
    return found || param.trim();
  } catch {
    return null;
  }
}

/**
 * Builds the shareable URL for a Faculty
 */
export function getFacultyShareableLink(facultyName: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete('prodi');
  url.searchParams.delete('jenjang');
  url.searchParams.delete('role');
  url.searchParams.set('fakultas', facultyName);
  return url.toString();
}

/**
 * Checks if the application was loaded via a direct personalized link (?prodi=..., ?fakultas=..., or ?jenjang=...)
 */
export function isUniversalPortalLocked(): {
  isLocked: boolean;
  type: 'prodi' | 'faculty' | 'jenjang' | null;
  prodi: ProgramStudiInfo | null;
  faculty: string | null;
  jenjang: string | null;
  scopedProdis: ProgramStudiInfo[];
} {
  const prodi = getProdiFromUrl();
  if (prodi) {
    return {
      isLocked: true,
      type: 'prodi',
      prodi,
      faculty: prodi.faculty,
      jenjang: prodi.degree,
      scopedProdis: [prodi],
    };
  }

  const faculty = getFacultyFromUrl();
  if (faculty) {
    const facultyProdis = LIST_PROGRAM_STUDI.filter(
      (p) => p.faculty.toLowerCase() === faculty.toLowerCase()
    );
    return {
      isLocked: true,
      type: 'faculty',
      prodi: facultyProdis[0] || null,
      faculty,
      jenjang: null,
      scopedProdis: facultyProdis.length > 0 ? facultyProdis : LIST_PROGRAM_STUDI,
    };
  }

  const jenjang = getJenjangFromUrl();
  if (jenjang) {
    const jenjangProdis = LIST_PROGRAM_STUDI.filter(
      (p) => p.degree.toLowerCase() === jenjang.toLowerCase()
    );
    return {
      isLocked: true,
      type: 'jenjang',
      prodi: null,
      faculty: null,
      jenjang,
      scopedProdis: jenjangProdis.length > 0 ? jenjangProdis : LIST_PROGRAM_STUDI,
    };
  }

  return {
    isLocked: false,
    type: null,
    prodi: null,
    faculty: null,
    jenjang: null,
    scopedProdis: LIST_PROGRAM_STUDI,
  };
}

/**
 * Copies a link to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
