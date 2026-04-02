import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Home, LoaderCircle, Target } from 'lucide-react';
import { useQuiz } from './hooks/useQuiz';
import { QUESTIONS } from './data/questions';
import { PTN_DATA } from './data/ptn';
import type { Question, QuestionAnswer } from './types/quiz';
import { Button, Card, Field, StatePanel } from './components/ui';
import { trackEvent, trackPageView } from './lib/analytics';
import { markMainPageRender, markQuestionNavigationLatency } from './lib/slo';

function QuestionCard({
  question,
  answer,
  onAnswer,
  submitted,
}: {
  question: Question;
  answer: QuestionAnswer;
  onAnswer: (value: QuestionAnswer) => void;
  submitted: boolean;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    cardRef.current?.focus();
  }, [question.id]);

  if (question.type === 'short_answer') {
    return (
      <Card>
        <div ref={cardRef} tabIndex={-1} className="space-y-3 focus-visible:outline-none" aria-live="polite">
          <p className="font-semibold text-slate-900">{question.question}</p>
          <Field
            label="Jawaban singkat"
            type="number"
            value={typeof answer === 'number' ? answer : ''}
            disabled={submitted}
            onChange={(e) => onAnswer(Number(e.target.value))}
            placeholder="Masukkan jawaban"
            aria-label="Input jawaban numerik"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        ref={cardRef}
        tabIndex={-1}
        className="space-y-3 focus-visible:outline-none"
        role="radiogroup"
        aria-label="Pilihan jawaban"
        aria-live="polite"
      >
        <p className="font-semibold text-slate-900">{question.question}</p>
        <div className="space-y-2">
          {question.options?.map((option, idx) => {
            const selected = answer === idx;
            return (
              <button
                key={`${question.id}-${idx}`}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Opsi ${String.fromCharCode(65 + idx)}: ${option}`}
                disabled={submitted}
                onClick={() => onAnswer(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAnswer(idx);
                  }
                }}
                className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-3 focus-visible:outline-indigo-500 ${
                  selected ? 'border-indigo-700 bg-indigo-100 text-indigo-950' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {String.fromCharCode(65 + idx)}. {option}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export default function App() {
  const {
    session,
    progress,
    startSession,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    nextSubTest,
    setSession,
    setTarget,
  } = useQuiz();

  const [view, setView] = useState<AppView>('home');
  const [now, setNow] = useState(() => Date.now());
  const [isBootLoading, setBootLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [selectedPtn, setSelectedPtn] = useState(PTN_DATA[0]?.id ?? '');
  const [selectedProdi, setSelectedProdi] = useState(PTN_DATA[0]?.prodi[0]?.id ?? '');
  const navStartRef = useRef<number>(0);

  const [onboardingTarget, setOnboardingTarget] = useState<UserTarget>(() => ({
    ptnId: progress.target?.ptnId ?? '',
    prodiId: progress.target?.prodiId ?? '',
    examDate: progress.target?.examDate ?? '',
    baselineScore: progress.target?.baselineScore ?? 520,
  }));

  const selectedPTN = useMemo(
    () => PTN_DATA.find((ptn) => ptn.id === (progress.target?.ptnId || onboardingTarget.ptnId)),
    [onboardingTarget.ptnId, progress.target?.ptnId],
  );
  const selectedProdi = useMemo(
    () => selectedPTN?.prodi.find((prodi) => prodi.id === (progress.target?.prodiId || onboardingTarget.prodiId)),
    [onboardingTarget.prodiId, progress.target?.prodiId, selectedPTN],
  );

  const latestReport = progress.reports?.[0];
  const currentScore = latestReport?.totalScore ?? progress.target?.baselineScore ?? onboardingTarget.baselineScore;
  const targetScore = selectedProdi?.passingGrade ?? 700;
  const gapScore = Math.max(0, targetScore - currentScore);
  const progressToTarget = toPct((currentScore / targetScore) * 100);
  const admissionChance = estimateChance(currentScore, targetScore);
  const baselineChance = estimateChance(progress.target?.baselineScore ?? onboardingTarget.baselineScore, targetScore);

  const categoryPerformance = useMemo(() => {
    return CATEGORY_LIST.map((category) => {
      const series = (progress.reports ?? []).slice(0, 3).map((report) => report.categoryScores[category] ?? 0);
      const latest = series[0] ?? 0;
      const previous = series[1] ?? latest;
      const trend = latest - previous;
      return {
        category,
        latest,
        trend,
        target: clamp(Math.round((targetScore / 800) * 100), 55, 95),
      };
    }).sort((a, b) => a.latest - b.latest);
  }, [progress.reports, targetScore]);

  const weeklyPlan = useMemo(() => {
    const primary = categoryPerformance[0];
    const secondary = categoryPerformance[1];
    const week1Target = Math.max(currentScore + Math.round(gapScore * 0.25), currentScore + 10);
    const week2Target = Math.max(currentScore + Math.round(gapScore * 0.5), week1Target + 10);
    const week3Target = Math.max(currentScore + Math.round(gapScore * 0.75), week2Target + 10);
    const week4Target = Math.max(targetScore, week3Target + 10);

    return {
      focus: [primary?.category, secondary?.category].filter(Boolean) as Category[],
      weeks: [
        { label: 'Minggu 1 · Foundation Reset', targetScore: week1Target, dailyMinutes: 90 },
        { label: 'Minggu 2 · Gap Closing', targetScore: week2Target, dailyMinutes: 110 },
        { label: 'Minggu 3 · Speed & Accuracy', targetScore: week3Target, dailyMinutes: 120 },
        { label: 'Minggu 4 · Exam Lock-in', targetScore: week4Target, dailyMinutes: 130 },
      ],
    };
  }, [categoryPerformance, currentScore, gapScore, targetScore]);

  const criticalTrend = categoryPerformance.filter((item) => item.trend < -5 || item.latest < item.target - 12);
  const remedialLocked = criticalTrend.length > 0;
  const mustOnboard = !progress.target?.ptnId || !progress.target?.prodiId || !progress.target?.examDate;

  const simulationInsights = useMemo(() => {
    const latest = progress.simulationReports?.[0];
    const previous = progress.simulationReports?.[1];
    if (!latest) return null;
    const latestChance = estimateChance(latest.totalScore, targetScore);
    const previousChance = previous ? estimateChance(previous.totalScore, targetScore) : baselineChance;
    return {
      latestChance,
      delta: latestChance - previousChance,
      latestScore: latest.totalScore,
    };
  }, [baselineChance, progress.simulationReports, targetScore]);

  const todayPriorityAction = remedialLocked
    ? `Remedial wajib ${criticalTrend[0]?.category} (45 menit) sebelum lanjut tryout.`
    : `Eksekusi drill ${weeklyPlan.focus[0] ?? 'TPS'} 30 menit + review error log 20 menit.`;

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    return session.questions[session.currentIdx] ?? null;
  }, [session]);

  const selectedPtnData = useMemo(() => PTN_DATA.find((ptn) => ptn.id === selectedPtn), [selectedPtn]);

  useEffect(() => {
    const startedAt = performance.now();
    const timeout = window.setTimeout(() => {
      setBootLoading(false);
      markMainPageRender(startedAt);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    trackPageView(`/${view}`);
  }, [view]);


  useEffect(() => {
    if (view === 'result') {
      trackEvent('view_recommendation', { report_count: progress.reports?.length ?? 0 });
    }
  }, [view, progress.reports]);

  const startQuickQuiz = () => {
    try {
      startSession('mini');
      trackEvent('start_quiz', { mode: 'mini' });
      setView('quiz');
    } catch (error) {
      setAppError('Gagal memulai kuis. Silakan coba lagi.');
      console.error(error);
    }
  };

  const finishQuiz = () => {
    submitQuiz();
    trackEvent('submit_quiz', {
      answered_count: Object.keys(session?.answers ?? {}).length,
      total_questions: session?.questions.length ?? 0,
    });
    setView('result');
  };

  const submitOnboarding = () => {
    if (!onboardingTarget.ptnId || !onboardingTarget.prodiId || !onboardingTarget.examDate) return;
    setTarget(onboardingTarget);
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (view !== 'quiz' || !session?.subTests?.length || session.isSubmitted) return;

    const currentSubTest = session.subTests[session.currentSubTestIdx ?? 0];
    if (!currentSubTest?.expiresAt) return;

    if (Date.now() >= currentSubTest.expiresAt) {
      nextSubTest();
    }
  }, [nextSubTest, session, view, now]);

  useEffect(() => {
    if (view !== 'quiz' || !session?.isSubmitted) return;
    submitQuiz();
    setView('result');
  }, [session?.isSubmitted, submitQuiz, view]);

  useEffect(() => {
    if (!selectedPtn) return;
    if (!selectedPtn.prodi.some((prodi) => prodi.id === selectedProdiId)) {
      setSelectedProdiId(selectedPtn.prodi[0]?.id ?? '');
    }
  }, [selectedPtn, selectedProdiId]);

  const activeSubTest = useMemo(() => {
    if (!session?.subTests?.length) return null;
    return session.subTests[session.currentSubTestIdx ?? 0] ?? null;
  }, [session]);

  const subTestRemainingSec = useMemo(() => {
    if (!activeSubTest?.expiresAt) return null;
    return Math.max(0, Math.ceil((activeSubTest.expiresAt - now) / 1000));
  }, [activeSubTest, now]);

  const handleQuestionMove = (action: 'prev' | 'next') => {
    navStartRef.current = performance.now();
    if (action === 'next') {
      nextQuestion();
    } else {
      prevQuestion();
    }
    requestAnimationFrame(() => {
      markQuestionNavigationLatency(performance.now() - navStartRef.current);
    });
  };

  const applyTarget = () => {
    if (!selectedPtn || !selectedProdi) {
      setAppError('Silakan pilih PTN dan prodi terlebih dahulu.');
      return;
    }
    setTarget({ ptnId: selectedPtn, prodiId: selectedProdi });
  };

  if (isBootLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <StatePanel
          kind="loading"
          title="Menyiapkan dashboard SNBT"
          description="Sedang memuat bank soal dan progres terakhir Anda."
          action={<LoaderCircle className="animate-spin" aria-hidden="true" />}
        />
      </main>
    );
  }

  if (appError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <StatePanel
          kind="error"
          title="Terjadi kendala"
          description={appError}
          action={
            <Button variant="secondary" onClick={() => setAppError(null)} aria-label="Coba lagi">
              <AlertCircle size={16} /> Coba lagi
            </Button>
          }
        />
      </main>
    );
  }

  if (view === 'home') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-950">SNBT Practice Arena</h1>
        <p className="text-slate-700">
          Bank soal aktif: <span className="font-semibold text-slate-900">{QUESTIONS.length}</span> soal.
        </p>

        <Card className="space-y-3">
          <h2 className="font-bold text-slate-900">Target PTN</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-slate-800">
              <span>Pilih PTN</span>
              <select
                className="w-full rounded-xl border border-slate-300 p-2"
                value={selectedPtn}
                onChange={(e) => {
                  const nextPtn = e.target.value;
                  setSelectedPtn(nextPtn);
                  setSelectedProdi(PTN_DATA.find((ptn) => ptn.id === nextPtn)?.prodi[0]?.id ?? '');
                }}
                aria-label="Pilih perguruan tinggi negeri"
              >
                {PTN_DATA.map((ptn) => (
                  <option key={ptn.id} value={ptn.id}>
                    {ptn.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-800">
              <span>Pilih Prodi</span>
              <select
                className="w-full rounded-xl border border-slate-300 p-2"
                value={selectedProdi}
                onChange={(e) => setSelectedProdi(e.target.value)}
                aria-label="Pilih program studi"
              >
                {(selectedPtnData?.prodi ?? []).map((prodi) => (
                  <option key={prodi.id} value={prodi.id}>
                    {prodi.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button variant="secondary" onClick={applyTarget} aria-label="Tetapkan target PTN">
            Tetapkan Target
          </Button>
        </Card>

        <Button type="button" onClick={startQuickQuiz} className="w-fit" aria-label="Mulai quiz cepat">
          <Target size={18} /> Mulai Quiz Cepat
        </Button>
      </main>
    );
  }

  if (view === 'result') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6 py-10">
        <h2 className="text-2xl font-bold text-slate-950">Quiz selesai</h2>
        {(progress.reports?.length ?? 0) === 0 ? (
          <StatePanel
            kind="empty"
            title="Belum ada riwayat"
            description="Belum ada laporan kuis tersimpan. Mulai kuis untuk melihat rekomendasi belajar."
          />
        ) : (
          <Card>
            <p className="text-slate-700">
              Total sesi tersimpan: <span className="font-semibold text-slate-900">{progress.reports?.length ?? 0}</span>
            </p>
          </Card>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSession(null);
            setView('home');
          }}
          className="w-fit"
          aria-label="Kembali ke beranda"
        >
          <Home size={18} /> Kembali ke beranda
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-950">
          <BookOpen size={20} /> Mode Quiz
        </h2>
        <div className="text-right">
          <span className="block text-sm text-slate-700" aria-live="polite">
            {session ? `${session.currentIdx + 1}/${session.questions.length}` : '0/0'}
          </span>
          {activeSubTest && subTestRemainingSec !== null ? (
            <span className="block text-xs font-semibold text-amber-800">
              {activeSubTest.name}: {subTestRemainingSec}s
            </span>
          ) : null}
        </div>
      </header>

      {session && currentQuestion ? (
        <>
          <QuestionRenderer
            question={currentQuestion}
            answer={session.answers[currentQuestion.id]}
            onAnswer={answerQuestion}
            submitted={session.isSubmitted}
          />

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleQuestionMove('prev')}
              disabled={session.currentIdx === 0}
              aria-label="Pindah ke soal sebelumnya"
            >
              <ChevronLeft size={16} /> Sebelumnya
            </Button>

            {session.currentIdx === session.questions.length - 1 ? (
              <Button type="button" variant="success" onClick={finishQuiz} aria-label="Submit kuis">
                <CheckCircle2 size={16} /> Submit
              </Button>
            ) : (
              <Button type="button" onClick={() => handleQuestionMove('next')} aria-label="Pindah ke soal berikutnya">
                Berikutnya <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </>
      ) : (
        <StatePanel
          kind="empty"
          title="Tidak ada sesi aktif"
          description="Sesi kuis belum tersedia. Kembali ke beranda untuk memulai sesi baru."
          action={
            <Button variant="secondary" onClick={() => setView('home')}>
              <Home size={16} /> Ke Beranda
            </Button>
          }
        />
      )}
    </main>
  );
}
