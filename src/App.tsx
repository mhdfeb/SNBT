import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Trophy, 
  BookOpen, 
  Clock, 
  Target, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Info, 
  LayoutGrid, 
  BarChart3, 
  Home,
  Flame,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  Award,
  Zap,
  ArrowRight,
  Search,
  School,
  Calendar
} from 'lucide-react';
import { useQuiz } from './hooks/useQuiz';
import { formatTime, cn } from './lib/utils';
import { Difficulty, Category, Question, AssessmentReport, StudyMaterial, QuizSession, ConceptEvaluation } from './types/quiz';
import { STUDY_MATERIALS } from './data/materials';
import { Difficulty, Category, Question, AssessmentReport, StudyMaterial, QuizSession } from './types/quiz';
import { STUDY_MATERIALS, findMaterialByConcept } from './data/materials';
import ReactMarkdown from 'react-markdown';
import visualTPS from './assets/visuals/style-pack-tps.svg';
import visualLiterasi from './assets/visuals/style-pack-literasi.svg';
import visualMatematika from './assets/visuals/style-pack-matematika.svg';
import visualReport from './assets/visuals/style-pack-report.svg';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line
} from 'recharts';

// --- Components ---

const MOTION_DURATION = {
  micro: 0.14,
  page: 0.24,
  modal: 0.18,
} as const;

const ProgressBar = ({ current, total, color = "bg-indigo-600" }: { current: number; total: number; color?: string }) => (
  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
    <motion.div 
      className={cn("h-full", color)}
      initial={{ width: 0 }}
      animate={{ width: `${(current / (total || 1)) * 100}%` }}
      transition={{ duration: MOTION_DURATION.micro, ease: 'easeOut' }}
    />
  </div>
);

// Isolated countdown timer — only this component re-renders every second, not the whole quiz
const SubTestCountdown = React.memo(({ expiresAt, onExpire }: { expiresAt: number; onExpire: () => void }) => {
  const getRemaining = useCallback(() => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)), [expiresAt]);
  const [secs, setSecs] = useState(getRemaining);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecs(getRemaining());
    const id = setInterval(() => {
      const rem = getRemaining();
      setSecs(rem);
      if (rem <= 0) {
        clearInterval(id);
        onExpireRef.current();
      }
    }, 500);
    return () => clearInterval(id);
  }, [expiresAt, getRemaining]);

  return (
    <span className={cn("text-2xl font-black font-mono tracking-tighter", secs < 60 ? "text-rose-400 animate-pulse" : "text-white")}>
      {formatTime(secs)}
    </span>
  );
});

const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => {
  const colors = {
    easy: 'ui-badge-success',
    medium: 'ui-badge-warning',
    trap: 'ui-badge-info',
  };
  return (
    <span className={cn("ui-badge text-[10px] font-bold uppercase", colors[difficulty])}>
      {difficulty}
    </span>
  );
};

const QuestionTimer = ({ isSubmitted, currentIdx }: { isSubmitted: boolean; currentIdx: number }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    setTime(0);
  }, [currentIdx]);

  useEffect(() => {
    let interval: any;
    if (!isSubmitted) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSubmitted, currentIdx]);

  return (
    <div className="ui-badge font-mono text-slate-600 bg-slate-50 border-slate-200">
      <Clock size={14} className="text-slate-300" />
      Waktu Soal: {formatTime(time)}
    </div>
  );
};

const QuestionArea = React.memo(({ question, session, answerQuestion }: { 
  question: Question; 
  session: QuizSession; 
  answerQuestion: (answer: any) => void;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const currentAnswer = session.answers[question.id];
  const isSubmitted = session.isSubmitted;

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      {question.options?.map((option, idx) => {
        const isSelected = currentAnswer === idx;
        const isCorrect = question.correctAnswer === idx;
        let optionClass = "w-full text-left p-5 rounded-2xl border-2 font-medium transition-all flex items-start gap-4";
        if (isSubmitted) {
          if (isCorrect) optionClass += " bg-green-50 border-green-400 text-green-800";
          else if (isSelected && !isCorrect) optionClass += " bg-red-50 border-red-400 text-red-800";
          else optionClass += " bg-slate-50 border-slate-200 text-slate-500";
        } else {
          if (isSelected) optionClass += " bg-indigo-50 border-indigo-400 text-indigo-800";
          else optionClass += " bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700";
        }
        return (
          <button key={idx} className={optionClass} onClick={() => !isSubmitted && answerQuestion(idx)} disabled={isSubmitted}>
            <span className="font-black text-xs mt-0.5 min-w-[20px]">{String.fromCharCode(65 + idx)}.</span>
            <div className="prose prose-sm max-w-none"><ReactMarkdown>{option}</ReactMarkdown></div>
            {isSubmitted && isCorrect && <CheckCircle2 size={18} className="ml-auto text-green-500 shrink-0 mt-0.5" />}
            {isSubmitted && isSelected && !isCorrect && <XCircle size={18} className="ml-auto text-red-500 shrink-0 mt-0.5" />}
          </button>
        );
      })}
    </div>
  );

  const renderComplexMultipleChoice = () => {
    const answers: boolean[] = Array.isArray(currentAnswer) ? currentAnswer : Array(question.complexOptions?.length ?? 0).fill(undefined);
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Pilih Benar/Salah untuk setiap pernyataan:</p>
        {question.complexOptions?.map((opt, idx) => {
          const userAnswer = answers[idx];
          const isCorrect = opt.correct;
          let rowClass = "p-5 rounded-2xl border-2 transition-all";
          if (isSubmitted) {
            rowClass += userAnswer === isCorrect ? " bg-green-50 border-green-300" : " bg-red-50 border-red-300";
          } else {
            rowClass += " bg-white border-slate-200";
          }
          return (
            <div key={idx} className={rowClass}>
              <div className="prose prose-sm max-w-none text-slate-700 mb-3"><ReactMarkdown>{opt.statement}</ReactMarkdown></div>
              <div className="flex gap-3">
                {[true, false].map((val) => {
                  const label = val ? 'Benar' : 'Salah';
                  const isSelected = userAnswer === val;
                  let btnClass = "flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all";
                  if (isSubmitted) {
                    if (val === isCorrect) btnClass += " bg-green-500 border-green-500 text-white";
                    else if (isSelected) btnClass += " bg-red-400 border-red-400 text-white";
                    else btnClass += " bg-slate-100 border-slate-200 text-slate-400";
                  } else {
                    if (isSelected) btnClass += " bg-indigo-600 border-indigo-600 text-white";
                    else btnClass += " bg-slate-100 border-slate-200 text-slate-600 hover:border-indigo-300";
                  }
                  return (
                    <button key={String(val)} className={btnClass} disabled={isSubmitted} onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[idx] = val;
                      answerQuestion(newAnswers);
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderShortAnswer = () => {
    const isCorrect = isSubmitted && Number(currentAnswer) === question.shortAnswerCorrect;
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Masukkan jawaban angka:</p>
        <input
          type="number"
          value={currentAnswer ?? ''}
          onChange={(e) => !isSubmitted && answerQuestion(Number(e.target.value))}
          disabled={isSubmitted}
          placeholder="Jawaban..."
          className={cn(
            "w-full p-5 rounded-2xl border-2 text-lg font-bold outline-none transition-all",
            isSubmitted
              ? isCorrect ? "bg-green-50 border-green-400 text-green-800" : "bg-red-50 border-red-400 text-red-800"
              : "bg-white border-slate-200 focus:border-indigo-400 text-slate-800"
          )}
        />
        {isSubmitted && (
          <p className="text-sm font-semibold">
            Jawaban benar: <span className="text-green-700 font-black">{question.shortAnswerCorrect}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      key={question.id}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: MOTION_DURATION.page, ease: 'easeOut' }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="ui-badge-info">{question.category}</span>
          <span className="ui-badge-info">{question.concept}</span>
          <QuestionTimer isSubmitted={session.isSubmitted} currentIdx={session.currentIdx} />
        </div>
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{question.question}</ReactMarkdown>
        </div>
      </div>
      <div>
        {question.type === 'multiple_choice' && renderMultipleChoice()}
        {question.type === 'complex_multiple_choice' && renderComplexMultipleChoice()}
        {question.type === 'short_answer' && renderShortAnswer()}
      </div>
      {isSubmitted && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 font-black text-sm uppercase tracking-widest">
            <Info size={16} /> Pembahasan
          </div>
          <div className="prose prose-sm max-w-none text-indigo-900">
            <ReactMarkdown>{question.explanation}</ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// --- Main App ---

export default function App() {
  const prefersReducedMotion = useReducedMotion();
  const { 
    progress, 
    session, 
    startSession, 
    answerQuestion, 
    nextQuestion, 
    prevQuestion, 
    submitQuiz,
    nextSubTest,
    toggleMark,
    setSession,
    updateConceptMasteryFromCheckpoint
    markMaterialRead
  } = useQuiz();

  const [view, setView] = useState<'dashboard' | 'quiz' | 'analytics' | 'report' | 'study'>('dashboard');
  const [selectedReport, setSelectedReport] = useState<AssessmentReport | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [checkpointScores, setCheckpointScores] = useState<Record<string, number>>({});
  const [revealedCheckpointAnswers, setRevealedCheckpointAnswers] = useState<Record<string, boolean>>({});
  const [activeRemedialCycleId, setActiveRemedialCycleId] = useState<string | null>(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubTestConfirm, setShowSubTestConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const iconOnlyFocusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  const findMaterialFromRemedial = (concept: string, materialId?: string) => {
    if (materialId) {
      const byId = STUDY_MATERIALS.find(material => material.id === materialId);
      if (byId) return byId;
    }
    const normalizedConcept = concept.toLowerCase().trim();
    return STUDY_MATERIALS.find(material => material.concept.toLowerCase().trim() === normalizedConcept);
  };

  useEffect(() => {
    setActiveBlockIdx(0);
    setCheckpointScores({});
  }, [selectedMaterial?.id]);

  const getModeName = (mode: string) => {
    switch(mode) {
      case 'mini': return 'Mini Tryout';
      case 'daily': return 'Latihan Harian';
      case 'tryout': return 'Tryout Full';
      case 'category': return 'Latihan Kategori';
      case 'drill15': return 'Targeted Drill 15 Menit';
      default: return mode;
    }
  };

  const handleStart = (mode: 'tryout' | 'mini' | 'daily' | 'drill15' | 'category', category?: Category) => {
    startSession(mode, category);
    setView('quiz');
  };

  const handleViewReport = (report: AssessmentReport) => {
    setSelectedReport(report);
    setView('report');
  };

  const startRemedialBaseline = (concept: any) => {
    startSession('mini', undefined, { concept, remedialPhase: 'baseline' });
    setView('quiz');
  };

  const continueToMaterial = (concept: any, cycleId: string) => {
    const material = findMaterialByConcept(concept);
    if (!material) return;
    setActiveRemedialCycleId(cycleId);
    setSelectedMaterial(material);
    setView('study');
  };

  const currentQuestion = session?.questions[session.currentIdx];
  const isLastQuestion = session && session.currentIdx === session.questions.length - 1;
  const currentSubTest = session?.subTests && session.currentSubTestIdx !== undefined ? session.subTests[session.currentSubTestIdx] : null;
  const currentRecommendation = session && currentQuestion ? session.recommendations?.[currentQuestion.id] : null;
  const pageTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: MOTION_DURATION.page, ease: 'easeOut' as const };
  const modalTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: MOTION_DURATION.modal, ease: 'easeOut' as const };

  // --- Views ---

  const DashboardView = () => {
    const ongoingCycles = progress.remedialCycles.filter(c => c.status !== 'completed');
    const weeklyConceptDelta = progress.remedialCycles.reduce<Record<string, { concept: string; week: string; delta: number }>>((acc, cycle) => {
      if (cycle.baselineScore === undefined || cycle.afterScore === undefined || !cycle.completedAt) return acc;
      const weekKey = `${new Date(cycle.completedAt).getFullYear()}-W${Math.ceil(new Date(cycle.completedAt).getDate() / 7)}`;
      const key = `${cycle.concept}-${weekKey}`;
      if (!acc[key]) acc[key] = { concept: cycle.concept, week: weekKey, delta: 0 };
      acc[key].delta += cycle.afterScore - cycle.baselineScore;
      return acc;
    }, {});

    return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 pb-32">
      {ongoingCycles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-700">Notifikasi Remedial</p>
            <p className="text-slate-800 font-bold">Ada {ongoingCycles.length} siklus remedial belum tuntas. Lanjutkan dari dashboard report atau materi.</p>
          </div>
          <button onClick={() => setView('report')} className="px-4 py-2 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest">
            Lanjut Remedial
          </button>
        </div>
      )}
      {/* Hero Section - Bento Style */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 ui-card bg-slate-900 rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-200 border-slate-800">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -ml-20 -mb-20" />
          
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/10">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Persiapan SNBT 2026
            </div>
            
            <div className="space-y-4">
              <h1 className="text-display leading-[1.05]">
                Taklukkan <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Kampus Impian.</span>
              </h1>
              <p className="text-body text-slate-300 max-w-lg">
                Platform simulasi dengan sistem penilaian IRT terakurat untuk mengukur peluang lolos PTN favoritmu.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-6">
              <button 
                onClick={() => handleStart('tryout')}
                className="ui-btn-primary px-10 py-5 rounded-[24px] shadow-xl shadow-indigo-900/40 group text-sm uppercase tracking-widest"
              >
                Mulai Tryout Full
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button 
                onClick={() => setView('study')}
                className="ui-btn px-10 py-5 rounded-[24px] bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 text-sm uppercase tracking-widest"
              >
                Pelajari Materi
              </button>
            </div>
          </div>
        </div>

        <div className="ui-card ui-card-hover rounded-[48px] p-10 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Flame size={180} />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="w-16 h-16 bg-orange-50 rounded-[20px] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-orange-100">
              <Flame className="text-orange-500 w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-900">Belajar Rutin</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Pertahankan streak belajarmu untuk mendapatkan poin tambahan.
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Streak Saat Ini</p>
              <p className="text-4xl font-black text-slate-900 mt-1">{progress.streak} Hari</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <TrendingUp className="text-indigo-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {progress.reports[0]?.conceptEvaluations && progress.reports[0].conceptEvaluations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Status Konsep Terkini</h3>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Berdasar confidence band</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {progress.reports[0].conceptEvaluations.slice(0, 6).map((item, idx) => (
              <div key={`${item.concept}-${idx}`} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 mb-2">{item.concept}</p>
                <p className={cn(
                  "text-sm font-black",
                  item.status === 'Strong' ? "text-emerald-600" :
                  item.status === 'Watchlist' ? "text-amber-600" :
                  item.status === 'Critical' ? "text-rose-600" : "text-slate-500"
                )}>
                  {item.status}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Acc {Math.round(item.rollingAccuracy * 100)}% • N={item.sampleSize}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats & Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Soal Terjawab', value: progress.completedIds.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Rata-rata Skor', value: progress.reports.length > 0 ? Math.round(progress.reports.reduce((acc, r) => acc + r.totalScore, 0) / progress.reports.length) : 0, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Materi Dikuasai', value: `${Math.round((Object.keys(progress.materialMastery).length / 20) * 100)}%`, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Peringkat Nasional', value: progress.reports.length > 0 ? `#${progress.reports[0].nationalRank}` : '-', icon: Award, color: 'text-violet-500', bg: 'bg-violet-50' },
        ].map((stat, idx) => (
          <div key={idx} className="ui-card ui-card-hover p-6 rounded-3xl space-y-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {progress.strategyOutcomes && Object.keys(progress.strategyOutcomes).length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-4">Efektivitas Strategy Selector</p>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(progress.strategyOutcomes).map(([strategy, outcome]) => (
              <div key={strategy} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-500">{strategy.replace('_', ' ')}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{outcome?.avgAccuracy ?? 0}%</p>
                <p className="text-xs text-slate-500 mt-1">Akurasi rata-rata dari {outcome?.attempts ?? 0} sesi.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Features */}
      {progress.lastRemedialConcepts && progress.lastRemedialConcepts.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-amber-500 w-2 h-8 rounded-full" />
            Prioritas Belajar Hari Ini
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {progress.lastRemedialConcepts.slice(0, 3).map((item, idx) => {
              const material = findMaterialFromRemedial(item.concept, item.materialId);
              return (
                <div key={`${item.concept}-${idx}`} className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm space-y-4">
                  <div>
                    <p className="text-[10px] text-amber-600 uppercase tracking-widest font-black">Akurasi Sesi Terakhir</p>
                    <p className="text-2xl font-black text-slate-900">{item.accuracy}%</p>
                    <p className="text-sm text-slate-500 font-semibold">{item.concept}</p>
                  </div>
                  {material ? (
                    <button
                      onClick={() => {
                        setSelectedMaterial(material);
                        setView('study');
                      }}
                      className="w-full bg-amber-500 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                    >
                      Pelajari konsep ini sekarang
                    </button>
                  ) : (
                    <button
                      onClick={() => setView('study')}
                      className="w-full bg-slate-900 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                    >
                      Buka Pustaka Materi
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-title flex items-center gap-3">
            <div className="bg-indigo-600 w-2 h-8 rounded-full" />
            Pilih Mode Latihan
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { id: 'mini', title: 'Mini Tryout', desc: '10 Soal campuran untuk latihan cepat 15 menit.', icon: Zap, color: 'bg-amber-500', shadow: 'shadow-amber-200' },
            { id: 'daily', title: 'Latihan Harian', desc: '5 Soal adaptif berdasarkan kelemahanmu.', icon: Target, color: 'bg-indigo-500', shadow: 'shadow-indigo-200' },
            { id: 'drill15', title: 'Targeted Drill 15 Menit', desc: 'Fokus otomatis ke 2-3 konsep terlemah dengan spaced repetition.', icon: AlertTriangle, color: 'bg-rose-500', shadow: 'shadow-rose-200' },
            { id: 'study', title: 'Belajar Mandiri', desc: 'Pahami konsep materi secara mendalam.', icon: BookOpen, color: 'bg-emerald-500', shadow: 'shadow-emerald-200' },
          ].map((feature) => (
            <motion.button
              key={feature.id}
              whileHover={prefersReducedMotion ? undefined : { y: -3 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
              transition={{ duration: MOTION_DURATION.micro, ease: 'easeOut' }}
              onClick={() => feature.id === 'study' ? setView('study') : handleStart(feature.id as any)}
              className="ui-card ui-card-hover p-8 rounded-[40px] text-left space-y-6 group"
            >
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl", feature.color, feature.shadow)}>
                <feature.icon size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                Mulai Sekarang <ArrowRight size={16} />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {session?.recommendation && (
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-emerald-600 w-2 h-8 rounded-full" />
            Transparansi Rekomendasi Engine
          </h2>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <p className="text-sm text-slate-600 font-medium">
              Mode terakhir: <span className="font-black text-slate-900">{getModeName(session.recommendation.mode)}</span>
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest font-black text-rose-600">Konsep Terlemah</p>
                <p className="text-sm font-bold text-slate-800 mt-2">{session.recommendation.weakestConcepts.join(', ') || '-'}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest font-black text-indigo-600">Retensi Konsep Kuat</p>
                <p className="text-sm font-bold text-slate-800 mt-2">{session.recommendation.strongestConcepts.join(', ') || '-'}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest font-black text-amber-600">Target Drill</p>
                <p className="text-sm font-bold text-slate-800 mt-2">{session.recommendation.targetConcepts.join(', ') || 'N/A di mode ini'}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {session.recommendation.reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-slate-700 font-medium flex gap-2">
                  <span className="text-emerald-600 font-black">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Category Selection */}
      <section className="space-y-6">
        <h2 className="text-title flex items-center gap-3">
          <div className="bg-violet-600 w-2 h-8 rounded-full" />
          Fokus Per Kategori
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'TPS', title: 'TPS', icon: LayoutGrid, color: 'bg-blue-500' },
            { id: 'Literasi Indonesia', title: 'Lit. Indonesia', icon: BookOpen, color: 'bg-rose-500' },
            { id: 'Literasi Inggris', title: 'Lit. Inggris', icon: Clock, color: 'bg-amber-500' },
            { id: 'Penalaran Matematika', title: 'Pen. Matematika', icon: BarChart3, color: 'bg-emerald-500' },
          ].map(cat => (
            <motion.button
              key={cat.id}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              transition={{ duration: MOTION_DURATION.micro, ease: 'easeOut' }}
              onClick={() => handleStart('category', cat.id as Category)}
              className="ui-card ui-card-hover p-6 rounded-[32px] text-center flex flex-col items-center gap-4 group hover:bg-slate-50"
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform", cat.color)}>
                <cat.icon size={32} />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{cat.title}</h3>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <div className="bg-emerald-600 w-2 h-8 rounded-full" />
          Improvement Delta per Konsep (Mingguan)
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(weeklyConceptDelta).length > 0 ? Object.values(weeklyConceptDelta).map((item) => (
            <div key={`${item.concept}-${item.week}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{item.week}</p>
                <p className="font-black text-slate-900">{item.concept}</p>
              </div>
              <p className={cn("text-xl font-black", item.delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {item.delta >= 0 ? '+' : ''}{item.delta}
              </p>
            </div>
          )) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-slate-500 font-medium">
              Belum ada data delta mingguan. Selesaikan siklus remedial (baseline → materi → mini-quiz ulang).
            </div>
          )}
        </div>
      </section>
    </div>
  );
  };

  const QuizView = () => {
    if (!session || !currentQuestion) return null;

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
        {/* Header CBT Resmi Style - Enhanced */}
        <nav className="ui-navbar flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl shadow-inner">
                <School size={28} className="text-[#1e293b]" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base tracking-[0.15em] uppercase leading-none">SIMULASI SNBT 2026</span>
                <span className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.2em] mt-1">EduPath Analytics Platform</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-700 hidden md:block" />
            <div className="hidden md:flex flex-col">
              <span className="font-black text-xs text-indigo-400 uppercase tracking-widest">
                {currentSubTest ? currentSubTest.name : (session.selectedCategory || getModeName(session.mode))}
              </span>
              {currentSubTest && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Sub-tes {session.currentSubTestIdx! + 1} dari {session.subTests!.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-10">
            {currentSubTest && currentSubTest.expiresAt > 0 && (
              <div className="flex items-center gap-5 bg-[#0f172a] px-6 py-3 rounded-2xl border border-slate-800 shadow-inner">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">SISA WAKTU</span>
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-indigo-400" />
                    <SubTestCountdown
                      expiresAt={currentSubTest.expiresAt}
                      onExpire={() => {}}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {!session.isSubmitted && (
              <button 
                onClick={() => {
                  if (session.mode === 'tryout' && session.currentSubTestIdx !== undefined && session.subTests && session.currentSubTestIdx < session.subTests.length - 1) {
                    setShowSubTestConfirm(true);
                  } else {
                    setShowSubmitConfirm(true);
                  }
                }}
                className="ui-btn-warning px-10 py-3 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-900/20 active:scale-95"
              >
                {session.mode === 'tryout' && session.currentSubTestIdx !== undefined && session.subTests && session.currentSubTestIdx < session.subTests.length - 1 
                  ? 'SELESAI SUB-TES' 
                  : 'SELESAI UJIAN'}
              </button>
            )}
          </div>
        </nav>

        {/* Exit Confirmation Modal */}
        {/* Sub-test Confirmation Modal */}
        <AnimatePresence>
          {showSubTestConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={modalTransition}
                onClick={() => setShowSubTestConfirm(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
                transition={modalTransition}
                className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6"
              >
                <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
                  <Clock size={32} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Selesai Sub-tes?</h3>
                  <p className="text-slate-500 font-medium">Kamu tidak akan bisa kembali ke sub-tes ini setelah melanjutkan ke sub-tes berikutnya.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSubTestConfirm(false)}
                    className="ui-btn-secondary flex-1 py-4 rounded-2xl"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      nextSubTest();
                      setShowSubTestConfirm(false);
                      window.scrollTo(0, 0);
                    }}
                    className="ui-btn-primary flex-1 py-4 rounded-2xl shadow-lg shadow-indigo-100"
                  >
                    Lanjut
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Final Submit Confirmation Modal */}
        <AnimatePresence>
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={modalTransition}
                onClick={() => setShowSubmitConfirm(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
                transition={modalTransition}
                className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl space-y-6"
              >
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center text-green-600 mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Selesai Ujian?</h3>
                  <p className="text-slate-500 font-medium">Apakah kamu yakin ingin mengakhiri sesi ujian ini dan melihat hasilnya?</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSubmitConfirm(false)}
                    className="ui-btn-secondary flex-1 py-4 rounded-2xl"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      const report = submitQuiz();
                      if (report) {
                        setSelectedReport(report);
                      }
                      setShowSubmitConfirm(false);
                      setView('report');
                      window.scrollTo(0, 0);
                    }}
                    className="ui-btn-success flex-1 py-4 rounded-2xl shadow-lg shadow-green-100"
                  >
                    Ya, Selesai
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 max-w-[1400px] mx-auto w-full grid md:grid-cols-[1fr_380px] gap-0">
          {/* Main Question Area */}
          <div className="flex flex-col bg-white border-r border-slate-200">
            <div className="flex-1 p-8 md:p-12 space-y-10 overflow-y-auto">
              {currentRecommendation && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">Alasan Rekomendasi ({currentRecommendation.strategy.replace('_', ' ')})</p>
                  <p className="text-sm font-semibold text-amber-900 mt-1">{currentRecommendation.reason}</p>
                </div>
              )}
              <AnimatePresence mode="wait">
                <QuestionArea 
                  key={currentQuestion.id}
                  question={currentQuestion}
                  session={session}
                  answerQuestion={answerQuestion}
                />
              </AnimatePresence>
            </div>

            {/* Bottom Navigation Bar Resmi Style */}
            <div className="bg-[#f8fafc] border-t border-slate-200 p-6 flex justify-between items-center sticky bottom-0">
              <button 
                onClick={prevQuestion}
                disabled={session.currentIdx === 0}
                className="flex items-center gap-3 px-8 py-3 bg-[#34495e] text-white font-bold rounded-xl disabled:opacity-30 hover:bg-[#2c3e50] transition-all shadow-md uppercase text-xs tracking-widest"
              >
                <ChevronLeft size={18} /> Sebelumnya
              </button>
              
              <button 
                onClick={toggleMark}
                className={cn(
                  "flex items-center gap-3 px-10 py-3 rounded-xl font-black transition-all border-2 uppercase text-xs tracking-widest shadow-md",
                  session.marked[currentQuestion.id] 
                    ? "bg-[#f1c40f] border-[#f1c40f] text-slate-900" 
                    : "bg-[#f39c12] border-[#f39c12] text-white hover:bg-[#e67e22]"
                )}
              >
                <AlertTriangle size={18} /> Ragu-ragu
              </button>

              <button 
                onClick={nextQuestion}
                disabled={isLastQuestion}
                className="flex items-center gap-3 px-8 py-3 bg-[#3498db] text-white font-bold rounded-xl disabled:opacity-30 hover:bg-[#2980b9] transition-all shadow-md uppercase text-xs tracking-widest"
              >
                Selanjutnya <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Grid Resmi Style */}
          <div className="bg-[#f8fafc] p-8 space-y-8 overflow-y-auto border-l border-slate-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3 font-black text-slate-700 uppercase tracking-widest text-sm">
                  <LayoutGrid size={18} className="text-slate-400" />
                  Nomor Soal
                </div>
                <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-1 rounded">
                  {session.questions.length} TOTAL
                </span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {session.questions.map((q, idx) => {
                  if (session.mode === 'tryout' && currentSubTest) {
                    if (!currentSubTest.questionIndices.includes(idx)) return null;
                  }

                  const isAnswered = session.answers[q.id] !== undefined;
                  const isMarked = session.marked[q.id];
                  const isCurrent = session.currentIdx === idx;
                  const showResult = session.isSubmitted;
                  
                  let isCorrect = false;
                  if (showResult && isAnswered) {
                    if (q.type === 'multiple_choice') isCorrect = session.answers[q.id] === q.correctAnswer;
                    else if (q.type === 'complex_multiple_choice') isCorrect = q.complexOptions?.every((opt, i) => opt.correct === (session.answers[q.id] as boolean[])[i]) ?? false;
                    else if (q.type === 'short_answer') isCorrect = Number(session.answers[q.id]) === q.shortAnswerCorrect;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setSession(prev => prev ? { ...prev, currentIdx: idx } : null)}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all border-2 relative",
                        isCurrent ? "border-[#3498db] scale-110 z-10 shadow-lg" : "border-slate-200",
                        !showResult && isMarked ? "bg-[#f1c40f] border-[#f1c40f] text-slate-900" :
                        !showResult && isAnswered ? "bg-[#2ecc71] border-[#2ecc71] text-white" : "bg-white text-slate-400",
                        showResult && isCorrect ? "bg-green-500 border-green-500 text-white" : 
                        showResult && isAnswered && !isCorrect ? "bg-red-500 border-red-500 text-white" : 
                        !isAnswered && "bg-white"
                      )}
                    >
                      {idx + 1}
                      {isCurrent && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#3498db] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Keterangan</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                    <div className="w-4 h-4 rounded bg-[#2ecc71] border border-[#27ae60]" /> 
                    <span>SUDAH DIJAWAB</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                    <div className="w-4 h-4 rounded bg-[#f1c40f] border border-[#f39c12]" /> 
                    <span>RAGU-RAGU</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                    <div className="w-4 h-4 rounded bg-white border border-slate-200" /> 
                    <span>BELUM DIJAWAB</span>
                  </div>
                </div>
              </div>

              {session.isSubmitted && (
                <button 
                  onClick={() => {
                    setView('dashboard');
                    setSession(null);
                  }}
                  className="w-full bg-[#2b3e50] text-white py-4 rounded-xl font-black hover:bg-[#1e2b38] transition-all shadow-lg uppercase text-xs tracking-widest"
                >
                  Kembali ke Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ReportView = () => {
    if (!selectedReport) return null;
    const conceptEvaluations: ConceptEvaluation[] = selectedReport.conceptEvaluations ?? [];

    const masteryData = Object.entries(selectedReport.materialMastery).map(([name, value]) => ({
      subject: name,
      A: value,
      fullMark: 100,
    }));

    return (
      <div className="min-h-screen bg-[#f8fafc] pb-32">
        <nav className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setView('dashboard')} 
              aria-label="Kembali ke Dashboard"
              className={cn("p-3 hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 transition-all shadow-sm hover:shadow-md", iconOnlyFocusClass)}
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hasil Evaluasi Akademik</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">EduPath Analytics Report</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
            <Calendar size={18} className="text-indigo-600" />
            <span className="text-sm font-black text-indigo-900">
              {new Date(selectedReport.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-8 space-y-10">
          <div className="bg-slate-900 rounded-[56px] p-12 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -mr-48 -mt-48" />
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="w-64 h-64 rounded-full border-[16px] border-white/5 flex flex-col items-center justify-center relative bg-slate-900/50 backdrop-blur-xl">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">IRT Score</span>
                  <span className="text-7xl font-black text-white tracking-tighter">{Math.round(selectedReport.totalScore)}</span>
                  <div className="h-px w-24 bg-white/10 my-3" />
                  <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Target: 800+</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-8 py-3 rounded-3xl font-black text-sm shadow-2xl border-4 border-slate-900">
                  Top {Math.round(selectedReport.percentile)}% Nasional
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-10 w-full">
                <div className="space-y-3 p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Trophy size={18} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Peringkat Nasional</p>
                  </div>
                  <p className="text-4xl font-black text-white">#{selectedReport.nationalRank.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 font-medium">Dari {selectedReport.totalParticipants.toLocaleString()} peserta aktif</p>
                </div>

                <div className="space-y-3 p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-slate-400">
                    <TrendingUp size={18} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Potensi Kelulusan</p>
                  </div>
                  <p className={cn(
                    "text-4xl font-black",
                    selectedReport.totalScore > 650 ? "text-emerald-400" : selectedReport.totalScore > 550 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {selectedReport.totalScore > 650 ? 'Sangat Tinggi' : selectedReport.totalScore > 550 ? 'Tinggi' : 'Menengah'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Analisis komparatif skor PTN 2025</p>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-[48px] border border-slate-200 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-xl font-black text-slate-900">Cheat-Sheet Strategi 7 Hari</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visual Report Pack</p>
            </div>
            <img
              src={visualReport}
              alt="Diagram strategi belajar 7 hari yang membagi prioritas TPS, literasi, dan matematika berdasarkan hasil report."
              loading="lazy"
              decoding="async"
              className="w-full rounded-[28px] border border-slate-200 bg-slate-900"
            />
          </section>
          <div className="bg-white rounded-[40px] p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-2xl font-black text-slate-900">3 Konsep Prioritas Lemah</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {selectedReport.prioritizedWeakConcepts?.map((weak) => {
                const existingCycle = progress.remedialCycles.find((c) => c.concept === weak.concept && c.status !== 'completed');
                return (
                  <div key={weak.concept} className="p-5 rounded-2xl bg-rose-50 border border-rose-100 space-y-4">
                    <div>
                      <p className="text-xs text-rose-500 font-black uppercase tracking-widest">Mastery</p>
                      <p className="text-2xl font-black text-rose-700">{weak.score}%</p>
                    </div>
                    <p className="font-black text-slate-900">{weak.concept}</p>
                    {!existingCycle ? (
                      <button onClick={() => startRemedialBaseline(weak.concept)} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest">
                        Mulai Baseline Quiz
                      </button>
                    ) : (
                      <button onClick={() => continueToMaterial(weak.concept, existingCycle.id)} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest">
                        Baca Materi & Quiz Ulang
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="bg-white rounded-[56px] p-10 border border-slate-200 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                  <div className="bg-rose-50 p-3 rounded-2xl">
                    <Target size={24} className="text-rose-600" />
                  </div>
                  Peta Kekuatan Materi
                </h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                    <Radar
                      name="Mastery"
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.5}
                    />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-[56px] p-10 border border-slate-200 shadow-sm space-y-10">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-2xl">
                  <School size={24} className="text-indigo-600" />
                </div>
                Rekomendasi Strategis
              </h3>
              <div className="space-y-6">
                {selectedReport.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md">
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-900">{rec.ptn}</h4>
                      <p className="text-sm text-slate-500 font-black uppercase tracking-widest">{rec.prodi}</p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-3xl font-black tracking-tighter",
                        rec.chance > 70 ? "text-emerald-600" : rec.chance > 40 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {rec.chance}%
                      </div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Peluang</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={100} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-4">Expert Advice</p>
                <p className="text-lg font-medium leading-relaxed italic">
                  "Skor kamu sangat kuat di Penalaran Umum. Fokuslah meningkatkan Literasi Bahasa Inggris untuk memperluas pilihan prodi di universitas top."
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[56px] p-10 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-2xl font-black text-slate-900">Status Stabilitas Konsep</h3>
            {conceptEvaluations.length === 0 ? (
              <p className="text-slate-500 text-sm">Belum ada data longitudinal yang cukup untuk evaluasi konsep.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {conceptEvaluations.map((item, idx) => (
                  <div key={`${item.concept}-${idx}`} className="p-5 rounded-3xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900">{item.concept}</p>
                      <span className={cn(
                        "text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider",
                        item.status === 'Strong' ? "bg-emerald-100 text-emerald-700" :
                        item.status === 'Watchlist' ? "bg-amber-100 text-amber-700" :
                        item.status === 'Critical' ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-600"
                      )}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <p>Rolling Accuracy: <span className="font-black">{Math.round(item.rollingAccuracy * 100)}%</span></p>
                      <p>Confidence: <span className="font-black">{Math.round(item.confidenceBand.low * 100)}% - {Math.round(item.confidenceBand.high * 100)}%</span></p>
                      <p>Recent Trend: <span className="font-black">{item.recentTrend >= 0 ? '+' : ''}{item.recentTrend.toFixed(2)}</span></p>
                      <p>Sample Size: <span className="font-black">{item.sampleSize}</span></p>
                    </div>
                  </div>
                ))}
              </div>
          <div className="bg-white rounded-[56px] p-10 border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-2xl">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Rekomendasi Remedial</h3>
                <p className="text-sm text-slate-500 font-medium">Konsep dengan akurasi terendah dari sesi ini.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {(selectedReport.remedialConcepts ?? []).slice(0, 3).map((item, idx) => {
                const material = findMaterialFromRemedial(item.concept, item.materialId);
                return (
                  <div key={`${item.concept}-${idx}`} className="p-6 rounded-[32px] border border-amber-100 bg-amber-50/40 space-y-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Akurasi</p>
                      <p className="text-3xl font-black text-slate-900">{item.accuracy}%</p>
                      <p className="text-sm font-semibold text-slate-600 mt-1">{item.concept}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (material) setSelectedMaterial(material);
                        setView('study');
                      }}
                      className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors"
                    >
                      Pelajari konsep ini sekarang
                    </button>
                  </div>
                );
              })}
            </div>
            {(selectedReport.remedialConcepts ?? []).length === 0 && (
              <p className="text-slate-500 font-medium">Belum ada data remedial untuk laporan ini.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsView = () => {
    const data = (Object.entries(progress.categoryStats) as [Category, { correct: number; total: number }][]).map(([name, stats]) => ({
      name,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total
    }));

    const radarData = data.map(d => ({
      subject: d.name,
      A: d.accuracy,
      fullMark: 100
    }));

    return (
      <div className="max-w-6xl mx-auto p-6 space-y-10 pb-32">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('dashboard')}
              aria-label="Kembali ke Dashboard"
              className={cn("p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm", iconOnlyFocusClass)}
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analisis Performa</h1>
              <p className="text-slate-500 font-medium text-sm">Evaluasi mendalam kemampuanmu</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <TrendingUp className="text-indigo-600" size={20} />
            <span className="text-sm font-black text-indigo-700 uppercase tracking-wider">Progress Positif</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="ui-card p-8 rounded-[40px] space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-800 flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-xl">
                    <Target size={20} className="text-indigo-600" />
                  </div>
                  Akurasi per Kategori
                </h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={120} fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                    />
                    <Bar dataKey="accuracy" radius={[0, 12, 12, 0]} barSize={40}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.accuracy > 70 ? '#10b981' : entry.accuracy > 40 ? '#6366f1' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ui-card p-8 rounded-[40px] space-y-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3">
                <div className="bg-violet-50 p-2 rounded-xl">
                  <BarChart3 size={20} className="text-violet-600" />
                </div>
                Radar Penguasaan Materi
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <Radar
                      name="Mastery"
                      dataKey="A"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.6}
                    />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-slate-200">
              <h3 className="font-black text-xl flex items-center gap-3">
                <Award className="text-yellow-400" /> Pencapaian
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Total Skor IRT', value: progress.reports.length > 0 ? Math.round(progress.reports[0].totalScore) : 0, sub: 'Skor Tertinggi' },
                  { label: 'Soal Terjawab', value: progress.completedIds.length, sub: 'Dari 1000+ Soal' },
                  { label: 'Akurasi Global', value: `${data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.accuracy, 0) / data.length) : 0}%`, sub: 'Rata-rata' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/5 p-5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-3xl font-black mt-1">{item.value}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ui-card p-8 rounded-[40px] space-y-6">
              <h3 className="font-black text-slate-800">Riwayat Tryout</h3>
              <div className="space-y-4">
                {progress.reports.length > 0 ? progress.reports.map((report) => (
                  <button 
                    key={report.id}
                    onClick={() => handleViewReport(report)}
                    className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-indigo-50 hover:border-indigo-100 transition-all"
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="font-black text-slate-900">Score: {Math.round(report.totalScore)}</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </button>
                )) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Search size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">Belum ada riwayat tes.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
    'All': { label: 'Semua Materi', color: 'text-slate-700', bg: 'bg-slate-800', icon: <LayoutGrid size={18} />, desc: 'Semua topik SNBT 2026' },
    'TPS': { label: 'TPS', color: 'text-blue-700', bg: 'bg-blue-600', icon: <Target size={18} />, desc: 'Tes Potensi Skolastik' },
    'Literasi Indonesia': { label: 'Literasi ID', color: 'text-rose-700', bg: 'bg-rose-600', icon: <BookOpen size={18} />, desc: 'Bahasa Indonesia' },
    'Literasi Inggris': { label: 'Literasi EN', color: 'text-amber-700', bg: 'bg-amber-500', icon: <GraduationCap size={18} />, desc: 'Bahasa Inggris' },
    'Penalaran Matematika': { label: 'Matematika', color: 'text-emerald-700', bg: 'bg-emerald-600', icon: <BarChart3 size={18} />, desc: 'Penalaran Matematika' },
  };

  const CATEGORY_VISUALS: Record<string, { src: string; alt: string; points: string[] }> = {
    TPS: {
      src: visualTPS,
      alt: 'Diagram langkah berpikir TPS mulai dari mengenali pola, eliminasi opsi, hingga validasi jawaban akhir.',
      points: ['Kenali pola inti cepat', 'Eliminasi opsi kontradiktif', 'Validasi dengan konteks soal'],
    },
    'Literasi Indonesia': {
      src: visualLiterasi,
      alt: 'Contoh anotasi bacaan literasi Indonesia untuk menemukan gagasan utama, bukti, dan inferensi.',
      points: ['Tandai tesis penulis', 'Cari bukti eksplisit', 'Tarik inferensi implisit'],
    },
    'Literasi Inggris': {
      src: visualLiterasi,
      alt: 'Cheat-sheet literasi Inggris untuk active reading, menemukan claim, evidence, dan inference.',
      points: ['Scan kata kunci paragraf', 'Bedakan fakta dan opini', 'Verifikasi inference dengan bukti'],
    },
    'Penalaran Matematika': {
      src: visualMatematika,
      alt: 'Skema penalaran matematika: model variabel, hitung efisien, lalu uji batas hasil.',
      points: ['Modelkan variabel utama', 'Gunakan bentuk hitung sederhana', 'Cek satuan dan batas nilai'],
    },
  };

  const filteredMaterials = STUDY_MATERIALS.filter(m =>
    categoryFilter === 'All' || m.category === categoryFilter
  );

  const getReadingTime = (content: string) => Math.max(2, Math.ceil(content.split(' ').length / 200));
  const checkpointScale = [
    { label: 'Belum Yakin', value: 30 },
    { label: 'Lumayan', value: 70 },
    { label: 'Siap Kuis', value: 100 },
  ];

  const getBlockCheckpointAverage = (material: StudyMaterial, blockIdx: number) => {
    const block = material.learningBlocks[blockIdx];
    const scores = block.checkpoints.map(item => checkpointScores[item.id]).filter((v): v is number => typeof v === 'number');
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };
  const getPriorityLabel = (priority?: StudyMaterial['priority']) => priority ?? 'medium';

  const StudyView = () => (
    <div className="min-h-screen bg-[#f0f4ff] pb-32">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <img
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5882?auto=format&fit=crop&w=1400&q=60"
          alt="Foto perpustakaan sebagai hero branding layar belajar"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          fetchPriority="high"
        />
        <div className="relative max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('dashboard')}
                aria-label="Kembali ke Dashboard"
                className={cn("p-2 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors", iconOnlyFocusClass)}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-indigo-300 font-black text-xs uppercase tracking-widest">Pustaka Belajar</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Materi Lengkap<br />
              <span className="text-indigo-400">SNBT 2026</span>
            </h1>
            <p className="text-slate-300 text-lg font-medium leading-relaxed max-w-lg">
              {STUDY_MATERIALS.length} topik komprehensif mencakup seluruh sub-tes, disusun berdasarkan kisi-kisi resmi SNPMB.
            </p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(CATEGORY_META).filter(([k]) => k !== 'All').map(([key, meta]) => (
                <div key={key} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                  <span className="text-white/60">{meta.icon}</span>
                  <span className="text-white text-xs font-black">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-64 h-64 bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=70"
                alt="Siswa belajar sebagai visual branding belajar mandiri"
                className="w-full h-full object-cover rounded-[40px] opacity-60"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/70 to-transparent rounded-[40px]" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-white font-black text-2xl">{STUDY_MATERIALS.length}</div>
                <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Topik Materi</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all border",
                categoryFilter === key
                  ? `${meta.bg} text-white border-transparent shadow-lg`
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:shadow-md"
              )}
            >
              {meta.icon}
              {meta.label}
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                categoryFilter === key ? "bg-white/20" : "bg-slate-100 text-slate-400"
              )}>
                {key === 'All' ? STUDY_MATERIALS.length : STUDY_MATERIALS.filter(m => m.category === key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Material Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material, idx) => {
            const meta = CATEGORY_META[material.category] || CATEGORY_META['TPS'];
            const readMins = getReadingTime(material.fullContent);
            const isPrediksi = material.id.startsWith('pred');
            return (
              <motion.button
                key={material.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => {
                  setSelectedMaterial(material);
                  setRevealedCheckpointAnswers({});
                }}
                transition={prefersReducedMotion ? { duration: 0.01 } : { duration: MOTION_DURATION.page, delay: Math.min(idx * 0.02, 0.12), ease: 'easeOut' }}
                whileHover={prefersReducedMotion ? undefined : { y: -2, transition: { duration: MOTION_DURATION.micro } }}
                onClick={() => setSelectedMaterial(material)}
                className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl text-left overflow-hidden group transition-all duration-300"
              >
                {/* Card header strip */}
                <div className={cn("h-2 w-full", meta.bg, isPrediksi && "bg-gradient-to-r from-violet-600 to-indigo-500")} />
                <div className="p-7 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0", meta.bg)}>
                      {isPrediksi ? <Zap size={22} /> : meta.icon}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mt-1">
                      <Clock size={12} />
                      <span>{readMins} menit</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", 
                        isPrediksi ? "bg-violet-50 text-violet-600" : `${meta.bg} bg-opacity-10 ${meta.color}`
                      )}>
                        {isPrediksi ? '🔮 Prediksi 2026' : material.category}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                        getPriorityLabel(material.priority) === 'high'
                          ? "bg-rose-100 text-rose-700"
                          : getPriorityLabel(material.priority) === 'medium'
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}>
                        Prioritas {getPriorityLabel(material.priority)}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
                      {material.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{material.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                    Pelajari Materi <ArrowRight size={14} />
                  </div>
                </div>
              </motion.button>
            );
          })}
          {filteredMaterials.length === 0 && (
            <div className="col-span-full py-24 text-center space-y-4 bg-white rounded-[32px] border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-bold">Tidak ada materi untuk kategori ini.</p>
              <button onClick={() => setCategoryFilter('All')} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                Tampilkan Semua
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-2xl font-black text-slate-900">Visual Proses Berpikir per Kategori</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Style Pack Konsisten</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {Object.entries(CATEGORY_VISUALS).map(([name, visual]) => (
              <article key={name} className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
                <img
                  src={visual.src}
                  alt={visual.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-44 object-cover border-b border-slate-100"
                />
                <div className="p-6 space-y-3">
                  <h4 className="font-black text-slate-900">{name}</h4>
                  <ul className="space-y-1.5">
                    {visual.points.map((point) => (
                      <li key={point} className="text-sm text-slate-600 font-medium">• {point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Selected Material Detail */}
        {selectedMaterial && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f0f4ff]">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
              {/* Detail Header */}
              <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-200">
                {/* Hero with background image */}
                <div className="relative min-h-[280px] flex items-end overflow-hidden">
                  <img
                    src={
                      selectedMaterial.category === 'TPS'
                        ? 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1000&q=60'
                        : selectedMaterial.category === 'Literasi Indonesia'
                        ? 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=60'
                        : selectedMaterial.category === 'Literasi Inggris'
                        ? 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1000&q=60'
                        : 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1000&q=60'
                    }
                    alt={`Visual pendukung materi ${selectedMaterial.category} untuk topik ${selectedMaterial.title}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
                  <div className="relative z-10 p-10 space-y-4 w-full">
                    <button
                      onClick={() => {
                        setSelectedMaterial(null);
                        setRevealedCheckpointAnswers({});
                      }}
                      className="flex items-center gap-2 text-white/70 hover:text-white font-black text-xs uppercase tracking-widest transition-colors mb-4"
                    >
                      <ChevronLeft size={16} /> Kembali ke Daftar
                    </button>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                        {selectedMaterial.category}
                      </span>
                      <span className="px-4 py-1.5 bg-indigo-500/30 backdrop-blur-sm rounded-full text-indigo-200 text-[10px] font-black uppercase tracking-widest border border-indigo-400/30">
                        {selectedMaterial.concept}
                      </span>
                      <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/70 text-[10px] font-bold border border-white/10">
                        ⏱ {getReadingTime(selectedMaterial.fullContent)} menit baca
                      </span>
                      <span className={cn(
                        "px-4 py-1.5 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest border",
                        getPriorityLabel(selectedMaterial.priority) === 'high'
                          ? "bg-rose-500/30 text-rose-100 border-rose-300/40"
                          : getPriorityLabel(selectedMaterial.priority) === 'medium'
                          ? "bg-amber-500/30 text-amber-100 border-amber-300/40"
                          : "bg-emerald-500/30 text-emerald-100 border-emerald-300/40"
                      )}>
                        Prioritas {getPriorityLabel(selectedMaterial.priority)}
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                      {selectedMaterial.title}
                    </h2>
                  </div>
                </div>

                {/* Content */}
                <div className="p-10 space-y-10">
                  {/* Key Takeaway */}
                  <div className="bg-indigo-50 rounded-[32px] p-8 border border-indigo-100 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 opacity-5">
                      <Zap size={140} />
                    </div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm">
                        <Zap size={20} className="text-amber-500" />
                      </div>
                      <h4 className="font-black text-indigo-900 text-lg">Ringkasan Kunci</h4>
                    </div>
                    <p className="text-indigo-900 text-lg leading-relaxed font-medium italic relative z-10">
                      "{selectedMaterial.summary}"
                    </p>
                  </div>

                  {/* Modular Blocks */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                        <span>Progress Materi Bertahap</span>
                        <span>{Math.min(activeBlockIdx + 1, selectedMaterial.learningBlocks.length)}/{selectedMaterial.learningBlocks.length} blok</span>
                      </div>
                      <ProgressBar current={Math.min(activeBlockIdx + 1, selectedMaterial.learningBlocks.length)} total={selectedMaterial.learningBlocks.length} />
                    </div>

                    {selectedMaterial.learningBlocks.map((block, idx) => {
                      const isActive = idx === activeBlockIdx;
                      const isDone = idx < activeBlockIdx;
                      const checkpointDone = block.checkpoints.every(item => typeof checkpointScores[item.id] === 'number');
                      const blockScore = getBlockCheckpointAverage(selectedMaterial, idx);
                      return (
                        <div key={block.id} className={cn("rounded-[28px] border p-7 space-y-5 transition-all", isActive ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200")}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Blok {idx + 1} • {block.type.replace('_', ' ')}</p>
                              <h4 className="text-2xl font-black text-slate-900">{block.title}</h4>
                            </div>
                            {isDone && <CheckCircle2 className="text-green-600" />}
                          </div>

                          {(isActive || isDone) && (
                            <>
                              <div className="prose prose-slate max-w-none text-slate-700">
                                <ReactMarkdown>{block.content}</ReactMarkdown>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Mini Checkpoint (2-3 item)</p>
                                {block.checkpoints.map((checkpoint) => (
                                  <div key={checkpoint.id} className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-700">{checkpoint.prompt}</p>
                                    <div className="flex flex-wrap gap-2">
                                      {checkpointScale.map((scale) => (
                                        <button
                                          key={scale.label}
                                          onClick={() => isActive && setCheckpointScores(prev => ({ ...prev, [checkpoint.id]: scale.value }))}
                                          disabled={!isActive}
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                            checkpointScores[checkpoint.id] === scale.value
                                              ? "bg-indigo-600 text-white border-indigo-600"
                                              : "bg-white text-slate-600 border-slate-300 hover:border-indigo-300"
                                          )}
                                        >
                                          {scale.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between pt-2">
                                  <p className="text-xs text-slate-500 font-semibold">Skor checkpoint blok: <span className="text-slate-800">{blockScore}%</span></p>
                                  {isActive && (
                                    <button
                                      onClick={() => {
                                        if (!checkpointDone) return;
                                        updateConceptMasteryFromCheckpoint(selectedMaterial.concept, blockScore);
                                        if (idx < selectedMaterial.learningBlocks.length - 1) setActiveBlockIdx(idx + 1);
                                      }}
                                      disabled={!checkpointDone}
                                      className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest",
                                        checkpointDone ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                      )}
                                    >
                                      {idx === selectedMaterial.learningBlocks.length - 1 ? 'Selesai Blok' : 'Lanjut Blok'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    <div className="bg-amber-50 border border-amber-200 rounded-[28px] p-7 space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-amber-700">Mode Pengulangan Cepat • 30–60 detik</p>
                      <p className="text-amber-900 font-semibold">
                        {selectedMaterial.learningBlocks.find(block => block.type === 'quick_drill')?.quickRevision ?? 'Baca ringkasan, sebutkan 1 jebakan umum, lalu jawab 1 soal cepat.'}
                      </p>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Ringkasan 30 Detik</p>
                      <p className="text-slate-700 font-medium leading-relaxed">{selectedMaterial.quick30sSummary ?? selectedMaterial.summary}</p>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-200 p-6">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Dampak ke Skor</p>
                      <p className="text-slate-700 font-medium leading-relaxed">{selectedMaterial.scoreImpact ?? 'Dampak skor menengah: fokus pada penguatan akurasi dan konsistensi.'}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="font-black text-slate-900 text-xl">Blok Studi + Checkpoint Interaktif</h4>
                    {(selectedMaterial.studyBlocks ?? []).map((block) => (
                      <div key={block.id} className="bg-white border border-slate-200 rounded-[28px] p-6 space-y-5">
                        <h5 className="font-black text-slate-900">{block.title}</h5>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Konsep Inti</p>
                            <p className="text-sm text-slate-700">{block.coreConcept}</p>
                          </div>
                          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Worked Example</p>
                            <p className="text-sm text-indigo-900">{block.workedExample}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-widest text-rose-600">Kesalahan Umum</p>
                          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                            {block.commonMistakes.map((mistake, idx) => <li key={idx}>{mistake}</li>)}
                          </ul>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-1">Latihan Cepat</p>
                          <p className="text-sm text-emerald-900">{block.quickExercise}</p>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                          <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Kapan Pakai Strategi Ini</p>
                          <p className="text-sm text-amber-900">{block.strategyWhenToUse}</p>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Checkpoint (2-3 Soal Pendek)</p>
                          {block.checkpoints.map((cp, cpIdx) => {
                            const answerKey = `${block.id}-${cpIdx}`;
                            const revealed = !!revealedCheckpointAnswers[answerKey];
                            return (
                              <div key={answerKey} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                                <p className="text-sm font-bold text-slate-800">{cpIdx + 1}. {cp.question}</p>
                                {revealed && <p className="text-sm text-emerald-700 mt-2"><strong>Jawaban:</strong> {cp.answer}</p>}
                                <button
                                  onClick={() => setRevealedCheckpointAnswers(prev => ({ ...prev, [answerKey]: !revealed }))}
                                  className="mt-3 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800"
                                >
                                  {revealed ? 'Sembunyikan Jawaban' : 'Lihat Jawaban'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-[28px] border border-slate-200 p-6">
                    <h4 className="font-black text-slate-900 mb-3">Catatan Revisi Berkala</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {(selectedMaterial.revisionNotes ?? []).map((note, idx) => (
                        <li key={idx} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-600" /> {note}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Full Content */}
                  <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-h3:text-xl prose-p:text-lg prose-p:leading-relaxed prose-li:text-base prose-li:leading-relaxed prose-table:text-sm prose-th:bg-slate-50 prose-th:p-3 prose-td:p-3 prose-td:border prose-td:border-slate-100">
                    <div className="text-slate-700">
                      <ReactMarkdown>{selectedMaterial.fullContent}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Sources */}
                  <div className="pt-8 border-t border-slate-100 space-y-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-xl">
                        <Search size={18} className="text-indigo-600" />
                      </div>
                      Referensi Terpercaya
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedMaterial.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                              <School size={18} />
                            </div>
                            <span className="font-bold text-slate-700 group-hover:text-indigo-900 text-sm">{source.name}</span>
                          </div>
                          <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {activeRemedialCycleId && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-[28px] p-6 space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Langkah Berikutnya</p>
                      <p className="text-slate-800 font-bold">Setelah membaca materi, lanjutkan mini-quiz khusus konsep ini untuk mengukur score-after.</p>
                      <button
                        onClick={() => {
                          markMaterialRead(activeRemedialCycleId);
                          startSession('mini', undefined, { concept: selectedMaterial.concept, remedialPhase: 'after', cycleId: activeRemedialCycleId });
                          setSelectedMaterial(null);
                          setActiveRemedialCycleId(null);
                          setView('quiz');
                        }}
                        className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest"
                      >
                        Mulai Mini-Quiz Konsep Ini
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={pageTransition}
          >
            <DashboardView />
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 px-8 py-4 rounded-[32px] shadow-2xl shadow-indigo-100 flex gap-12 z-50">
              <button
                onClick={() => setView('dashboard')}
                aria-label="Buka Dashboard"
                aria-current={view === 'dashboard' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "bg-indigo-600 text-white shadow-xl shadow-indigo-200", iconOnlyFocusClass)}
              >
                <Home size={24} />
              </button>
              <button
                onClick={() => setView('study')}
                aria-label="Buka Belajar Mandiri"
                aria-current={view === 'study' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "text-slate-400 hover:text-slate-600", iconOnlyFocusClass)}
              >
                <BookOpen size={24} />
              </button>
              <button
                onClick={() => setView('analytics')}
                aria-label="Buka Analisis Performa"
                aria-current={view === 'analytics' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "text-slate-400 hover:text-slate-600", iconOnlyFocusClass)}
              >
                <BarChart3 size={24} />
              </button>
            </nav>
          </motion.div>
        )}

        {view === 'quiz' && (
          <motion.div 
            key="quiz"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={pageTransition}
          >
            <QuizView />
          </motion.div>
        )}

        {view === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={pageTransition}
          >
            <AnalyticsView />
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 px-8 py-4 rounded-[32px] shadow-2xl shadow-indigo-100 flex gap-12 z-50">
              <button
                onClick={() => setView('dashboard')}
                aria-label="Buka Dashboard"
                aria-current={view === 'dashboard' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "text-slate-400 hover:text-slate-600", iconOnlyFocusClass)}
              >
                <Home size={24} />
              </button>
              <button
                onClick={() => setView('study')}
                aria-label="Buka Belajar Mandiri"
                aria-current={view === 'study' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "text-slate-400 hover:text-slate-600", iconOnlyFocusClass)}
              >
                <BookOpen size={24} />
              </button>
              <button
                onClick={() => setView('analytics')}
                aria-label="Buka Analisis Performa"
                aria-current={view === 'analytics' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "bg-indigo-600 text-white shadow-xl shadow-indigo-200", iconOnlyFocusClass)}
              >
                <BarChart3 size={24} />
              </button>
            </nav>
          </motion.div>
        )}

        {view === 'report' && (
          <motion.div 
            key="report"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={pageTransition}
          >
            <ReportView />
          </motion.div>
        )}

        {view === 'study' && (
          <motion.div 
            key="study"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={pageTransition}
          >
            <StudyView />
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 px-8 py-4 rounded-[32px] shadow-2xl shadow-indigo-100 flex gap-12 z-50">
              <button
                onClick={() => setView('dashboard')}
                aria-label="Buka Dashboard"
                aria-current={view === 'dashboard' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "text-slate-400 hover:text-slate-600", iconOnlyFocusClass)}
              >
                <Home size={24} />
              </button>
              <button
                onClick={() => setView('study')}
                aria-label="Buka Belajar Mandiri"
                aria-current={view === 'study' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "bg-indigo-600 text-white shadow-xl shadow-indigo-200", iconOnlyFocusClass)}
              >
                <BookOpen size={24} />
              </button>
              <button
                onClick={() => setView('analytics')}
                aria-label="Buka Analisis Performa"
                aria-current={view === 'analytics' ? 'page' : undefined}
                className={cn("p-3 rounded-2xl transition-all", "text-slate-400 hover:text-slate-600", iconOnlyFocusClass)}
              >
                <BarChart3 size={24} />
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
