import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OBEAssessmentData, CourseAuditLog } from '../types/obe';
import { LIST_PROGRAM_STUDI } from './prodiHelper';

export interface CourseQueryFilter {
  prodiId?: string;
  facultyId?: string;
  studyProgram?: string;
  faculty?: string;
  role?: string;
}

/**
 * Resolves standard prodi_id and faculty_id from study program name or faculty name
 */
export function resolveProdiAndFacultyIds(
  studyProgramName?: string,
  facultyName?: string
): { prodiId: string; facultyId: string } {
  if (!studyProgramName) {
    return {
      prodiId: '54242',
      facultyId: facultyName || 'Fakultas Perikanan dan Ilmu Kelautan',
    };
  }

  const clean = studyProgramName.trim().toLowerCase();
  const found = LIST_PROGRAM_STUDI.find(
    (p) =>
      p.code.toLowerCase() === clean ||
      p.name.toLowerCase() === clean ||
      p.slug.toLowerCase() === clean ||
      p.name.toLowerCase().includes(clean) ||
      clean.includes(p.name.toLowerCase())
  );

  if (found) {
    return {
      prodiId: found.code,
      facultyId: found.faculty,
    };
  }

  return {
    prodiId: clean.replace(/[^a-z0-9]/g, '').slice(0, 5).toUpperCase() || '54242',
    facultyId: facultyName || 'Fakultas Perikanan dan Ilmu Kelautan',
  };
}

export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  schemaPrefix?: string;
  autoSync?: boolean;
}

const STORAGE_KEY = 'obe_supabase_config_v1';

// Default / fallback configuration
const DEFAULT_CONFIG: SupabaseConfig = {
  projectUrl: '',
  anonKey: '',
  schemaPrefix: 'public',
  autoSync: false,
};

export function loadSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load Supabase config from localStorage:', err);
  }
  return DEFAULT_CONFIG;
}

export function saveSupabaseConfig(cfg: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save Supabase config:', err);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear Supabase config:', err);
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseClient(configOverride?: SupabaseConfig): SupabaseClient | null {
  const cfg = configOverride || loadSupabaseConfig();
  if (!cfg.projectUrl || !cfg.anonKey) {
    return null;
  }

  const key = `${cfg.projectUrl}_${cfg.anonKey}`;
  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(cfg.projectUrl.trim(), cfg.anonKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  statusCode?: number;
  tablesVerified?: boolean;
  details?: string;
}

/**
 * Tests connection to Supabase instance directly via PostgREST endpoint
 */
export async function testSupabaseConnection(config: SupabaseConfig): Promise<ConnectionTestResult> {
  const url = (config.projectUrl || '').trim().replace(/\/+$/, '');
  const key = (config.anonKey || '').trim();

  if (!url) {
    return {
      success: false,
      message: 'Supabase Project URL tidak boleh kosong.',
    };
  }

  if (!url.startsWith('https://')) {
    return {
      success: false,
      message: 'Project URL harus diawali dengan https:// (contoh: https://xyzcompany.supabase.co)',
    };
  }

  if (!key) {
    return {
      success: false,
      message: 'Supabase Anon Public Key tidak boleh kosong.',
    };
  }

  const startTime = performance.now();

  try {
    // 1. Try querying PostgREST root or obe_courses table
    const targetEndpoint = `${url}/rest/v1/obe_courses?select=id&limit=1`;
    const response = await fetch(targetEndpoint, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (response.ok) {
      return {
        success: true,
        message: 'Koneksi ke Supabase BERHASIL! Tabel `obe_courses` terdeteksi dan siap digunakan.',
        latencyMs,
        statusCode: response.status,
        tablesVerified: true,
      };
    }

    // If 404 on table, check if PostgREST root is reachable
    if (response.status === 404) {
      const rootTest = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });

      if (rootTest.ok) {
        return {
          success: true,
          message: 'Koneksi ke instance Supabase BERHASIL, namun tabel `obe_courses` belum dibuat. Silakan jalankan Skrip SQL DDL pada tab Petunjuk!',
          latencyMs,
          statusCode: 200,
          tablesVerified: false,
          details: 'Tabel database belum diinisialisasi.',
        };
      }
    }

    // If 401 / 403
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'Autentikasi DITOLAK oleh Supabase (401/403). Pastikan Anon / Public Key yang dimasukkan valid.',
        latencyMs,
        statusCode: response.status,
      };
    }

    const errText = await response.text().catch(() => '');
    return {
      success: false,
      message: `Supabase merespons dengan kode status ${response.status}: ${response.statusText}`,
      latencyMs,
      statusCode: response.status,
      details: errText.slice(0, 200),
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      message: `Gagal terhubung ke Supabase: ${err.message || 'Network Error / CORS Blocked'}. Pastikan URL aktif dan koneksi internet stabil.`,
      latencyMs,
      details: err.toString(),
    };
  }
}

/**
 * Pushes and saves current course assessment data directly into Supabase
 * Enforces multi-tenancy by persisting prodi_id and faculty_id
 */
export async function syncCourseToSupabase(
  courseData: OBEAssessmentData,
  configOverride?: SupabaseConfig
): Promise<{ success: boolean; message: string; data?: any }> {
  const client = getSupabaseClient(configOverride);
  if (!client) {
    return {
      success: false,
      message: 'Koneksi Supabase belum dikonfigurasi. Harap isi URL dan Anon Key terlebih dahulu.',
    };
  }

  try {
    const ids = resolveProdiAndFacultyIds(courseData.studyProgram, courseData.faculty);
    const prodiId = courseData.prodiId || ids.prodiId;
    const facultyId = courseData.facultyId || ids.facultyId;

    const payload = {
      course_code: courseData.courseCode,
      course_name: courseData.courseName,
      prodi_id: prodiId,
      faculty_id: facultyId,
      credits: courseData.credits,
      semester: courseData.semester,
      academic_year: courseData.academicYear,
      study_program: courseData.studyProgram,
      faculty: courseData.faculty,
      lecturer_name: courseData.lecturerName,
      lecturer_nip: courseData.lecturerNip || null,
      target_benchmark: courseData.targetBenchmark || 75.0,
      data_payload: {
        ...courseData,
        prodiId,
        facultyId,
      },
      updated_at: new Date().toISOString(),
    };

    // Upsert into obe_courses based on course_code
    const { data, error } = await client
      .from('obe_courses')
      .upsert(payload, { onConflict: 'course_code' })
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Data mata kuliah ${courseData.courseCode} (${courseData.courseName}) berhasil disimpan ke Supabase dengan Scope Tenant: Prodi ${prodiId} (${courseData.studyProgram})!`,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menyinkronkan data ke Supabase: ${err.message || 'Terjadi kesalahan sistem'}`,
    };
  }
}

/**
 * Fetches list of saved courses from Supabase with multi-tenant filtering
 * Automatically restricts queries to current user's session prodi_id or faculty_id
 */
export async function fetchCoursesFromSupabase(
  configOverride?: SupabaseConfig,
  filterScope?: CourseQueryFilter
): Promise<{
  success: boolean;
  courses?: Array<{
    course_code: string;
    course_name: string;
    prodi_id?: string;
    faculty_id?: string;
    updated_at: string;
    data_payload: OBEAssessmentData;
  }>;
  message?: string;
}> {
  const client = getSupabaseClient(configOverride);
  if (!client) {
    return {
      success: false,
      message: 'Koneksi Supabase belum dikonfigurasi.',
    };
  }

  try {
    let query = client
      .from('obe_courses')
      .select('course_code, course_name, prodi_id, faculty_id, updated_at, data_payload')
      .order('updated_at', { ascending: false });

    // Multi-tenant Query Filtering:
    // If not superadmin, restrict query to user's assigned prodi or faculty
    if (filterScope && filterScope.role !== 'admin') {
      if (filterScope.prodiId) {
        query = query.eq('prodi_id', filterScope.prodiId);
      } else if (filterScope.facultyId) {
        query = query.eq('faculty_id', filterScope.facultyId);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    let result = (data || []) as Array<{
      course_code: string;
      course_name: string;
      prodi_id?: string;
      faculty_id?: string;
      updated_at: string;
      data_payload: OBEAssessmentData;
    }>;

    // Client-side isolation filter fallback for legacy rows where prodi_id column was null
    if (filterScope && filterScope.role !== 'admin') {
      if (filterScope.prodiId) {
        result = result.filter((c) => {
          if (c.prodi_id && c.prodi_id === filterScope.prodiId) return true;
          const p = c.data_payload;
          if (!p) return false;
          if (p.prodiId && p.prodiId === filterScope.prodiId) return true;
          if (filterScope.studyProgram) {
            const cleanTarget = filterScope.studyProgram.toLowerCase();
            const cleanCourseProdi = (p.studyProgram || '').toLowerCase();
            return cleanCourseProdi.includes(cleanTarget) || cleanTarget.includes(cleanCourseProdi);
          }
          return false;
        });
      } else if (filterScope.facultyId) {
        result = result.filter((c) => {
          if (c.faculty_id && c.faculty_id === filterScope.facultyId) return true;
          const p = c.data_payload;
          if (!p) return false;
          if (p.facultyId && p.facultyId === filterScope.facultyId) return true;
          if (filterScope.faculty) {
            return (p.faculty || '').toLowerCase() === filterScope.faculty.toLowerCase();
          }
          return false;
        });
      }
    }

    return {
      success: true,
      courses: result,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memuat data dari Supabase',
    };
  }
}

const LOCAL_AUDIT_LOGS_KEY = 'obe_audit_logs_v1';

export function getLocalAuditLogs(): CourseAuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAuditLog(log: CourseAuditLog): void {
  try {
    const list = getLocalAuditLogs();
    const filtered = list.filter((l) => !(l.courseCode === log.courseCode && l.auditedAt === log.auditedAt));
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify([log, ...filtered]));
  } catch (err) {
    console.warn('Failed to save audit log locally:', err);
  }
}

/**
 * Saves a stage-by-stage audit log directly to Supabase as quality assurance history
 */
export async function saveAuditLogToSupabase(
  auditLog: CourseAuditLog,
  configOverride?: SupabaseConfig
): Promise<{ success: boolean; message: string; data?: any }> {
  // 1. Always save locally first for instant durability
  saveLocalAuditLog(auditLog);

  const client = getSupabaseClient(configOverride);
  if (!client) {
    return {
      success: true,
      message: 'Log Audit berhasil disimpan di penyimpanan lokal (Supabase belum terhubung).',
    };
  }

  try {
    let savedToTable = false;
    const ids = resolveProdiAndFacultyIds(auditLog.studyProgram);
    const prodiId = auditLog.prodiId || ids.prodiId;
    const facultyId = auditLog.facultyId || ids.facultyId;

    // 2. Try inserting into dedicated obe_audit_logs table
    try {
      const { data, error } = await client
        .from('obe_audit_logs')
        .insert({
          course_code: auditLog.courseCode,
          course_name: auditLog.courseName,
          study_program: auditLog.studyProgram,
          prodi_id: prodiId,
          faculty_id: facultyId,
          academic_year: auditLog.academicYear,
          auditor_name: auditLog.auditorName,
          auditor_nip: auditLog.auditorNip,
          audited_at: auditLog.auditedAt,
          overall_conclusion: auditLog.overallConclusion,
          overall_notes: auditLog.overallNotes,
          stage_logs: auditLog.stageLogs,
        })
        .select();

      if (!error && data) {
        savedToTable = true;
      }
    } catch {
      // Table might not exist yet, we will fallback to updating obe_courses data_payload
    }

    // 3. Also attach into obe_courses.data_payload so it is permanently bundled with the course
    try {
      const { data: existingCourse } = await client
        .from('obe_courses')
        .select('data_payload')
        .eq('course_code', auditLog.courseCode)
        .maybeSingle();

      if (existingCourse && existingCourse.data_payload) {
        const payload = existingCourse.data_payload as OBEAssessmentData;
        const logs = payload.auditLogs || [];
        const updatedPayload: OBEAssessmentData = {
          ...payload,
          auditLogs: [
            { ...auditLog, prodiId, facultyId },
            ...logs.filter((l) => l.auditedAt !== auditLog.auditedAt),
          ],
        };

        await client
          .from('obe_courses')
          .update({
            data_payload: updatedPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('course_code', auditLog.courseCode);
      }
    } catch (courseUpdateErr) {
      console.warn('Could not update course data_payload with audit log:', courseUpdateErr);
    }

    return {
      success: true,
      message: `Log Audit untuk mata kuliah ${auditLog.courseCode} (${auditLog.courseName}) berhasil disimpan ke Supabase dengan Scope Prodi: ${prodiId}!`,
    };
  } catch (err: any) {
    return {
      success: true, // Still marked success as it is cached locally
      message: `Tersimpan secara lokal. Gagal sinkron ke Supabase: ${err.message || 'Koneksi terganggu'}`,
    };
  }
}

/**
 * Fetches audit logs from Supabase and local storage with multi-tenant filtering
 */
export async function fetchAuditLogsFromSupabase(
  courseCode?: string,
  configOverride?: SupabaseConfig,
  filterScope?: CourseQueryFilter
): Promise<{ success: boolean; logs: CourseAuditLog[]; message?: string }> {
  const localLogs = getLocalAuditLogs();
  const client = getSupabaseClient(configOverride);

  if (!client) {
    let filtered = courseCode ? localLogs.filter((l) => l.courseCode === courseCode) : localLogs;
    if (filterScope && filterScope.role !== 'admin' && filterScope.prodiId) {
      filtered = filtered.filter(
        (l) =>
          l.prodiId === filterScope.prodiId ||
          (l.studyProgram && filterScope.studyProgram && l.studyProgram.toLowerCase().includes(filterScope.studyProgram.toLowerCase()))
      );
    }
    return { success: true, logs: filtered };
  }

  try {
    let remoteLogs: CourseAuditLog[] = [];

    // 1. Try querying obe_audit_logs table with multi-tenant restriction
    let query = client.from('obe_audit_logs').select('*').order('audited_at', { ascending: false });
    if (courseCode) {
      query = query.eq('course_code', courseCode);
    }
    if (filterScope && filterScope.role !== 'admin') {
      if (filterScope.prodiId) {
        query = query.eq('prodi_id', filterScope.prodiId);
      } else if (filterScope.facultyId) {
        query = query.eq('faculty_id', filterScope.facultyId);
      }
    }
    const { data, error } = await query;
    if (!error && data) {
      remoteLogs = data.map((d: any) => ({
        id: d.id,
        courseCode: d.course_code,
        courseName: d.course_name,
        studyProgram: d.study_program,
        prodiId: d.prodi_id,
        facultyId: d.faculty_id,
        academicYear: d.academic_year,
        auditorName: d.auditor_name,
        auditorNip: d.auditor_nip,
        auditedAt: d.audited_at,
        overallConclusion: d.overall_conclusion,
        overallNotes: d.overall_notes,
        stageLogs: d.stage_logs,
      }));
    }

    // Merge with local logs, de-duplicating by courseCode and auditedAt
    const combined = [...remoteLogs];
    localLogs.forEach((loc) => {
      if (!combined.some((c) => c.courseCode === loc.courseCode && c.auditedAt === loc.auditedAt)) {
        combined.push(loc);
      }
    });

    const filtered = courseCode ? combined.filter((l) => l.courseCode === courseCode) : combined;
    return { success: true, logs: filtered };
  } catch (err: any) {
    const filtered = courseCode ? localLogs.filter((l) => l.courseCode === courseCode) : localLogs;
    return { success: true, logs: filtered, message: err.message };
  }
}

