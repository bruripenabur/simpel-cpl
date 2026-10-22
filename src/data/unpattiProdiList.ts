export interface UnpattiProdi {
  kode: string;
  nama: string;
  jenjang: 'S1' | 'S2' | 'S3' | 'Profesi' | 'Sp-1';
  semester: number;
  fakultas: string;
  fakultasShort: string;
  kaprodi: string;
  colorScheme: 'cyan' | 'purple' | 'blue' | 'green' | 'amber' | 'rose' | 'indigo';
}

export const UNPATTI_FAKULTAS_LIST = [
  'Semua Fakultas & Pascasarjana / PSDKU (12)',
  'Fakultas Perikanan dan Ilmu Kelautan',
  'Fakultas Pertanian',
  'Fakultas Keguruan dan Ilmu Pendidikan',
  'Fakultas Ilmu Sosial dan Ilmu Politik',
  'Fakultas Ekonomi dan Bisnis',
  'Fakultas Hukum',
  'Fakultas Teknik',
  'Fakultas Kedokteran',
  'Fakultas Sains dan Teknologi',
  'Program Pascasarjana',
  'PSDKU Kab. Kepulauan Aru',
  'PSDKU Kab. Maluku Barat Daya',
];

export const UNPATTI_PRODI_117: UnpattiProdi[] = [
  {
    "kode": "86004",
    "nama": "S3 Administrasi Pendidikan",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Administrasi Pendidikan",
    "colorScheme": "cyan"
  },
  {
    "kode": "86204",
    "nama": "S1 Administrasi Pendidikan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Administrasi Pendidikan",
    "colorScheme": "purple"
  },
  {
    "kode": "63002",
    "nama": "S3 Administrasi Publik",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Administrasi Publik",
    "colorScheme": "cyan"
  },
  {
    "kode": "63101",
    "nama": "S2 Administrasi Publik",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Administrasi Publik",
    "colorScheme": "blue"
  },
  {
    "kode": "54201",
    "nama": "S1 Agribisnis",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Agribisnis",
    "colorScheme": "green"
  },
  {
    "kode": "54245",
    "nama": "S1 Agrobisnis Perikanan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Perikanan dan Ilmu Kelautan",
    "fakultasShort": "FPIK",
    "kaprodi": "Kaprodi S1 Agrobisnis Perikanan",
    "colorScheme": "cyan"
  },
  {
    "kode": "54211",
    "nama": "S1 Agroteknologi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Agroteknologi",
    "colorScheme": "green"
  },
  {
    "kode": "62201",
    "nama": "S1 Akuntansi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ekonomi dan Bisnis",
    "fakultasShort": "FEB",
    "kaprodi": "Kaprodi S1 Akuntansi",
    "colorScheme": "amber"
  },
  {
    "kode": "62207",
    "nama": "S1 Akuntansi (Kampus Kab. Kep. Aru)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Kepulauan Aru",
    "fakultasShort": "PSDKU KAB. KEP. ARU",
    "kaprodi": "Kaprodi S1 Akuntansi (Kampus Kab. Kep. Aru)",
    "colorScheme": "purple"
  },
  {
    "kode": "62206",
    "nama": "S1 Akuntansi (Kampus Kab. MBD)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Maluku Barat Daya",
    "fakultasShort": "PSDKU KAB. MBD",
    "kaprodi": "Kaprodi S1 Akuntansi (Kampus Kab. MBD)",
    "colorScheme": "amber"
  },
  {
    "kode": "11707",
    "nama": "Sp-1 Bedah",
    "jenjang": "Sp-1",
    "semester": 8,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi Sp-1 Bedah",
    "colorScheme": "rose"
  },
  {
    "kode": "86201",
    "nama": "S1 Bimbingan Dan Konseling",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Bimbingan Dan Konseling",
    "colorScheme": "purple"
  },
  {
    "kode": "54207",
    "nama": "S1 Bioteknologi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi S1 Bioteknologi",
    "colorScheme": "rose"
  },
  {
    "kode": "54243",
    "nama": "S1 Budidaya Perairan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Perikanan dan Ilmu Kelautan",
    "fakultasShort": "FPIK",
    "kaprodi": "Kaprodi S1 Budidaya Perairan",
    "colorScheme": "cyan"
  },
  {
    "kode": "60201",
    "nama": "S1 Ekonomi Pembangunan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ekonomi dan Bisnis",
    "fakultasShort": "FEB",
    "kaprodi": "Kaprodi S1 Ekonomi Pembangunan",
    "colorScheme": "amber"
  },
  {
    "kode": "63102",
    "nama": "S2 Ekonomi Terapan",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Ekonomi Terapan",
    "colorScheme": "blue"
  },
  {
    "kode": "48201",
    "nama": "S1 Farmasi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Farmasi",
    "colorScheme": "indigo"
  },
  {
    "kode": "45201",
    "nama": "S1 Fisika",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Fisika",
    "colorScheme": "indigo"
  },
  {
    "kode": "13211",
    "nama": "S1 Gizi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Gizi",
    "colorScheme": "indigo"
  },
  {
    "kode": "74204",
    "nama": "S1 Hukum (Kampus Kab. Kep. Aru)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Kepulauan Aru",
    "fakultasShort": "PSDKU KAB. KEP. ARU",
    "kaprodi": "Kaprodi S1 Hukum (Kampus Kab. Kep. Aru)",
    "colorScheme": "purple"
  },
  {
    "kode": "74203",
    "nama": "S1 Hukum (Kampus Kab. MBD)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Maluku Barat Daya",
    "fakultasShort": "PSDKU KAB. MBD",
    "kaprodi": "Kaprodi S1 Hukum (Kampus Kab. MBD)",
    "colorScheme": "amber"
  },
  {
    "kode": "63201",
    "nama": "S1 Ilmu Administrasi Negara",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ilmu Sosial dan Ilmu Politik",
    "fakultasShort": "FISIP",
    "kaprodi": "Kaprodi S1 Ilmu Administrasi Negara",
    "colorScheme": "purple"
  },
  {
    "kode": "60101",
    "nama": "S2 Ilmu Ekonomi",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Ilmu Ekonomi",
    "colorScheme": "blue"
  },
  {
    "kode": "74001",
    "nama": "S3 Ilmu Hukum",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Ilmu Hukum",
    "colorScheme": "cyan"
  },
  {
    "kode": "74101",
    "nama": "S2 Ilmu Hukum",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Ilmu Hukum",
    "colorScheme": "blue"
  },
  {
    "kode": "74201",
    "nama": "S1 Ilmu Hukum",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Hukum",
    "fakultasShort": "FH",
    "kaprodi": "Kaprodi S1 Ilmu Hukum",
    "colorScheme": "rose"
  },
  {
    "kode": "54041",
    "nama": "S3 Ilmu Kelautan",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Ilmu Kelautan",
    "colorScheme": "cyan"
  },
  {
    "kode": "54141",
    "nama": "S2 Ilmu Kelautan",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Ilmu Kelautan",
    "colorScheme": "blue"
  },
  {
    "kode": "54241",
    "nama": "S1 Ilmu Kelautan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Perikanan dan Ilmu Kelautan",
    "fakultasShort": "FPIK",
    "kaprodi": "Kaprodi S1 Ilmu Kelautan",
    "colorScheme": "cyan"
  },
  {
    "kode": "55201",
    "nama": "S1 Ilmu Komputer",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Ilmu Komputer",
    "colorScheme": "indigo"
  },
  {
    "kode": "70201",
    "nama": "S1 Ilmu Komunikasi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ilmu Sosial dan Ilmu Politik",
    "fakultasShort": "FISIP",
    "kaprodi": "Kaprodi S1 Ilmu Komunikasi",
    "colorScheme": "purple"
  },
  {
    "kode": "25201",
    "nama": "S1 Ilmu Lingkungan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Ilmu Lingkungan",
    "colorScheme": "green"
  },
  {
    "kode": "61001",
    "nama": "S3 Ilmu Manajemen",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Ilmu Manajemen",
    "colorScheme": "cyan"
  },
  {
    "kode": "65201",
    "nama": "S1 Ilmu Pemerintahan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ilmu Sosial dan Ilmu Politik",
    "fakultasShort": "FISIP",
    "kaprodi": "Kaprodi S1 Ilmu Pemerintahan",
    "colorScheme": "purple"
  },
  {
    "kode": "11766",
    "nama": "Sp-1 Ilmu Penyakit Dalam",
    "jenjang": "Sp-1",
    "semester": 8,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi Sp-1 Ilmu Penyakit Dalam",
    "colorScheme": "rose"
  },
  {
    "kode": "54001",
    "nama": "S3 Ilmu Pertanian",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Ilmu Pertanian",
    "colorScheme": "cyan"
  },
  {
    "kode": "54108",
    "nama": "S2 Ilmu Pertanian",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Ilmu Pertanian",
    "colorScheme": "blue"
  },
  {
    "kode": "54294",
    "nama": "S1 Ilmu Tanah",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Ilmu Tanah",
    "colorScheme": "green"
  },
  {
    "kode": "12201",
    "nama": "S1 Kedokteran Gigi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi S1 Kedokteran Gigi",
    "colorScheme": "rose"
  },
  {
    "kode": "13242",
    "nama": "S1 Keselamatan dan Kesehatan Kerja",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Keselamatan dan Kesehatan Kerja",
    "colorScheme": "indigo"
  },
  {
    "kode": "94202",
    "nama": "S1 Kewirausahaan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ekonomi dan Bisnis",
    "fakultasShort": "FEB",
    "kaprodi": "Kaprodi S1 Kewirausahaan",
    "colorScheme": "amber"
  },
  {
    "kode": "47102",
    "nama": "S2 Kimia",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Kimia",
    "colorScheme": "blue"
  },
  {
    "kode": "54151",
    "nama": "S2 Manajemen Hutan",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Manajemen Hutan",
    "colorScheme": "blue"
  },
  {
    "kode": "86131",
    "nama": "S2 Manajemen Pendidikan",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Manajemen Pendidikan",
    "colorScheme": "blue"
  },
  {
    "kode": "54242",
    "nama": "S1 Manajemen Sumber Daya Perairan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Perikanan dan Ilmu Kelautan",
    "fakultasShort": "FPIK",
    "kaprodi": "Kaprodi S1 Manajemen Sumber Daya Perairan",
    "colorScheme": "cyan"
  },
  {
    "kode": "54145",
    "nama": "S2 Manajemen Sumberdaya Kelautan dan Pulau-pulau Kecil",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Manajemen Sumberdaya Kelautan dan Pulau-pulau Kecil",
    "colorScheme": "blue"
  },
  {
    "kode": "11716",
    "nama": "Sp-1 Obstetri dan Ginekologi",
    "jenjang": "Sp-1",
    "semester": 8,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi Sp-1 Obstetri dan Ginekologi",
    "colorScheme": "rose"
  },
  {
    "kode": "38201",
    "nama": "S1 Oseanografi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Perikanan dan Ilmu Kelautan",
    "fakultasShort": "FPIK",
    "kaprodi": "Kaprodi S1 Oseanografi",
    "colorScheme": "cyan"
  },
  {
    "kode": "54246",
    "nama": "S1 Pemanfaatan Sumber Daya Perikanan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Perikanan dan Ilmu Kelautan",
    "fakultasShort": "FPIK",
    "kaprodi": "Kaprodi S1 Pemanfaatan Sumber Daya Perikanan",
    "colorScheme": "cyan"
  },
  {
    "kode": "86228",
    "nama": "S1 Pembangunan Sosial",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ilmu Sosial dan Ilmu Politik",
    "fakultasShort": "FISIP",
    "kaprodi": "Kaprodi S1 Pembangunan Sosial",
    "colorScheme": "purple"
  },
  {
    "kode": "54293",
    "nama": "S1 Pemuliaan Tanaman",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Pemuliaan Tanaman",
    "colorScheme": "green"
  },
  {
    "kode": "86904",
    "nama": "Profesi Pendidikan Guru",
    "jenjang": "Profesi",
    "semester": 2,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi Profesi Pendidikan Guru",
    "colorScheme": "purple"
  },
  {
    "kode": "12902",
    "nama": "Profesi Pendidikan Profesi Dokter Gigi",
    "jenjang": "Profesi",
    "semester": 2,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi Profesi Pendidikan Profesi Dokter Gigi",
    "colorScheme": "rose"
  },
  {
    "kode": "88201",
    "nama": "S1 Pendidikan Bahasa Dan Sastra Indonesia",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Bahasa Dan Sastra Indonesia",
    "colorScheme": "purple"
  },
  {
    "kode": "88103",
    "nama": "S2 Pendidikan Bahasa Inggris",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Pendidikan Bahasa Inggris",
    "colorScheme": "blue"
  },
  {
    "kode": "88203",
    "nama": "S1 Pendidikan Bahasa Inggris",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Bahasa Inggris",
    "colorScheme": "purple"
  },
  {
    "kode": "882032",
    "nama": "S1 Pendidikan Bahasa Inggris (Kampus Kab. Kep. Aru)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Kepulauan Aru",
    "fakultasShort": "PSDKU KAB. KEP. ARU",
    "kaprodi": "Kaprodi S1 Pendidikan Bahasa Inggris (Kampus Kab. Kep. Aru)",
    "colorScheme": "purple"
  },
  {
    "kode": "882031",
    "nama": "S1 Pendidikan Bahasa Inggris (Kampus Kab. MBD)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Maluku Barat Daya",
    "fakultasShort": "PSDKU KAB. MBD",
    "kaprodi": "Kaprodi S1 Pendidikan Bahasa Inggris (Kampus Kab. MBD)",
    "colorScheme": "amber"
  },
  {
    "kode": "88107",
    "nama": "S2 Pendidikan Bahasa Jerman",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Pendidikan Bahasa Jerman",
    "colorScheme": "blue"
  },
  {
    "kode": "84005",
    "nama": "S3 Pendidikan Biologi",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Pendidikan Biologi",
    "colorScheme": "cyan"
  },
  {
    "kode": "84105",
    "nama": "S2 Pendidikan Biologi",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Pendidikan Biologi",
    "colorScheme": "blue"
  },
  {
    "kode": "11201",
    "nama": "S1 Pendidikan Dokter",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi S1 Pendidikan Dokter",
    "colorScheme": "rose"
  },
  {
    "kode": "87203",
    "nama": "S1 Pendidikan Ekonomi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Ekonomi",
    "colorScheme": "purple"
  },
  {
    "kode": "84203",
    "nama": "S1 Pendidikan Fisika",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Fisika",
    "colorScheme": "purple"
  },
  {
    "kode": "87202",
    "nama": "S1 Pendidikan Geografi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Geografi",
    "colorScheme": "purple"
  },
  {
    "kode": "86207",
    "nama": "S1 Pendidikan Guru Pendidikan Anak Usia Dini",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Guru Pendidikan Anak Usia Dini",
    "colorScheme": "purple"
  },
  {
    "kode": "86206",
    "nama": "S1 Pendidikan Guru Sekolah Dasar",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Guru Sekolah Dasar",
    "colorScheme": "purple"
  },
  {
    "kode": "862062",
    "nama": "S1 Pendidikan Guru Sekolah Dasar (kampus Kab. Kep. Aru)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Kepulauan Aru",
    "fakultasShort": "PSDKU KAB. KEP. ARU",
    "kaprodi": "Kaprodi S1 Pendidikan Guru Sekolah Dasar (kampus Kab. Kep. Aru)",
    "colorScheme": "purple"
  },
  {
    "kode": "862061",
    "nama": "S1 Pendidikan Guru Sekolah Dasar (Kampus Kab. MBD)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Maluku Barat Daya",
    "fakultasShort": "PSDKU KAB. MBD",
    "kaprodi": "Kaprodi S1 Pendidikan Guru Sekolah Dasar (Kampus Kab. MBD)",
    "colorScheme": "amber"
  },
  {
    "kode": "852011",
    "nama": "S1 Pendidikan Jasmani (Kampus Kab. Kep. Aru)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Kepulauan Aru",
    "fakultasShort": "PSDKU KAB. KEP. ARU",
    "kaprodi": "Kaprodi S1 Pendidikan Jasmani (Kampus Kab. Kep. Aru)",
    "colorScheme": "purple"
  },
  {
    "kode": "85201",
    "nama": "S1 Pendidikan Jasmani, Kesehatan & Rekreasi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Jasmani, Kesehatan & Rekreasi",
    "colorScheme": "purple"
  },
  {
    "kode": "84204",
    "nama": "S1 Pendidikan Kimia",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Kimia",
    "colorScheme": "purple"
  },
  {
    "kode": "86205",
    "nama": "S1 Pendidikan Luar Sekolah",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Luar Sekolah",
    "colorScheme": "purple"
  },
  {
    "kode": "84002",
    "nama": "S1 Pendidikan Matematika",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Matematika",
    "colorScheme": "purple"
  },
  {
    "kode": "84102",
    "nama": "S2 Pendidikan Matematika",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Pendidikan Matematika",
    "colorScheme": "blue"
  },
  {
    "kode": "84202",
    "nama": "S3 Pendidikan Matematika",
    "jenjang": "S3",
    "semester": 6,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S3 Pendidikan Matematika",
    "colorScheme": "cyan"
  },
  {
    "kode": "842022",
    "nama": "S1 Pendidikan Matematika (Kampus Kab Kep. Aru)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Kepulauan Aru",
    "fakultasShort": "PSDKU KAB. KEP. ARU",
    "kaprodi": "Kaprodi S1 Pendidikan Matematika (Kampus Kab Kep. Aru)",
    "colorScheme": "purple"
  },
  {
    "kode": "842021",
    "nama": "S1 Pendidikan Matematika (Kampus Kab. MBD)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Maluku Barat Daya",
    "fakultasShort": "PSDKU KAB. MBD",
    "kaprodi": "Kaprodi S1 Pendidikan Matematika (Kampus Kab. MBD)",
    "colorScheme": "amber"
  },
  {
    "kode": "87157",
    "nama": "S2 Pendidikan Pancasila dan Kewarganegaraan",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Pendidikan Pancasila dan Kewarganegaraan",
    "colorScheme": "blue"
  },
  {
    "kode": "87205",
    "nama": "S1 Pendidikan Pancasila Dan Kewarganegaraan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Pancasila Dan Kewarganegaraan",
    "colorScheme": "purple"
  },
  {
    "kode": "87201",
    "nama": "S1 Pendidikan Sejarah",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Sejarah",
    "colorScheme": "purple"
  },
  {
    "kode": "54258",
    "nama": "S1 Pengelolaan Hutan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Pengelolaan Hutan",
    "colorScheme": "green"
  },
  {
    "kode": "54105",
    "nama": "S2 Pengelolaan Lahan",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Pengelolaan Lahan",
    "colorScheme": "blue"
  },
  {
    "kode": "54203",
    "nama": "S1 Penyuluhan Pertanian",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Penyuluhan Pertanian",
    "colorScheme": "green"
  },
  {
    "kode": "94205",
    "nama": "S1 Perdagangan Internasional",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ekonomi dan Bisnis",
    "fakultasShort": "FEB",
    "kaprodi": "Kaprodi S1 Perdagangan Internasional",
    "colorScheme": "amber"
  },
  {
    "kode": "35201",
    "nama": "S1 Perencanaan Wilayah dan Kota",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Perencanaan Wilayah dan Kota",
    "colorScheme": "blue"
  },
  {
    "kode": "54231",
    "nama": "S1 Peternakan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Peternakan",
    "colorScheme": "green"
  },
  {
    "kode": "54232",
    "nama": "S1 Peternakan (Kampus Kab. MBD)",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "PSDKU Kab. Maluku Barat Daya",
    "fakultasShort": "PSDKU KAB. MBD",
    "kaprodi": "Kaprodi S1 Peternakan (Kampus Kab. MBD)",
    "colorScheme": "amber"
  },
  {
    "kode": "11901",
    "nama": "Profesi Profesi Dokter",
    "jenjang": "Profesi",
    "semester": 2,
    "fakultas": "Fakultas Kedokteran",
    "fakultasShort": "FK",
    "kaprodi": "Kaprodi Profesi Profesi Dokter",
    "colorScheme": "rose"
  },
  {
    "kode": "21300",
    "nama": "S1 Rekayasa Instrumentasi dan Otomasi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Rekayasa Instrumentasi dan Otomasi",
    "colorScheme": "indigo"
  },
  {
    "kode": "54159",
    "nama": "S2 Rekayasa Kelautan",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Rekayasa Kelautan",
    "colorScheme": "blue"
  },
  {
    "kode": "11312",
    "nama": "S1 Sains Biomedis",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Sains Biomedis",
    "colorScheme": "indigo"
  },
  {
    "kode": "69101",
    "nama": "S1 Sosiologi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Ilmu Sosial dan Ilmu Politik",
    "fakultasShort": "FISIP",
    "kaprodi": "Kaprodi S1 Sosiologi",
    "colorScheme": "purple"
  },
  {
    "kode": "69201",
    "nama": "S2 Sosiologi",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Sosiologi",
    "colorScheme": "blue"
  },
  {
    "kode": "34201",
    "nama": "S1 Teknik Geologi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Geologi",
    "colorScheme": "blue"
  },
  {
    "kode": "26201",
    "nama": "S1 Teknik Industri",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Industri",
    "colorScheme": "blue"
  },
  {
    "kode": "24201",
    "nama": "S1 Teknik Kimia",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Kimia",
    "colorScheme": "blue"
  },
  {
    "kode": "21201",
    "nama": "S1 Teknik Mesin",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Mesin",
    "colorScheme": "blue"
  },
  {
    "kode": "36201",
    "nama": "S1 Teknik Perkapalan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Perkapalan",
    "colorScheme": "blue"
  },
  {
    "kode": "32201",
    "nama": "S1 Teknik Perminyakan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Perminyakan",
    "colorScheme": "blue"
  },
  {
    "kode": "22201",
    "nama": "S1 Teknik Sipil",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Sipil",
    "colorScheme": "blue"
  },
  {
    "kode": "36202",
    "nama": "S1 Teknik Sistem Perkapalan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Sistem Perkapalan",
    "colorScheme": "blue"
  },
  {
    "kode": "21207",
    "nama": "S1 Teknik Transportasi Laut",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Transportasi Laut",
    "colorScheme": "blue"
  },
  {
    "kode": "54244",
    "nama": "S1 Teknologi Hasil Perikanan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Perikanan dan Ilmu Kelautan",
    "fakultasShort": "FPIK",
    "kaprodi": "Kaprodi S1 Teknologi Hasil Perikanan",
    "colorScheme": "cyan"
  },
  {
    "kode": "41231",
    "nama": "S1 Teknologi Hasil Pertanian",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Teknologi Hasil Pertanian",
    "colorScheme": "green"
  },
  {
    "kode": "46201",
    "nama": "S1 Biologi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Biologi",
    "colorScheme": "indigo"
  },
  {
    "kode": "33201",
    "nama": "S1 Teknik Geofisika",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Teknik",
    "fakultasShort": "FATEK",
    "kaprodi": "Kaprodi S1 Teknik Geofisika",
    "colorScheme": "blue"
  },
  {
    "kode": "54101",
    "nama": "S2 Agribisnis",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Agribisnis",
    "colorScheme": "blue"
  },
  {
    "kode": "49201",
    "nama": "S1 Statistika",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Statistika",
    "colorScheme": "indigo"
  },
  {
    "kode": "61201",
    "nama": "S2 Manajemen",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Manajemen",
    "colorScheme": "blue"
  },
  {
    "kode": "88207",
    "nama": "S1 Pendidikan Bahasa Jerman",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Bahasa Jerman",
    "colorScheme": "purple"
  },
  {
    "kode": "47201",
    "nama": "S1 Kimia",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Kimia",
    "colorScheme": "indigo"
  },
  {
    "kode": "54251",
    "nama": "S1 Kehutanan",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Pertanian",
    "fakultasShort": "FAPERTA",
    "kaprodi": "Kaprodi S1 Kehutanan",
    "colorScheme": "green"
  },
  {
    "kode": "84205",
    "nama": "S1 Pendidikan Biologi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Biologi",
    "colorScheme": "purple"
  },
  {
    "kode": "87209",
    "nama": "S1 Pendidikan Akuntansi",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Keguruan dan Ilmu Pendidikan",
    "fakultasShort": "FKIP",
    "kaprodi": "Kaprodi S1 Pendidikan Akuntansi",
    "colorScheme": "purple"
  },
  {
    "kode": "44201",
    "nama": "S1 Matematika",
    "jenjang": "S1",
    "semester": 8,
    "fakultas": "Fakultas Sains dan Teknologi",
    "fakultasShort": "FST",
    "kaprodi": "Kaprodi S1 Matematika",
    "colorScheme": "indigo"
  },
  {
    "kode": "62101",
    "nama": "S2 Ilmu Akuntansi",
    "jenjang": "S2",
    "semester": 4,
    "fakultas": "Program Pascasarjana",
    "fakultasShort": "Pascasarjana",
    "kaprodi": "Kaprodi S2 Ilmu Akuntansi",
    "colorScheme": "blue"
  }
];
