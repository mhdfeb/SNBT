import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
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
import { Difficulty, Category, Question, AssessmentReport, StudyMaterial, QuizSession } from './types/quiz';
import { STUDY_MATERIALS } from './data/materials';
import ReactMarkdown from 'react-markdown';
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
} from 'recharts';

const LazyImage = lazy(() => Promise.resolve({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
  )
}));

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  'All': { label: 'Semua Materi', color: 'text-slate-700', bg: 'bg-slate-800', icon: <LayoutGrid size={18} />, desc: 'Semua topik SNBT 2026' },
  'TPS': { label: 'TPS', color: 'text-blue-700', bg: 'bg-blue-600', icon: <Target size={18} />, desc: 'Tes Potensi Skolastik' },
  'Literasi Indonesia': { label: 'Literasi ID', color: 'text-rose-700', bg: 'bg-rose-600', icon: <BookOpen size={18} />, desc: 'Bahasa Indonesia' },
  'Literasi Inggris': { label: 'Literasi EN', color: 'text-amber-700', bg: 'bg-amber-500', icon: <GraduationCap size={18} />, desc: 'Bahasa Inggris' },
  'Penalaran Matematika': { label: 'Matematika', color: 'text-emerald-700', bg: 'bg-emerald-600', icon: <BarChart3 size={18} />, desc: 'Penalaran Matematika' },
};

const ProgressBar = ({ current, total, color = "bg-indigo-600" }: { current: number; total: number; color?: string }) => (
  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden" aria-hidden="true">
    <motion.div
      className={cn("h-full", color)}
      initial={{ width: 0 }}
      animate={{ width: `${(current / (total || 1)) * 100}%` }}
    />
  </div>
);

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
    <span className={cn("text-2xl font-black font-mono tracking-tighter", secs < 60 ? "text-rose-400 animate-pulse-safe" : "text-white")}>
      {formatTime(secs)}
    </span>
  );
});

const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => {
  const colors = {
    easy: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    trap: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border", colors[difficulty])}>
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
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isSubmitted, currentIdx]);

  return (
    <div className="flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
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
  const currentAnswer = session.answers[question.id];
  const isSubmitted = session.isSubmitted;

  return (
    <motion.div key={question.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{question.category}</span>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{question.concept}</span>
          <QuestionTimer isSubmitted={session.isSubmitted} currentIdx={session.currentIdx} />
        </div>
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown>{question.question}</ReactMarkdown>
        </div>
      </div>

      <div>
        {question.type === 'multiple_choice' && (
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
                <button
                  key={idx}
                  className={optionClass}
                  onClick={() => !isSubmitted && answerQuestion(idx)}
                  disabled={isSubmitted}
                  aria-label={`Pilih opsi ${String.fromCharCode(65 + idx)}`}
                >
                  <span className="font-black text-xs mt-0.5 min-w-[20px]">{String.fromCharCode(65 + idx)}.</span>
                  <div className="prose prose-sm max-w-none"><ReactMarkdown>{option}</ReactMarkdown></div>
                  {isSubmitted && isCorrect && <CheckCircle2 size={18} className="ml-auto text-green-500 shrink-0 mt-0.5" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle size={18} className="ml-auto text-red-500 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'complex_multiple_choice' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Pilih Benar/Salah untuk setiap pernyataan:</p>
            {question.complexOptions?.map((opt, idx) => {
              const answers: boolean[] = Array.isArray(currentAnswer) ? currentAnswer : Array(question.complexOptions?.length ?? 0).fill(undefined);
              const userAnswer = answers[idx];
              const isCorrect = opt.correct;
              let rowClass = "p-5 rounded-2xl border-2 transition-all";
              rowClass += isSubmitted ? (userAnswer === isCorrect ? " bg-green-50 border-green-300" : " bg-red-50 border-red-300") : " bg-white border-slate-200";

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
                        btnClass += isSelected ? " bg-indigo-600 border-indigo-600 text-white" : " bg-slate-100 border-slate-200 text-slate-600 hover:border-indigo-300";
                      }
                      return (
                        <button key={String(val)} className={btnClass} disabled={isSubmitted} aria-label={`Pilih ${label} untuk pernyataan ${idx + 1}`} onClick={() => {
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
        )}

        {question.type === 'short_answer' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Masukkan jawaban angka:</p>
            <input
              type="number"
              value={currentAnswer ?? ''}
              onChange={(e) => !isSubmitted && answerQuestion(Number(e.target.value))}
              disabled={isSubmitted}
              placeholder="Jawaban..."
              aria-label="Input jawaban angka"
              className={cn(
                "w-full p-5 rounded-2xl border-2 text-lg font-bold outline-none transition-all",
                isSubmitted
                  ? Number(currentAnswer) === question.shortAnswerCorrect ? "bg-green-50 border-green-400 text-green-800" : "bg-red-50 border-red-400 text-red-800"
                  : "bg-white border-slate-200 focus:border-indigo-400 text-slate-800"
              )}
            />
            {isSubmitted && <p className="text-sm font-semibold">Jawaban benar: <span className="text-green-700 font-black">{question.shortAnswerCorrect}</span></p>}
          </div>
        )}
      </div>

      {isSubmitted && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 font-black text-sm uppercase tracking-widest"><Info size={16} /> Pembahasan</div>
          <div className="prose prose-sm max-w-none text-indigo-900"><ReactMarkdown>{question.explanation}</ReactMarkdown></div>
        </div>
      )}
    </motion.div>
  );
});

const FloatingNav = React.memo(({ view, setView }: { view: string; setView: (v: any) => void }) => {
  const itemClass = "p-3 rounded-2xl transition-all";
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 px-8 py-4 rounded-[32px] shadow-2xl shadow-indigo-100 flex gap-12 z-50" aria-label="Navigasi utama">
      <button onClick={() => setView('dashboard')} aria-current={view === 'dashboard' ? 'page' : undefined} aria-label="Buka dashboard" className={cn(itemClass, view === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600')}><Home size={24} /></button>
      <button onClick={() => setView('study')} aria-current={view === 'study' ? 'page' : undefined} aria-label="Buka materi belajar" className={cn(itemClass, view === 'study' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600')}><BookOpen size={24} /></button>
      <button onClick={() => setView('analytics')} aria-current={view === 'analytics' ? 'page' : undefined} aria-label="Buka analitik" className={cn(itemClass, view === 'analytics' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600')}><BarChart3 size={24} /></button>
    </nav>
  );
});

export default function App() {
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
    setSession
  } = useQuiz();

  const reduceMotion = useReducedMotion();
  const motionTransition = useMemo(() => reduceMotion ? { duration: 0 } : { duration: 0.3 }, [reduceMotion]);

  const [view, setView] = useState<'dashboard' | 'quiz' | 'analytics' | 'report' | 'study'>('dashboard');
  const [selectedReport, setSelectedReport] = useState<AssessmentReport | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [showSubTestConfirm, setShowSubTestConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const handleStart = (mode: 'tryout' | 'mini' | 'daily' | 'category', category?: Category) => {
    startSession(mode, category);
    setView('quiz');
  };

  const currentQuestion = session?.questions[session.currentIdx];
  const isLastQuestion = session && session.currentIdx === session.questions.length - 1;
  const currentSubTest = session?.subTests && session.currentSubTestIdx !== undefined ? session.subTests[session.currentSubTestIdx] : null;

  const analyticsData = useMemo(() => (Object.entries(progress.categoryStats) as [Category, { correct: number; total: number }][]).map(([name, stats]) => ({
    name,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    total: stats.total
  })), [progress.categoryStats]);

  const filteredMaterials = useMemo(() => STUDY_MATERIALS.filter(m => categoryFilter === 'All' || m.category === categoryFilter), [categoryFilter]);

  const getReadingTime = useCallback((content: string) => Math.max(2, Math.ceil(content.split(' ').length / 200)), []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }} transition={motionTransition}>
          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto p-6 space-y-10 pb-32">
              <h1 className="text-display text-slate-900">Taklukkan Kampus Impian.</h1>
              <div className="grid md:grid-cols-3 gap-6">
                <button onClick={() => handleStart('tryout')} aria-label="Mulai tryout full" className="card-elevated p-8 text-left">Mulai Tryout Full</button>
                <button onClick={() => handleStart('mini')} aria-label="Mulai mini tryout" className="card-elevated p-8 text-left">Mini Tryout</button>
                <button onClick={() => setView('study')} aria-label="Masuk halaman materi" className="card-elevated p-8 text-left">Belajar Mandiri</button>
              </div>
              <FloatingNav view={view} setView={setView} />
            </div>
          )}

          {view === 'quiz' && session && currentQuestion && (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
              <nav className="bg-[#1e293b] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xl" aria-label="Header ujian">
                <span className="font-black">SIMULASI SNBT 2026</span>
                <button
                  onClick={() => {
                    if (session.mode === 'tryout' && session.currentSubTestIdx !== undefined && session.subTests && session.currentSubTestIdx < session.subTests.length - 1) setShowSubTestConfirm(true);
                    else setShowSubmitConfirm(true);
                  }}
                  aria-label="Selesaikan sesi"
                  className="bg-[#f59e0b] text-slate-900 px-10 py-3 rounded-2xl font-black"
                >
                  Selesai
                </button>
              </nav>
              <div className="flex-1 max-w-[1400px] mx-auto w-full grid md:grid-cols-[1fr_380px] gap-0">
                <div className="flex flex-col bg-white border-r border-slate-200">
                  <div className="flex-1 p-8 md:p-12 space-y-10 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <QuestionArea key={currentQuestion.id} question={currentQuestion} session={session} answerQuestion={answerQuestion} />
                    </AnimatePresence>
                  </div>
                  <div className="bg-[#f8fafc] border-t border-slate-200 p-6 flex justify-between items-center sticky bottom-0">
                    <button onClick={prevQuestion} aria-label="Soal sebelumnya" disabled={session.currentIdx === 0} className="btn-primary">Sebelumnya</button>
                    <button onClick={toggleMark} aria-label="Tandai soal ragu-ragu" className="btn-secondary">Ragu-ragu</button>
                    <button onClick={nextQuestion} aria-label="Soal berikutnya" disabled={!!isLastQuestion} className="btn-primary">Selanjutnya</button>
                  </div>
                </div>
                <aside className="bg-[#f8fafc] p-8 space-y-8 overflow-y-auto border-l border-slate-200" aria-label="Navigasi nomor soal">
                  <div className="grid grid-cols-5 gap-2">
                    {session.questions.map((q, idx) => (
                      <button key={q.id} onClick={() => setSession(prev => prev ? { ...prev, currentIdx: idx } : null)} aria-label={`Buka soal ${idx + 1}`} aria-current={session.currentIdx === idx ? 'page' : undefined} className="aspect-square rounded-lg border-2">{idx + 1}</button>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          )}

          {view === 'analytics' && (
            <div className="max-w-6xl mx-auto p-6 space-y-10 pb-32">
              <h1 className="text-3xl font-black">Analisis Performa</h1>
              <div className="h-[320px] bg-white rounded-[32px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={120} fontSize={10} tick={{ fill: '#64748b', fontWeight: 700 }} />
                    <Tooltip />
                    <Bar dataKey="accuracy" radius={[0, 12, 12, 0]} barSize={24}>{analyticsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.accuracy > 70 ? '#10b981' : entry.accuracy > 40 ? '#6366f1' : '#ef4444'} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <FloatingNav view={view} setView={setView} />
            </div>
          )}

          {view === 'report' && selectedReport && (
            <div className="min-h-screen bg-[#f8fafc] p-8">Report {Math.round(selectedReport.totalScore)}</div>
          )}

          {view === 'study' && (
            <div className="min-h-screen bg-[#f0f4ff] pb-32">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10">
                <Suspense fallback={<div className="h-40" />}>
                  <LazyImage src="https://images.unsplash.com/photo-1481627834876-b7833e8f5882?auto=format&fit=crop&w=1400&q=60" alt="Library" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                </Suspense>
                <h1 className="text-5xl font-black text-white relative z-10">Materi Lengkap SNBT 2026</h1>
              </div>
              <div className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
                <div className="flex flex-wrap gap-3">
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <button key={key} onClick={() => setCategoryFilter(key)} aria-current={categoryFilter === key ? 'page' : undefined} aria-label={`Filter ${meta.label}`} className="card-elevated px-5 py-3">{meta.label}</button>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((material) => (
                    <button key={material.id} onClick={() => setSelectedMaterial(material)} aria-label={`Buka materi ${material.title}`} className="bg-white rounded-[32px] border border-slate-200 shadow-sm text-left overflow-hidden group transition-all duration-300 p-6">
                      <h3 className="text-lg font-black">{material.title}</h3>
                      <p className="text-slate-500 text-sm">{getReadingTime(material.fullContent)} menit baca</p>
                    </button>
                  ))}
                </div>
              </div>
              <FloatingNav view={view} setView={setView} />
            </div>
          )}

          <AnimatePresence>
            {showSubTestConfirm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60" onClick={() => setShowSubTestConfirm(false)} />}
            {showSubmitConfirm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60" onClick={() => setShowSubmitConfirm(false)} />}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
