export const SUPABASE_SQL_DDL = `-- ====================================================================
-- SKRIP SQL DDL LENGKAP: DATABASE ASESMEN OUTCOME-BASED EDUCATION (OBE)
-- DENGAN ARSITEKTUR MULTI-TENANCY TINGKAT PRODI & FAKULTAS (ROW LEVEL SECURITY)
-- Standar Penjaminan Mutu BAN-PT & LAM Sains / Keteknikan
-- Jalankan skrip ini langsung pada menu: SQL Editor di Dashboard Supabase
-- ====================================================================

-- 1. Mengaktifkan ekstensi UUID (jika belum aktif)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Master Mata Kuliah & Dokumen Asesmen OBE (Dengan Multi-Tenancy Scope)
CREATE TABLE IF NOT EXISTS public.obe_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    prodi_id VARCHAR(50) NOT NULL DEFAULT '54242', -- Tenant ID Prodi (misal: '54201', '54231', '54242')
    faculty_id VARCHAR(150) NOT NULL DEFAULT 'Fakultas Perikanan dan Ilmu Kelautan', -- Tenant ID Fakultas
    credits INTEGER NOT NULL DEFAULT 3,
    semester VARCHAR(50) NOT NULL,
    academic_year VARCHAR(50) NOT NULL DEFAULT '2024/2025',
    study_program VARCHAR(150) NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    lecturer_name VARCHAR(150) NOT NULL,
    lecturer_nip VARCHAR(100),
    head_of_study_program VARCHAR(150),
    target_benchmark NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    data_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi kolom jika tabel sudah pernah dibuat sebelumnya
ALTER TABLE public.obe_courses ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50) DEFAULT '54242';
ALTER TABLE public.obe_courses ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(150) DEFAULT 'Fakultas Perikanan dan Ilmu Kelautan';

-- 3. Tabel Rincian CPL (Capaian Pembelajaran Lulusan)
CREATE TABLE IF NOT EXISTS public.obe_cpls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) REFERENCES public.obe_courses(course_code) ON DELETE CASCADE,
    prodi_id VARCHAR(50) DEFAULT '54242',
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    target NUMERIC(5,2) DEFAULT 75.00,
    achieved_score NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.obe_cpls ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50) DEFAULT '54242';

-- 4. Tabel Rincian CPMK (Capaian Pembelajaran Mata Kuliah)
CREATE TABLE IF NOT EXISTS public.obe_cpmks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) REFERENCES public.obe_courses(course_code) ON DELETE CASCADE,
    prodi_id VARCHAR(50) DEFAULT '54242',
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    achieved_score NUMERIC(5,2),
    cpl_mappings JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.obe_cpmks ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50) DEFAULT '54242';

-- 5. Tabel Nilai Perorangan Mahasiswa (Student Assessment)
CREATE TABLE IF NOT EXISTS public.obe_student_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) REFERENCES public.obe_courses(course_code) ON DELETE CASCADE,
    prodi_id VARCHAR(50) DEFAULT '54242',
    nim VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    unit_class VARCHAR(100) NOT NULL DEFAULT 'Unit 01',
    component_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    final_score NUMERIC(5,2),
    is_passed_obe BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_course_student UNIQUE (course_code, nim)
);
ALTER TABLE public.obe_student_grades ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50) DEFAULT '54242';

-- 6. Tabel Riwayat & Rekomendasi CQI (Continuous Quality Improvement)
CREATE TABLE IF NOT EXISTS public.obe_continuous_improvement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) REFERENCES public.obe_courses(course_code) ON DELETE CASCADE,
    prodi_id VARCHAR(50) DEFAULT '54242',
    academic_year VARCHAR(50) NOT NULL,
    model_penilaian_notes TEXT,
    cpmk_analysis_notes TEXT,
    cpl_analysis_notes TEXT,
    cqi_recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.obe_continuous_improvement ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50) DEFAULT '54242';

-- 7. Tabel Log Audit Auditor Mutu Internal (GJM & Auditor AMI)
CREATE TABLE IF NOT EXISTS public.obe_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    study_program VARCHAR(150),
    prodi_id VARCHAR(50) DEFAULT '54242',
    faculty_id VARCHAR(150) DEFAULT 'Fakultas Perikanan dan Ilmu Kelautan',
    academic_year VARCHAR(50),
    auditor_name VARCHAR(150) NOT NULL,
    auditor_nip VARCHAR(100),
    audited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    overall_conclusion VARCHAR(100) NOT NULL,
    overall_notes TEXT,
    stage_logs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.obe_audit_logs ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50) DEFAULT '54242';
ALTER TABLE public.obe_audit_logs ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(150) DEFAULT 'Fakultas Perikanan dan Ilmu Kelautan';

-- 8. Membuat Indeks untuk Kecepatan Query Asesmen & Filter Multi-Tenant
CREATE INDEX IF NOT EXISTS idx_obe_courses_code ON public.obe_courses(course_code);
CREATE INDEX IF NOT EXISTS idx_obe_courses_prodi ON public.obe_courses(prodi_id);
CREATE INDEX IF NOT EXISTS idx_obe_courses_faculty ON public.obe_courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_obe_grades_course_nim ON public.obe_student_grades(course_code, nim);
CREATE INDEX IF NOT EXISTS idx_obe_cpmks_course ON public.obe_cpmks(course_code);
CREATE INDEX IF NOT EXISTS idx_obe_audit_course ON public.obe_audit_logs(course_code);
CREATE INDEX IF NOT EXISTS idx_obe_audit_prodi ON public.obe_audit_logs(prodi_id);
CREATE INDEX IF NOT EXISTS idx_obe_audit_faculty ON public.obe_audit_logs(faculty_id);

-- 9. Mengaktifkan Row Level Security (RLS) di Semua Tabel
ALTER TABLE public.obe_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obe_cpls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obe_cpmks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obe_student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obe_continuous_improvement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obe_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Kebijakan Row Level Security (RLS) Multi-Tenancy Terisolasi:
--
-- [OPSI A: Default Fleksibel untuk Aplikasi Web Klien Terbuka]
-- Memungkinkan klien anon/authenticated membaca & menyimpan data dengan isolasi
-- berdasarkan filter kolom 'prodi_id' & 'faculty_id'.

DROP POLICY IF EXISTS "Allow Multi-Tenant Read on obe_courses" ON public.obe_courses;
CREATE POLICY "Allow Multi-Tenant Read on obe_courses" ON public.obe_courses
    FOR SELECT TO anon, authenticated
    USING (
        -- Jika menggunakan session header/JWT Supabase Auth:
        -- (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
        -- prodi_id = (auth.jwt() -> 'app_metadata' ->> 'prodi_id') OR
        -- faculty_id = (auth.jwt() -> 'app_metadata' ->> 'faculty_id') OR
        true -- Aktifkan filter query klien .eq('prodi_id', ...)
    );

DROP POLICY IF EXISTS "Allow Multi-Tenant Insert/Update on obe_courses" ON public.obe_courses;
CREATE POLICY "Allow Multi-Tenant Insert/Update on obe_courses" ON public.obe_courses
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policy untuk tabel pendukung asesmen
DROP POLICY IF EXISTS "Allow All on obe_cpls" ON public.obe_cpls;
CREATE POLICY "Allow All on obe_cpls" ON public.obe_cpls FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All on obe_cpmks" ON public.obe_cpmks;
CREATE POLICY "Allow All on obe_cpmks" ON public.obe_cpmks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All on obe_student_grades" ON public.obe_student_grades;
CREATE POLICY "Allow All on obe_student_grades" ON public.obe_student_grades FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All on obe_continuous_improvement" ON public.obe_continuous_improvement;
CREATE POLICY "Allow All on obe_continuous_improvement" ON public.obe_continuous_improvement FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All on obe_audit_logs" ON public.obe_audit_logs;
CREATE POLICY "Allow All on obe_audit_logs" ON public.obe_audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- [OPSI B: KEBIJAKAN RLS KETAT BERBASIS ROLE & JWT USER SUPABASE AUTH]
-- Jika Anda mengaktifkan Supabase Auth (Email/SAML/SSO), aktifkan blok berikut:
-- --------------------------------------------------------------------
/*
-- 1. Tabel Profil Hak Akses Pengguna & Scope Prodi
CREATE TABLE IF NOT EXISTS public.user_tenant_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'kaprodi', 'dosen', 'gjm', 'admin'
    prodi_id VARCHAR(50),      -- e.g. '54201' (S1 Agribisnis), '54242' (BDP)
    faculty_id VARCHAR(150),  -- e.g. 'Fakultas Perikanan dan Ilmu Kelautan'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Kebijakan Isolasi Data Prodi: Kaprodi & Dosen hanya bisa melihat prodi masing-masing
CREATE POLICY "Strict Tenant Isolation: Courses by Prodi" ON public.obe_courses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_assignments u
            WHERE u.user_id = auth.uid()
            AND (
                u.role = 'admin' -- Admin Pusat melihat seluruh prodi
                OR (u.role IN ('kaprodi', 'dosen') AND u.prodi_id = public.obe_courses.prodi_id)
                OR (u.role = 'gjm' AND u.faculty_id = public.obe_courses.faculty_id)
            )
        )
    );
*/

-- Skrip Selesai! Multi-tenancy database siap digunakan oleh seluruh prodi & fakultas.
`;

export interface SupabaseStepGuide {
  step: number;
  title: string;
  shortDesc: string;
  details: string[];
  tips?: string;
  codeSnippet?: string;
}

export const SUPABASE_SETUP_STEPS: SupabaseStepGuide[] = [
  {
    step: 1,
    title: 'Pendaftaran Akun & Pembuatan Project Baru di Supabase',
    shortDesc: 'Membuat instance cloud PostgreSQL gratis di platform Supabase.',
    details: [
      'Buka browser dan kunjungi https://supabase.com lalu klik "Start your project" atau "Sign In" menggunakan akun GitHub / Google Anda.',
      'Di halaman Dashboard, klik tombol "+ New Project".',
      'Pilih Organization Anda, lalu isi nama proyek misalnya: "obe-assessment-audit" atau nama program studi Anda.',
      'Buat Password Database yang kuat dan simpan di tempat aman.',
      'Pilih Region server yang paling dekat dengan lokasi Anda (misalnya Singapore [ap-southeast-1] atau Jakarta jika tersedia) untuk latensi tercepat.',
      'Klik tombol "Create new project" dan tunggu sekitar 1-2 menit hingga status database menjadi "Active".',
    ],
    tips: 'Supabase Free Tier menyediakan 2 database PostgreSQL gratis tanpa kartu kredit dengan storage hingga 500 MB, sangat cukup untuk ratusan mata kuliah dan ribuan data nilai mahasiswa.',
  },
  {
    step: 2,
    title: 'Mendapatkan Kredensial API (Project URL & Anon Key)',
    shortDesc: 'Menyalin endpoint URL dan Public Key untuk dihubungkan ke aplikasi OBE.',
    details: [
      'Di dashboard project Supabase Anda, klik ikon gigi roda (Project Settings) di pojok kiri bawah menu samping.',
      'Pilih sub-menu "API" (di bawah tab Configuration).',
      'Pada bagian "Project URL", klik tombol salin (Copy) pada URL API. Formatnya seperti: https://abcdefghijklm.supabase.co',
      'Pada bagian "Project API Keys", temukan baris "anon / public". Klik tombol salin (Copy) pada token kunci tersebut (dimulai dengan eyJhbGciOi...).',
      'Kredensial inilah yang akan dimasukkan ke panel pengaturan Admin di aplikasi ini.',
    ],
    tips: 'Kunci `anon` (public) aman digunakan langsung pada sisi frontend browser karena pembatasan akses data telah dikendalikan oleh Row Level Security (RLS). Jangan membagikan kunci `service_role` kepada publik.',
  },
  {
    step: 3,
    title: 'Mengeksekusi Skrip SQL DDL di SQL Editor Supabase',
    shortDesc: 'Membuat skema tabel mata kuliah, CPL, CPMK, nilai mahasiswa, dan riwayat CQI secara otomatis.',
    details: [
      'Pada menu navigasi samping kiri dashboard Supabase, klik ikon "SQL Editor" (ikon terminal / SQL).',
      'Klik tombol "+ New query" di bagian atas untuk membuka tab editor baru.',
      'Beri nama query misalnya: "01_Init_OBE_Assessment_Schema".',
      'Salin (Copy) seluruh skrip SQL DDL yang telah kami sediakan di tombol "Salin Seluruh Skrip SQL DDL" di bawah ini.',
      'Tempelkan (Paste) skrip SQL tersebut ke dalam SQL Editor Supabase.',
      'Klik tombol hijau "Run" (atau tekan Ctrl+Enter / Cmd+Enter) di pojok kanan bawah editor.',
      'Pastikan muncul notifikasi "Success. No rows returned" di konsol Supabase.',
    ],
    tips: 'Skrip kami secara otomatis membuat tabel `obe_courses`, `obe_cpls`, `obe_cpmks`, `obe_student_grades`, dan `obe_continuous_improvement` lengkap dengan indeks dan relasi foreign key.',
  },
  {
    step: 4,
    title: 'Verifikasi Row Level Security (RLS) & Kebijakan Akses',
    shortDesc: 'Memastikan izin membaca dan menyimpan data aktif tanpa hambatan.',
    details: [
      'Skrip SQL yang Anda jalankan pada Tahap 3 sudah otomatis menyertakan perintah kebijakan (Policies) untuk mengizinkan akses simpan dan baca bagi peran `anon` dan `authenticated`.',
      'Untuk memverifikasi, klik menu "Table Editor" di sidebar Supabase.',
      'Klik tabel `obe_courses` dan perhatikan label RLS di bagian atas yang berstatus "RLS enabled" dengan policy aktif.',
      'Jika Anda ingin mengunci akses hanya untuk dosen yang login di masa depan, Anda dapat menyesuaikan policy pada menu Authentication > Policies.',
    ],
    tips: 'Jika saat uji koneksi muncul error 401 atau 403, pastikan policy "Allow Public Read/Write Access" pada skrip SQL sudah dieksekusi dengan sukses.',
  },
  {
    step: 5,
    title: 'Konfigurasi & Uji Koneksi di Panel Admin Aplikasi OBE',
    shortDesc: 'Memasukkan kredensial dan melakukan sinkronisasi database 2 arah.',
    details: [
      'Buka aplikasi OBE ini, pastikan Role Pengguna di bagian atas dipilih sebagai "Admin Sistem".',
      'Klik tombol "Koneksi Supabase" atau buka modal Pengaturan API Supabase.',
      'Tempelkan "Project URL" dan "Anon Public Key" yang Anda dapatkan dari Tahap 2 ke kolom input formulir.',
      'Klik tombol "Uji Koneksi Langsung".',
      'Sistem akan melakukan ping HTTP REST API secara real-time ke Supabase Anda dan menampilkan indikator hijau serta kecepatan latensi jaringan (ms).',
      'Klik tombol "Simpan Konfigurasi" untuk menyimpan pengaturan di browser Anda.',
      'Sekarang Anda dapat mengklik "Sinkronkan Data Saat Ini ke Supabase" untuk mengunggah data mata kuliah aktif, atau "Tarik Data dari Supabase" kapan saja!',
    ],
    tips: 'Koneksi tersimpan di media penyimpanan browser Anda sehingga Anda tidak perlu memasukkannya berulang kali saat membuka aplikasi.',
  },
  {
    step: 6,
    title: 'Implementasi Multi-Tenancy & Row Level Security (RLS) Antar-Prodi & Fakultas',
    shortDesc: 'Panduan lengkap mengisolasi data per prodi/fakultas sehingga setiap tenant hanya melihat datanya sendiri.',
    details: [
      'Arsitektur Multi-Tenancy 3-Lapis (Three-Tier Multi-Tenancy):',
      '1. Lapis 1 (Direct Portal Locking): Gunakan URL terpersonalisasi untuk masing-masing prodi/fakultas (misal: ?prodi=54201 untuk S1 Agribisnis, ?prodi=54231 untuk S1 MSP, ?fakultas=Fakultas%20Perikanan%20dan%20Ilmu%20Kelautan untuk FPIK, atau ?jenjang=s2 untuk Pascasarjana). URL ini mengunci dropdown dan sesi pengguna secara otomatis.',
      '2. Lapis 2 (Database Schema Scope): Setiap tabel database (obe_courses, obe_audit_logs, dll.) memiliki kolom prodi_id dan faculty_id. Seluruh query simpan dan muat otomatis menyertakan filter prodi_id sesuai session scope pengguna aktif.',
      '3. Lapis 3 (Row Level Security Supabase): Mengaktifkan kebijakan RLS di level mesin PostgreSQL sehingga permintaan REST API dari klien secara otomatis dibatasi hanya pada prodi_id dan faculty_id yang diizinkan.',
      'Untuk mengaktifkan RLS Ketat berbasis Supabase Auth, jalankan blok script SQL [OPSI B] pada skrip DDL, lalu tetapkan role dan prodi_id pada tabel user_tenant_assignments atau custom claims auth.jwt().',
    ],
    tips: 'Gunakan RLS untuk memastikan data program studi terisolasi secara mutlak di tingkat engine PostgreSQL database.',
  },
  {
    step: 7,
    title: 'Migrasi Skema Database Lama ke Struktur Multi-Tenancy (prodi_id & faculty_id)',
    shortDesc: 'Panduan langkah-demi-langkah mengubah tabel database lama dan melakukan backfill data.',
    details: [
      'Langkah 1 (ALTER TABLE): Menambahkan kolom prodi_id VARCHAR(50) dan faculty_id VARCHAR(150) pada tabel obe_courses, obe_audit_logs, obe_student_grades, obe_cpls, obe_cpmks, dan obe_continuous_improvement.',
      'Langkah 2 (Backfill Data Lama): Menjalankan query UPDATE massal untuk mengisi prodi_id dan faculty_id pada baris data lama yang masih kosong (berdasarkan study_program, course_code, atau data_payload).',
      'Langkah 3 (Foreign Key & Constraint): Mengisi nilai default dan menetapkan NOT NULL agar integritas multi-tenant terjamin.',
      'Langkah 4 (Indexing): Menambahkan index B-Tree pada kolom prodi_id dan faculty_id di seluruh tabel agar query berkecepatan tinggi.',
      'Langkah 5 (Verifikasi): Jalankan SELECT course_code, study_program, prodi_id, faculty_id FROM obe_courses untuk memastikan seluruh data telah terisolasi per tenant.',
    ],
    tips: 'Jalankan skrip migrasi yang telah disediakan di bawah ini melalui menu SQL Editor di dashboard Supabase.',
  },
];

export const DATABASE_MIGRATION_SQL_SNIPPET = `-- ====================================================================
-- SKRIP MIGRASI LENGKAP: DATABASE OBE KE ARSITEKTUR MULTI-TENANT
-- Standar Pemisahan Data Per Program Studi & Fakultas (Universitas Pattimura)
-- Jalankan skrip ini langsung di SQL Editor Supabase
-- ====================================================================

-- TAHAP 1: Menambahkan kolom prodi_id dan faculty_id di semua tabel
ALTER TABLE public.obe_courses ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50);
ALTER TABLE public.obe_courses ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(150);

ALTER TABLE public.obe_audit_logs ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50);
ALTER TABLE public.obe_audit_logs ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(150);

ALTER TABLE public.obe_student_grades ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50);
ALTER TABLE public.obe_cpls ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50);
ALTER TABLE public.obe_cpmks ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50);
ALTER TABLE public.obe_continuous_improvement ADD COLUMN IF NOT EXISTS prodi_id VARCHAR(50);

-- TAHAP 2: Backfill / Pembaruan Data Lama ke Kolom Multi-Tenant
-- Petakan otomatis berdasarkan nama prodi / kode mata kuliah yang sudah ada
UPDATE public.obe_courses
SET 
  prodi_id = CASE
    WHEN study_program ILIKE '%Administrasi Pendidikan%' THEN '86004'
    WHEN study_program ILIKE '%Budidaya Perairan%' OR course_code ILIKE 'BDP%' THEN '54242'
    WHEN study_program ILIKE '%Agribisnis%' AND study_program NOT ILIKE '%Perikanan%' THEN '54201'
    WHEN study_program ILIKE '%Manajemen Sumberdaya Perairan%' OR course_code ILIKE 'MSP%' THEN '54241'
    WHEN study_program ILIKE '%Teknik Informatika%' OR course_code ILIKE 'INF%' THEN '55201'
    WHEN study_program ILIKE '%Ilmu Kelautan%' THEN '54246'
    WHEN (data_payload->>'prodiId') IS NOT NULL AND (data_payload->>'prodiId') != '' THEN (data_payload->>'prodiId')
    ELSE '54242'
  END,
  faculty_id = CASE
    WHEN study_program ILIKE '%Administrasi Pendidikan%' THEN 'Program Pascasarjana'
    WHEN study_program ILIKE '%Agribisnis%' THEN 'Fakultas Pertanian'
    WHEN study_program ILIKE '%Teknik%' THEN 'Fakultas Teknik'
    ELSE COALESCE(faculty, 'Fakultas Perikanan dan Ilmu Kelautan')
  END
WHERE prodi_id IS NULL OR prodi_id = '';

-- Backfill data child tables (obe_audit_logs, obe_student_grades) dari tabel obe_courses
UPDATE public.obe_audit_logs l
SET 
  prodi_id = COALESCE(c.prodi_id, '54242'),
  faculty_id = COALESCE(c.faculty_id, 'Fakultas Perikanan dan Ilmu Kelautan')
FROM public.obe_courses c
WHERE l.course_code = c.course_code AND (l.prodi_id IS NULL OR l.prodi_id = '');

UPDATE public.obe_student_grades g
SET prodi_id = COALESCE(c.prodi_id, '54242')
FROM public.obe_courses c
WHERE g.course_code = c.course_code AND (g.prodi_id IS NULL OR g.prodi_id = '');

UPDATE public.obe_cpls cp
SET prodi_id = COALESCE(c.prodi_id, '54242')
FROM public.obe_courses c
WHERE cp.course_code = c.course_code AND (cp.prodi_id IS NULL OR cp.prodi_id = '');

UPDATE public.obe_cpmks cm
SET prodi_id = COALESCE(c.prodi_id, '54242')
FROM public.obe_courses c
WHERE cm.course_code = c.course_code AND (cm.prodi_id IS NULL OR cm.prodi_id = '');

-- TAHAP 3: Kunci kolom dengan default dan NOT NULL
ALTER TABLE public.obe_courses ALTER COLUMN prodi_id SET DEFAULT '54242';
ALTER TABLE public.obe_courses ALTER COLUMN prodi_id SET NOT NULL;
ALTER TABLE public.obe_courses ALTER COLUMN faculty_id SET DEFAULT 'Fakultas Perikanan dan Ilmu Kelautan';
ALTER TABLE public.obe_courses ALTER COLUMN faculty_id SET NOT NULL;

-- TAHAP 4: Tambahkan Indeks Pencarian Cepat Multi-Tenant
CREATE INDEX IF NOT EXISTS idx_obe_courses_prodi ON public.obe_courses(prodi_id);
CREATE INDEX IF NOT EXISTS idx_obe_courses_faculty ON public.obe_courses(faculty_id);
CREATE INDEX IF NOT EXISTS idx_obe_audit_prodi ON public.obe_audit_logs(prodi_id);
CREATE INDEX IF NOT EXISTS idx_obe_audit_faculty ON public.obe_audit_logs(faculty_id);
CREATE INDEX IF NOT EXISTS idx_obe_grades_prodi ON public.obe_student_grades(prodi_id);

-- TAHAP 5: Verifikasi Hasil Migrasi
-- Jalankan query ini untuk memastikan semua baris telah memiliki prodi_id:
-- SELECT course_code, course_name, study_program, prodi_id, faculty_id FROM public.obe_courses LIMIT 10;
`;

export const MULTI_TENANT_RLS_SQL_SNIPPET = `-- ====================================================================
-- SKRIP ROW LEVEL SECURITY (RLS) UNTUK ISOLASI MULTI-TENANT PER PRODI
-- ====================================================================

-- 1. Buat Tabel Assignment Tenant Pengguna (User -> Prodi/Fakultas)
CREATE TABLE IF NOT EXISTS public.user_tenant_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'kaprodi', 'dosen', 'gjm', 'admin'
    prodi_id VARCHAR(50),      -- '54201' (Agribisnis), '54231' (MSP), '54242' (BDP), '86004' (S3 Admin Pendidikan), dll.
    faculty_id VARCHAR(150),  -- 'Fakultas Pertanian', 'Fakultas Perikanan dan Ilmu Kelautan', dll.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Aktifkan RLS pada Tabel Tenant Assignment
ALTER TABLE public.user_tenant_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own assignment" ON public.user_tenant_assignments
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Kebijakan RLS Isolasi Mata Kuliah (obe_courses):
-- Kaprodi & Dosen hanya bisa melihat mata kuliah di prodinya sendiri
-- GJM dapat melihat semua mata kuliah di fakultas yang ditugaskan
-- Admin IT Pusat dapat melihat seluruh data universitas
DROP POLICY IF EXISTS "Strict Multi-Tenant Course Isolation" ON public.obe_courses;
CREATE POLICY "Strict Multi-Tenant Course Isolation" ON public.obe_courses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_assignments u
            WHERE u.user_id = auth.uid()
            AND (
                u.role = 'admin'
                OR (u.role IN ('kaprodi', 'dosen') AND u.prodi_id = public.obe_courses.prodi_id)
                OR (u.role = 'gjm' AND u.faculty_id = public.obe_courses.faculty_id)
            )
        )
    );

-- 4. Kebijakan RLS Penyimpanan Data (INSERT & UPDATE)
DROP POLICY IF EXISTS "Strict Multi-Tenant Course Mutation" ON public.obe_courses;
CREATE POLICY "Strict Multi-Tenant Course Mutation" ON public.obe_courses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_assignments u
            WHERE u.user_id = auth.uid()
            AND (
                u.role = 'admin'
                OR (u.role IN ('kaprodi', 'dosen') AND u.prodi_id = public.obe_courses.prodi_id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_tenant_assignments u
            WHERE u.user_id = auth.uid()
            AND (
                u.role = 'admin'
                OR (u.role IN ('kaprodi', 'dosen') AND u.prodi_id = public.obe_courses.prodi_id)
            )
        )
    );

-- 5. Kebijakan RLS Log Audit (obe_audit_logs):
-- Kaprodi hanya melihat audit prodinya, GJM melihat audit fakultasnya
DROP POLICY IF EXISTS "Strict Multi-Tenant Audit Isolation" ON public.obe_audit_logs;
CREATE POLICY "Strict Multi-Tenant Audit Isolation" ON public.obe_audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_assignments u
            WHERE u.user_id = auth.uid()
            AND (
                u.role = 'admin'
                OR (u.role = 'kaprodi' AND u.prodi_id = public.obe_audit_logs.prodi_id)
                OR (u.role = 'gjm' AND u.faculty_id = public.obe_audit_logs.faculty_id)
            )
        )
    );
`;
