/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { OBEAssessmentData } from './types/obe';
import { sampleCourses, createEmptyCourse } from './data/sampleCourses';
import {
  calculateAssessmentResults,
  calculateStudentIndividualAchievements,
} from './utils/calculator';
import { NavigationHeader, UserRole } from './components/NavigationHeader';
import { InstructionGuide } from './components/InstructionGuide';
import { VisualCharts } from './components/VisualCharts';
import { Stage1Identification } from './components/Stage1Identification';
import { Stage2AssessmentModel } from './components/Stage2AssessmentModel';
import { Stage3WeightMapping } from './components/Stage3WeightMapping';
import { Stage4StudentGrades } from './components/Stage4StudentGrades';
import { Stage5CPMKCalculation } from './components/Stage5CPMKCalculation';
import { Stage6CPLCalculation } from './components/Stage6CPLCalculation';
import { Stage7ContinuousImprovement } from './components/Stage7ContinuousImprovement';
import { Stage8FinalReport } from './components/Stage8FinalReport';
import { StudentIndividualAnalysis } from './components/StudentIndividualAnalysis';
import { KaprodiDashboard } from './components/KaprodiDashboard';
import { GJMAuditorDashboard } from './components/GJMAuditorDashboard';
import { GeminiChatbot } from './components/GeminiChatbot';
import { FileUploadModal } from './components/FileUploadModal';
import { SupabaseAdminModal } from './components/SupabaseAdminModal';
import { LMSIntegrationModal } from './components/LMSIntegrationModal';
import { LoginPage, UserSession } from './components/LoginPage';
import { ShareProdiModal } from './components/ShareProdiModal';
import { CentralAdminOBEDashboard } from './components/CentralAdminOBEDashboard';
import { EarlyWarningNotification } from './components/EarlyWarningNotification';
import { TemplateDownloadModal } from './components/TemplateDownloadModal';
import { getProdiFromUrl, isUniversalPortalLocked, LIST_PROGRAM_STUDI } from './utils/prodiHelper';
import { saveAssessmentOnStage8 } from './utils/firebaseClient';
import {
  loadSupabaseConfig,
  testSupabaseConnection,
} from './utils/supabaseClient';
import {
  downloadGradeTemplateExcel,
} from './utils/templateGenerator';
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Users,
  Database,
  Shield,
  Settings,
  Lock,
  Unlock,
  Upload,
  Download,
  CloudDownload,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [courseData, setCourseData] = useState<OBEAssessmentData>(createEmptyCourse);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isLMSModalOpen, setIsLMSModalOpen] = useState<boolean>(false);
  const [showVisualCharts, setShowVisualCharts] = useState<boolean>(true);
  
  // User Session & Role
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('obe_user_session_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('obe_user_session_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) return parsed.role;
      }
    } catch {}
    return 'dosen';
  });

  // Tab view for dedicated roles (Kaprodi / GJM)
  const [roleViewTab, setRoleViewTab] = useState<string>('dashboard');
  const [adminSubTab, setAdminSubTab] = useState<'central' | 'course'>('central');

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isShareProdiModalOpen, setIsShareProdiModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);

  // Progressive Stage Workflow (stages 1 to 9 for dosen)
  const stageOrder = [1, 2, 3, 4, 9, 5, 6, 7, 8];
  const currentStageIndex = stageOrder.indexOf(currentStage);

  // Check if initial data is completely empty
  const isDataEmpty = !courseData.courseName && (courseData.cpls || []).length === 0;

  // Track max unlocked stage index
  const [maxUnlockedStageIndex, setMaxUnlockedStageIndex] = useState<number>(() => {
    return isDataEmpty ? 0 : stageOrder.length - 1;
  });

  // Free navigation switch
  const [freeNavigation, setFreeNavigation] = useState<boolean>(() => {
    return userRole === 'admin';
  });

  // Sync Program Studi / Jenjang from URL query parameters (?prodi=... or ?jenjang=...) on mount
  useEffect(() => {
    const lockInfo = isUniversalPortalLocked();
    if (lockInfo.isLocked) {
      if (lockInfo.type === 'prodi' && lockInfo.prodi) {
        setCourseData((prev) => ({
          ...prev,
          studyProgram: lockInfo.prodi.name,
          faculty: lockInfo.prodi.faculty || prev.faculty,
          headOfStudyProgram: lockInfo.prodi.defaultKaprodi || prev.headOfStudyProgram,
          semester: String(lockInfo.prodi.semester || prev.semester || 8),
        }));
      } else if (lockInfo.type === 'faculty' && lockInfo.faculty) {
        const firstFacultyProdi = lockInfo.scopedProdis?.[0];
        setCourseData((prev) => ({
          ...prev,
          faculty: lockInfo.faculty || prev.faculty,
          studyProgram: firstFacultyProdi ? firstFacultyProdi.name : prev.studyProgram,
          headOfStudyProgram: firstFacultyProdi?.defaultKaprodi || prev.headOfStudyProgram,
        }));
      } else if (lockInfo.type === 'jenjang' && lockInfo.jenjang) {
        const matchingProdi = LIST_PROGRAM_STUDI.find(
          (p) => p.degree.toLowerCase() === lockInfo.jenjang?.toLowerCase()
        );
        if (matchingProdi) {
          setCourseData((prev) => ({
            ...prev,
            studyProgram: matchingProdi.name,
            faculty: matchingProdi.faculty || prev.faculty,
            headOfStudyProgram: matchingProdi.defaultKaprodi || prev.headOfStudyProgram,
            semester: String(matchingProdi.semester || 4),
          }));
        }
      }
    }
  }, []);

  // Check Supabase connection on load
  useEffect(() => {
    const cfg = loadSupabaseConfig();
    if (cfg.projectUrl && cfg.anonKey) {
      testSupabaseConnection(cfg)
        .then((res) => setIsSupabaseConnected(res.success))
        .catch(() => setIsSupabaseConnected(false));
    }
  }, []);

  // Save courseData to Firestore automatically when reaching Stage 8
  useEffect(() => {
    if (currentStage === 8 && courseData.courseCode) {
      const prodiId = userSession?.prodiId || courseData.prodiId || '86004';
      saveAssessmentOnStage8(courseData, prodiId).then((success) => {
        if (success) {
          console.log('Stage 8 assessment courseData successfully saved to Firestore!');
        }
      });
    }
  }, [currentStage, courseData, userSession]);

  // Recalculate results reactively whenever courseData changes
  const {
    componentTotalAverages,
    totalStudents,
    cpmkResults,
    cplResults,
    summary,
  } = useMemo(() => {
    return calculateAssessmentResults(courseData);
  }, [courseData]);

  // Recalculate individual student achievements
  const studentAchievements = useMemo(() => {
    return calculateStudentIndividualAchievements(courseData);
  }, [courseData]);

  // Update handler
  const handleUpdateCourseData = (updated: Partial<OBEAssessmentData>) => {
    setCourseData((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleSelectSample = (key: string) => {
    if (sampleCourses[key]) {
      setCourseData(sampleCourses[key]);
      setMaxUnlockedStageIndex(stageOrder.length - 1);
      setCurrentStage(1);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Kosongkan semua data asesmen untuk memulai mata kuliah baru?')) {
      setCourseData(createEmptyCourse());
      setMaxUnlockedStageIndex(0);
      setCurrentStage(1);
      setIsUploadModalOpen(true);
    }
  };

  const handleDataLoadedFromUpload = (newData: OBEAssessmentData) => {
    setCourseData(newData);
    setMaxUnlockedStageIndex(stageOrder.length - 1);
    setCurrentStage(1);
  };

  const handleLogout = () => {
    setUserSession(null);
    try {
      localStorage.removeItem('obe_user_session_v1');
    } catch {}
  };

  const goToPrevStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStage(stageOrder[currentStageIndex - 1]);
    }
  };

  const goToNextStage = () => {
    if (currentStageIndex < stageOrder.length - 1) {
      const nextIdx = currentStageIndex + 1;
      setMaxUnlockedStageIndex((prev) => Math.max(prev, nextIdx));
      setCurrentStage(stageOrder[nextIdx]);
    }
  };

  const handleSelectStageWithCheck = (stageNum: number) => {
    const stageIdx = stageOrder.indexOf(stageNum);
    if (freeNavigation || userRole !== 'dosen' || stageIdx <= maxUnlockedStageIndex) {
      setCurrentStage(stageNum);
    }
  };

  // If not logged in, show dedicated role-based Login Page
  if (!userSession) {
    return (
      <LoginPage
        onLogin={(session) => {
          setUserSession(session);
          setUserRole(session.role);
          setRoleViewTab('dashboard');
          if (session.role === 'admin') {
            setFreeNavigation(true);
          }
          if (session.prodi) {
            setCourseData((prev) => ({
              ...prev,
              studyProgram: session.prodi || prev.studyProgram,
              prodiId: session.prodiId || prev.prodiId,
              faculty: session.faculty || prev.faculty,
              facultyId: session.facultyId || prev.facultyId,
              lecturerName: session.name || prev.lecturerName,
              headOfStudyProgram: session.role === 'kaprodi' ? session.name : prev.headOfStudyProgram,
            }));
          }
          try {
            localStorage.setItem('obe_user_session_v1', JSON.stringify(session));
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Sticky Header with Role Segregation */}
      <NavigationHeader
        currentStage={currentStage}
        onSelectStage={handleSelectStageWithCheck}
        data={courseData}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onSelectSampleCourse={handleSelectSample}
        onResetData={handleResetData}
        targetBenchmark={courseData.targetBenchmark ?? 75.0}
        onChangeTarget={(target) => handleUpdateCourseData({ targetBenchmark: target })}
        userRole={userRole}
        onChangeUserRole={setUserRole}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        onOpenLMSModal={() => setIsLMSModalOpen(true)}
        onOpenShareProdiModal={() => setIsShareProdiModalOpen(true)}
        userSession={userSession}
        onLogout={handleLogout}
        maxUnlockedStageIndex={maxUnlockedStageIndex}
        freeNavigation={freeNavigation}
        onToggleFreeNavigation={() => setFreeNavigation(!freeNavigation)}
        roleViewTab={roleViewTab}
        onSelectRoleViewTab={setRoleViewTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 pb-24 md:pb-6">
        
        {/* ============================================================
            ROLE VIEW 1: KETUA PROGRAM STUDI (KAPRODI)
            ============================================================ */}
        {userRole === 'kaprodi' && (
          <div className="space-y-6">
            {roleViewTab === 'dashboard' && (
              <KaprodiDashboard
                currentCourseData={courseData}
                componentTotalAverages={componentTotalAverages}
                userSession={userSession}
                onReviewCourse={(stageNum) => {
                  setCurrentStage(stageNum);
                  setRoleViewTab('reviewCourse');
                }}
                targetBenchmark={courseData.targetBenchmark ?? 75.0}
              />
            )}

            {roleViewTab === 'reviewCourse' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <strong className="text-sky-950 font-bold block">
                        Mode Penelaahan Kaprodi: Laporan Asesmen Akhir Mata Kuliah
                      </strong>
                      <span className="text-sky-800">
                        {courseData.courseCode} - {courseData.courseName} • Dosen: {courseData.lecturerName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setRoleViewTab('dashboard')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    ← Kembali ke Dashboard Kaprodi
                  </button>
                </div>

                <Stage8FinalReport
                  data={courseData}
                  cpmkResults={cpmkResults}
                  cplResults={cplResults}
                  componentTotalAverages={componentTotalAverages}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                  onUpdateNarrative={(narrative) =>
                    handleUpdateCourseData({
                      narrativeNotes: {
                        ...courseData.narrativeNotes,
                        ...narrative,
                      },
                    })
                  }
                />
              </div>
            )}

            {roleViewTab === 'studentAnalysis' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <strong className="text-sky-950 font-bold block">
                        Rekapitulasi Portofolio & Nilai Mutu Mahasiswa (Peraturan Rektor No 12/2026 Pasal 47)
                      </strong>
                      <span className="text-sky-800">
                        Monitoring ketercapaian per individu mahasiswa untuk penjaminan mutu lulusan prodi
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setRoleViewTab('dashboard')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    ← Kembali ke Dashboard Kaprodi
                  </button>
                </div>

                <StudentIndividualAnalysis
                  data={courseData}
                  studentAchievements={studentAchievements}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                  onUpdate={handleUpdateCourseData}
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            ROLE VIEW 2: GUGUS JAMINAN MUTU (GJM) & AUDITOR AMI
            ============================================================ */}
        {userRole === 'gjm' && (
          <div className="space-y-6">
            {roleViewTab === 'dashboard' && (
              <GJMAuditorDashboard
                currentCourseData={courseData}
                userSession={userSession}
                onReviewCourse={(stageNum) => {
                  setCurrentStage(stageNum);
                  setRoleViewTab('reviewCourse');
                }}
                targetBenchmark={courseData.targetBenchmark ?? 75.0}
              />
            )}

            {roleViewTab === 'reviewCourse' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="text-emerald-950 font-bold block">
                        Inspeksi Dokumen Asesmen OBE Mata Kuliah (Auditor GJM)
                      </strong>
                      <span className="text-emerald-800">
                        {courseData.courseCode} - {courseData.courseName} • Dosen: {courseData.lecturerName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setRoleViewTab('dashboard')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    ← Kembali ke Dashboard Auditor
                  </button>
                </div>

                <Stage8FinalReport
                  data={courseData}
                  cpmkResults={cpmkResults}
                  cplResults={cplResults}
                  componentTotalAverages={componentTotalAverages}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                  onUpdateNarrative={(narrative) =>
                    handleUpdateCourseData({
                      narrativeNotes: {
                        ...courseData.narrativeNotes,
                        ...narrative,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            ROLE VIEW 3: DOSEN PENGAMPU MATA KULIAH
            ============================================================ */}
        {userRole === 'dosen' && (
          <div className="space-y-6">
            {/* Instruction Guide Banner (khusus dosen) */}
            <InstructionGuide />

            {/* Early Warning Notification System */}
            <EarlyWarningNotification
              courseData={courseData}
              componentTotalAverages={componentTotalAverages}
              onNavigateToStage={(stageNum) => {
                setCurrentStage(stageNum);
                setMaxUnlockedStageIndex((prev) => Math.max(prev, stageOrder.indexOf(stageNum)));
              }}
              onUpdateCourseData={handleUpdateCourseData}
            />

            {/* Welcome Empty State Banner when no course is loaded yet */}
            {isDataEmpty ? (
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Portal Dosen Pengampu • Penilaian OBE Unpatti</span>
                  </div>
                  
                  <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Mulai Asesmen Mata Kuliah Anda
                  </h2>
                  
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Unggah RPS, Rubrik Penilaian dan Nilai Mahasiswa, lalu sistem otomatis mengekstrak CPL, CPMK, model penilaian Pasal 47, serta mengkalkulasi ketercapaian secara otomatis.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Unggah Berkas RPS &amp; Nilai Sekarang</span>
                    </button>

                    <button
                      onClick={() => setIsLMSModalOpen(true)}
                      className="px-4 py-3 rounded-xl bg-sky-700 hover:bg-sky-600 text-white border border-sky-500/60 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-sky-950/40"
                    >
                      <CloudDownload className="w-4 h-4 text-sky-200" />
                      <span>Tarik Data Otomatis dari LMS</span>
                    </button>

                    <button
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Unduh Template Format Nilai (.xlsx)</span>
                    </button>

                    <button
                      onClick={() => handleSelectSample('algo')}
                      className="px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Muat Data Contoh (Genetika Ikan)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Stage Progress Ribbon with Back/Next Controls */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  {currentStage === 9 ? 'M' : currentStage}
                </span>
                <div>
                  <span className="font-extrabold text-slate-900 block sm:inline">
                    Tahap {currentStageIndex + 1} dari {stageOrder.length}:{' '}
                    {currentStage === 9
                      ? 'Analisis Individu Mahasiswa (Pasal 47)'
                      : `Tahap ${currentStage}`}
                  </span>
                  <span className="text-slate-400 hidden sm:inline"> • </span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5 sm:mt-0">
                    ✓ Mode Pengisian &amp; Edit Dosen Aktif
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {currentStageIndex > 0 && (
                  <button
                    onClick={goToPrevStage}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>
                )}

                {currentStageIndex < stageOrder.length - 1 && (
                  <button
                    onClick={goToNextStage}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Lanjut Tahap Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Stage Body */}
            <section className="transition-all">
              {currentStage === 1 && (
                <Stage1Identification
                  data={courseData}
                  onUpdate={handleUpdateCourseData}
                />
              )}

              {currentStage === 2 && (
                <Stage2AssessmentModel
                  data={courseData}
                  onUpdate={handleUpdateCourseData}
                />
              )}

              {currentStage === 3 && (
                <Stage3WeightMapping
                  data={courseData}
                  onUpdate={handleUpdateCourseData}
                />
              )}

              {currentStage === 4 && (
                <Stage4StudentGrades
                  data={courseData}
                  componentTotalAverages={componentTotalAverages}
                  onUpdate={handleUpdateCourseData}
                  onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
                />
              )}

              {currentStage === 9 && (
                <StudentIndividualAnalysis
                  data={courseData}
                  studentAchievements={studentAchievements}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                  onUpdate={handleUpdateCourseData}
                />
              )}

              {currentStage === 5 && (
                <Stage5CPMKCalculation
                  data={courseData}
                  cpmkResults={cpmkResults}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                />
              )}

              {currentStage === 6 && (
                <Stage6CPLCalculation
                  data={courseData}
                  cplResults={cplResults}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                />
              )}

              {currentStage === 7 && (
                <Stage7ContinuousImprovement
                  data={courseData}
                  cpmkResults={cpmkResults}
                  cplResults={cplResults}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                  onUpdateNarrative={(narrative) =>
                    handleUpdateCourseData({
                      narrativeNotes: {
                        ...courseData.narrativeNotes,
                        ...narrative,
                      },
                    })
                  }
                />
              )}

              {currentStage === 8 && (
                <Stage8FinalReport
                  data={courseData}
                  cpmkResults={cpmkResults}
                  cplResults={cplResults}
                  componentTotalAverages={componentTotalAverages}
                  targetBenchmark={courseData.targetBenchmark ?? 75.0}
                  onUpdateNarrative={(narrative) =>
                    handleUpdateCourseData({
                      narrativeNotes: {
                        ...courseData.narrativeNotes,
                        ...narrative,
                      },
                    })
                  }
                />
              )}
            </section>
          </div>
        )}

        {/* ============================================================
            ROLE VIEW 4: ADMIN SISTEM
            ============================================================ */}
        {userRole === 'admin' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 border border-emerald-500/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm block">Panel Admin Pusat OBE &amp; Integrasi Cloud</span>
                  <p className="text-slate-300 text-[11px]">
                    Koneksi Supabase: {isSupabaseConnected ? 'Online & Terhubung' : 'Penyimpanan Lokal / Siap Terhubung'}
                  </p>
                </div>
              </div>

              {/* Subtab Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('central')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      adminSubTab === 'central'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    117 Prodi (Dasbor Pusat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('course')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      adminSubTab === 'course'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Laporan Mata Kuliah Aktif
                  </button>
                </div>

                <button
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pengaturan Supabase</span>
                </button>
              </div>
            </div>

            {/* Subtab 1: Central Admin OBE Dashboard */}
            {adminSubTab === 'central' && (
              <CentralAdminOBEDashboard
                onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
                targetBenchmark={courseData.targetBenchmark ?? 75.0}
                userSession={userSession}
              />
            )}

            {/* Subtab 2: Active Course Full Assessment */}
            {adminSubTab === 'course' && (
              <Stage8FinalReport
                data={courseData}
                cpmkResults={cpmkResults}
                cplResults={cplResults}
                componentTotalAverages={componentTotalAverages}
                targetBenchmark={courseData.targetBenchmark ?? 75.0}
                onUpdateNarrative={(narrative) =>
                  handleUpdateCourseData({
                    narrativeNotes: {
                      ...courseData.narrativeNotes,
                      ...narrative,
                    },
                  })
                }
              />
            )}
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-300">
              OBE Assessment Specialist &amp; Penjaminan Mutu Akademik
            </p>
            <p className="text-[11px] text-slate-500">
              Universitas Pattimura • Peraturan Rektor No. 12 Tahun 2026 Pasal 47
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Dikembangkan oleh <strong className="text-slate-300">Dr. Bruri Melky Laimeheriwa and Partners</strong> • Spesialis Digitalisasi Asesmen OBE
          </div>
        </div>
      </footer>

      {/* Gemini AI Chatbot Component */}
      <GeminiChatbot
        courseData={courseData}
        cpmkResults={cpmkResults}
        cplResults={cplResults}
        targetBenchmark={courseData.targetBenchmark ?? 75.0}
      />

      {/* Modal File Upload */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleDataLoadedFromUpload}
        currentCourseData={courseData}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
      />

      {/* Modal Unduh Template Format Nilai (Pasal 47 Model 1, 2, 3) */}
      <TemplateDownloadModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        courseData={courseData}
      />

      {/* Supabase Admin Modal */}
      <SupabaseAdminModal
        isOpen={isSupabaseModalOpen}
        onClose={() => {
          setIsSupabaseModalOpen(false);
          const cfg = loadSupabaseConfig();
          if (cfg.projectUrl && cfg.anonKey) {
            testSupabaseConnection(cfg)
              .then((res) => setIsSupabaseConnected(res.success))
              .catch(() => setIsSupabaseConnected(false));
          }
        }}
        courseData={courseData}
        onLoadCourseData={(newData) => {
          setCourseData(newData);
          setMaxUnlockedStageIndex(stageOrder.length - 1);
          setCurrentStage(1);
        }}
      />

      {/* LMS Web Service & Auto-Sync Modal */}
      <LMSIntegrationModal
        isOpen={isLMSModalOpen}
        onClose={() => setIsLMSModalOpen(false)}
        onDataLoaded={(syncedData) => {
          setCourseData(syncedData);
          setMaxUnlockedStageIndex(stageOrder.length - 1);
          setCurrentStage(1);
        }}
        currentCourseData={courseData}
      />

      {/* Share Prodi Modal (Integrasi MyApps) */}
      <ShareProdiModal
        isOpen={isShareProdiModalOpen}
        onClose={() => setIsShareProdiModalOpen(false)}
        activeProdiSlug={getProdiFromUrl()?.code || getProdiFromUrl()?.slug}
        onSelectProdi={(prodi) => {
          handleUpdateCourseData({
            studyProgram: prodi.name,
            faculty: prodi.faculty,
            headOfStudyProgram: prodi.defaultKaprodi,
          });
          if (userSession) {
            const updated = { ...userSession, prodi: prodi.name, faculty: prodi.faculty };
            setUserSession(updated);
            localStorage.setItem('obe_user_session_v1', JSON.stringify(updated));
          }
          const url = new URL(window.location.href);
          url.searchParams.set('prodi', prodi.code || prodi.slug);
          window.history.replaceState({}, '', url.toString());
        }}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR (Khusus iPhone, Android, Tablet) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 md:hidden px-2 py-1.5 flex items-center justify-around text-[10px] text-slate-400 shadow-2xl safe-area-bottom">
        {userRole === 'dosen' && (
          <>
            <button
              onClick={() => setCurrentStage(1)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStage === 1 || currentStage === 2 || currentStage === 3 ? 'text-indigo-400 font-bold' : 'hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>RPS &amp; Model</span>
            </button>
            <button
              onClick={() => setCurrentStage(4)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStage === 4 ? 'text-indigo-400 font-bold' : 'hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Nilai Mhs</span>
            </button>
            <button
              onClick={() => setCurrentStage(9)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStage === 9 ? 'text-amber-400 font-bold' : 'hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Remedial (P.52)</span>
            </button>
            <button
              onClick={() => setCurrentStage(5)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStage === 5 || currentStage === 6 ? 'text-indigo-400 font-bold' : 'hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Capaian OBE</span>
            </button>
            <button
              onClick={() => setCurrentStage(8)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                currentStage === 8 ? 'text-indigo-400 font-bold' : 'hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Laporan Final</span>
            </button>
          </>
        )}

        {userRole === 'kaprodi' && (
          <>
            <button
              onClick={() => setRoleViewTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                roleViewTab === 'dashboard' ? 'text-sky-400 font-bold' : 'hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>CPL Prodi</span>
            </button>
            <button
              onClick={() => setRoleViewTab('reviewCourse')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                roleViewTab === 'reviewCourse' ? 'text-sky-400 font-bold' : 'hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Pengesahan</span>
            </button>
            <button
              onClick={() => setRoleViewTab('studentAnalysis')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                roleViewTab === 'studentAnalysis' ? 'text-sky-400 font-bold' : 'hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Rekap Mutu</span>
            </button>
          </>
        )}

        {userRole === 'gjm' && (
          <>
            <button
              onClick={() => setRoleViewTab('dashboard')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                roleViewTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dashboard AMI</span>
            </button>
            <button
              onClick={() => setRoleViewTab('reviewCourse')}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                roleViewTab === 'reviewCourse' ? 'text-emerald-400 font-bold' : 'hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Verifikasi Dokumen</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
