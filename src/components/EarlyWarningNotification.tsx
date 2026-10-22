import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { OBEAssessmentData } from '../types/obe';

interface EarlyWarningNotificationProps {
  courseData: OBEAssessmentData;
  componentTotalAverages: Record<string, number>;
  onNavigateToStage?: (stageNum: number) => void;
  onUpdateCourseData?: (updated: Partial<OBEAssessmentData>) => void;
}

export const EarlyWarningNotification: React.FC<EarlyWarningNotificationProps> = ({
  courseData,
  componentTotalAverages,
  onNavigateToStage,
  onUpdateCourseData,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mitigationToast, setMitigationToast] = useState('');

  const targetBenchmark = courseData.targetBenchmark ?? 75.0;
  // Ambang batas Early Warning: di bawah 60% dari target benchmark (e.g. 75 * 0.6 = 45.0)
  const warningThreshold = Number((targetBenchmark * 0.6).toFixed(1));

  // Identifikasi komponen yang rata-ratanya berada di bawah 60% target benchmark
  const flaggedComponents = (courseData.components || [])
    .map((comp) => {
      const avg = componentTotalAverages[comp.id] ?? 0;
      // Temukan CPMK dan CPL yang terdampak oleh komponen ini
      const impactedCpmkCodes = Object.entries(comp.cpmkWeights || {})
        .filter(([_, weight]) => (weight || 0) > 0)
        .map(([cpmkCode]) => cpmkCode);

      const impactedCplCodes = Array.from(
        new Set(
          (courseData.cpmks || [])
            .filter((cpmk) => impactedCpmkCodes.includes(cpmk.code))
            .flatMap((cpmk) => (cpmk.cplMappings || []).map((m) => m.cplCode))
        )
      );

      return {
        comp,
        avg,
        deficit: Number((warningThreshold - avg).toFixed(1)),
        isWarning: avg > 0 && avg < warningThreshold,
        impactedCpmkCodes,
        impactedCplCodes,
      };
    })
    .filter((item) => item.isWarning);

  // Jika tidak ada komponen yang bermasalah atau belum ada nilai sama sekali
  if (flaggedComponents.length === 0) {
    return null;
  }

  // Simulasi mitigasi: naikkan nilai komponen yang defisit agar melampaui batas aman
  const handleApplySimulatedMitigation = (compIdx: number, compId: string) => {
    const nextUnits = courseData.unitClasses.map((unit) => {
      const currentVal = unit.componentAverages[compId] || 0;
      const boost = 15; // Beri dorongan remedial +15 poin
      return {
        ...unit,
        componentAverages: {
          ...unit.componentAverages,
          [compId]: Math.min(95, Math.round(currentVal + boost)),
        },
      };
    });

    if (onUpdateCourseData) {
      onUpdateCourseData({ unitClasses: nextUnits });
      setMitigationToast(`Simulasi intervensi remedial berhasil diterapkan (+15 poin) pada komponen terkait!`);
      setTimeout(() => setMitigationToast(''), 4000);
    }
  };

  return (
    <aside aria-label="Early Warning System" className="w-full bg-gradient-to-r from-rose-950 via-amber-950 to-slate-900 border-2 border-rose-500/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl shadow-rose-950/40 relative overflow-hidden animate-fade-in">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      {mitigationToast && (
        <div className="mb-4 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{mitigationToast}</span>
          </div>
          <button
            onClick={() => setMitigationToast('')}
            className="text-white hover:text-emerald-200 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-rose-500/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
            <AlertTriangle className="w-5 h-5 text-rose-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                Sistem Notifikasi Early Warning (Deteksi Dini)
              </span>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                Ambang Batas 60%: &lt; {warningThreshold}%
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
              Terdeteksi {flaggedComponents.length} Komponen Asesmen di Bawah 60% Benchmark
            </h3>
            <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
              Peringatan dini mitigasi: Nilai rata-rata komponen berada di bawah 60% dari target benchmark ({targetBenchmark}%). Jika dibiarkan tanpa tindakan perbaikan, berisiko tinggi menyebabkan mahasiswa <strong>Gagal Capaian CPL</strong> pada akhir semester.
            </p>
          </div>
        </div>

        {/* Toggle Expand / Minimize */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Warning Cards */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {flaggedComponents.map((item) => (
              <div
                key={item.comp.id}
                className="bg-black/40 border border-rose-500/40 hover:border-rose-400/80 rounded-2xl p-4 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 tracking-wide block uppercase">
                      Komponen Bermasalah:
                    </span>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{item.comp.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({item.comp.weight}%)</span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-rose-400 font-mono block leading-none">
                      {item.avg.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-rose-300">
                      Defisit -{item.deficit} poin
                    </span>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>Capaian Riil: <strong className="text-rose-300 font-mono">{item.avg.toFixed(1)}</strong></span>
                    <span>Batas 60%: <strong className="text-amber-300 font-mono">{warningThreshold}</strong></span>
                    <span>Target: <strong className="text-emerald-300 font-mono">{targetBenchmark}</strong></span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex relative">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.avg)}%` }}
                    />
                    {/* Mark for 60% threshold */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                      style={{ left: `${warningThreshold}%` }}
                      title={`Ambang Batas 60% (${warningThreshold})`}
                    />
                  </div>
                </div>

                {/* Impacted CPMK & CPL */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] space-y-1.5">
                  <div className="text-slate-300">
                    <span className="text-slate-400">CPL Terdampak Langsung: </span>
                    {item.impactedCplCodes.length > 0 ? (
                      <span className="font-extrabold text-amber-300">
                        {item.impactedCplCodes.join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400">Seluruh ranah capaian</span>
                    )}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400">CPMK Terhubung: </span>
                    <span className="font-semibold text-sky-300">
                      {item.impactedCpmkCodes.join(', ') || '-'}
                    </span>
                  </div>
                </div>

                {/* Mitigation Recommendation */}
                <div className="text-[11px] text-slate-300 leading-snug space-y-1">
                  <strong className="text-amber-300 block">Rekomendasi Tindakan Mitigasi Dini:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-200">
                    <li>Beri penugasan remedial terstruktur bagi mahasiswa bernilai di bawah target (Pasal 52).</li>
                    <li>Lakukan pendampingan kelompok belajar atau asistensi materi sebelum ujian berikutnya.</li>
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="pt-1 flex items-center gap-2">
                  {onNavigateToStage && (
                    <button
                      onClick={() => onNavigateToStage(4)}
                      className="flex-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Tinjau Nilai (Tahap 4)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onNavigateToStage && (
                    <button
                      onClick={() => onNavigateToStage(9)}
                      className="px-3 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Buka Analisis Remedial Individu Mahasiswa"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Remedial</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
