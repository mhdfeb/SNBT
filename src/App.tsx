import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  Rocket,
  Target,
} from 'lucide-react';
import { useQuiz } from './hooks/useQuiz';
import { QUESTIONS } from './data/questions';
import { PTN_DATA } from './data/ptn';
import type { Category, Question, QuestionAnswer, UserTarget } from './types/quiz';

const CATEGORY_LIST: Category[] = ['TPS', 'Literasi Indonesia', 'Literasi Inggris', 'Penalaran Matematika'];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function toPct(value: number): number {
  return clamp(Math.round(value), 0, 100);
}

function estimateChance(currentScore: number, targetScore: number): number {
  const raw = 35 + (currentScore - targetScore) * 0.55;
  return clamp(Math.round(raw), 1, 99);
}

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
  if (question.type === 'short_answer') {
    return (
      <div className="space-y-3">
        <p className="font-semibold text-slate-700">{question.question}</p>
        <input
          type="number"
          className="w-full rounded-lg border border-slate-300 p-3"
          value={typeof answer === 'number' ? answer : ''}
          disabled={submitted}
          onChange={(e) => onAnswer(Number(e.target.value))}
          placeholder="Masukkan jawaban"
        />
      </div>
    );
  }

const SESSION_MODES: { mode: QuizSession['mode']; label: string }[] = [
  { mode: 'mini', label: 'Mini Quiz' },
  { mode: 'daily', label: 'Daily 5' },
  { mode: 'drill15', label: 'Drill 15' },
  { mode: 'tryout', label: 'Tryout' },
  { mode: 'simulation', label: 'Simulation' },
  { mode: 'category', label: 'Category Focus' },
  { mode: 'targeted', label: 'Targeted Concept' },
];

type AppView = 'home' | 'quiz' | 'result' | 'dashboard' | 'materials' | 'target';

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
  const [selectedPtnId, setSelectedPtnId] = useState<string>(PTN_DATA[0]?.id ?? '');
  const [selectedProdiId, setSelectedProdiId] = useState<string>(PTN_DATA[0]?.prodi[0]?.id ?? '');

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
  const chanceDeltaSinceBaseline = admissionChance - baselineChance;

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

  const startMode = (mode: 'mini' | 'simulation' | 'category', category?: Category) => {
    startSession(mode, category);
    setView('quiz');
  };

  const finishQuiz = () => {
    submitQuiz();
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

  if (view === 'home') {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">SNBT Practice Arena</h1>

        {mustOnboard ? (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <h2 className="text-lg font-bold text-indigo-900">Onboarding Wajib</h2>
            <p className="mt-1 text-sm text-indigo-800">
              Pilih PTN + prodi target + jadwal ujian + baseline skor sebelum mulai latihan.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                value={onboardingTarget.ptnId}
                className="rounded-lg border border-indigo-200 p-3"
                onChange={(e) => setOnboardingTarget((prev) => ({ ...prev, ptnId: e.target.value, prodiId: '' }))}
              >
                <option value="">Pilih PTN target</option>
                {PTN_DATA.map((ptn) => (
                  <option key={ptn.id} value={ptn.id}>
                    {ptn.name}
                  </option>
                ))}
              </select>
              <select
                value={onboardingTarget.prodiId}
                className="rounded-lg border border-indigo-200 p-3"
                onChange={(e) => setOnboardingTarget((prev) => ({ ...prev, prodiId: e.target.value }))}
              >
                <option value="">Pilih prodi target</option>
                {(PTN_DATA.find((item) => item.id === onboardingTarget.ptnId)?.prodi ?? []).map((prodi) => (
                  <option key={prodi.id} value={prodi.id}>
                    {prodi.name} (PG {prodi.passingGrade})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={onboardingTarget.examDate}
                onChange={(e) => setOnboardingTarget((prev) => ({ ...prev, examDate: e.target.value }))}
                className="rounded-lg border border-indigo-200 p-3"
              />
              <input
                type="number"
                min={200}
                max={900}
                value={onboardingTarget.baselineScore}
                onChange={(e) =>
                  setOnboardingTarget((prev) => ({ ...prev, baselineScore: clamp(Number(e.target.value) || 0, 200, 900) }))
                }
                className="rounded-lg border border-indigo-200 p-3"
                placeholder="Baseline skor"
              />
            </div>
            <button
              type="button"
              onClick={submitOnboarding}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              <CheckCircle2 size={18} /> Simpan target & aktifkan dashboard
            </button>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-slate-500">Progress menuju target</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{progressToTarget}%</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-slate-500">Peluang diterima</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{admissionChance}%</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-slate-500">Risiko utama</p>
            <p className="mt-2 text-sm font-semibold text-amber-700">{criticalTrend[0]?.category ?? 'Belum ada risiko kritis'}</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-slate-500">Tindakan prioritas hari ini</p>
            <p className="mt-2 text-sm font-semibold text-indigo-700">{todayPriorityAction}</p>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
            <BarChart3 size={18} /> Engine Gap Analysis
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Skor saat ini <strong>{currentScore}</strong> vs target prodi <strong>{targetScore}</strong> (gap {gapScore} poin).
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {weeklyPlan.weeks.map((phase) => (
              <li key={phase.label} className="rounded-lg bg-slate-50 p-3">
                <strong>{phase.label}</strong> — target skor {phase.targetScore}, fokus {weeklyPlan.focus.join(' + ') || 'General'},
                durasi {phase.dailyMinutes} menit/hari.
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
            <CalendarClock size={18} /> Roadmap Otomatis (Harian/Mingguan)
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {categoryPerformance.map((item, idx) => (
              <div key={item.category} className="rounded-lg border p-3">
                <p className="font-semibold text-slate-800">
                  Prioritas {idx + 1}: {item.category}
                </p>
                <p className="text-sm text-slate-600">
                  Skor sekarang {toPct(item.latest)} / target fase {item.target}. Trend {item.trend >= 0 ? '+' : ''}
                  {item.trend}.
                </p>
              </div>
            ))}
          </div>
        </section>

        {remedialLocked ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-rose-900">
              <AlertTriangle size={18} /> Notifikasi Adaptif: Remedial Dipaksa
            </h3>
            <p className="mt-2 text-sm text-rose-800">
              Trend turun terdeteksi pada subtes kritis ({criticalTrend.map((item) => item.category).join(', ')}). Selesaikan remedial
              dulu sebelum lanjut tryout/quiz reguler.
            </p>
            <button
              type="button"
              onClick={() => startMode('category', criticalTrend[0].category)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
            >
              <Rocket size={16} /> Mulai Remedial Wajib
            </button>
          </section>
        ) : null}

        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => startMode('mini')}
            disabled={mustOnboard || remedialLocked}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Target size={18} /> Mulai Tryout Cepat
          </button>
          <button
            type="button"
            onClick={() => startMode('simulation')}
            disabled={mustOnboard}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BookOpen size={18} /> Simulasi Berkala Bertimer
          </button>
          <p className="self-center text-sm text-slate-600">
            {simulationInsights
              ? `Kenaikan peluang diterima dari simulasi terakhir: ${simulationInsights.delta >= 0 ? '+' : ''}${simulationInsights.delta}% (peluang sekarang ${simulationInsights.latestChance}%).`
              : 'Belum ada simulasi: jalankan simulasi untuk evaluasi kenaikan peluang diterima.'}
          </p>
        </section>
      </main>
    );
  }

  if (view === 'result') {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-4 px-6 py-10">
        <h2 className="text-2xl font-bold text-slate-900">Quiz selesai</h2>
        <p className="text-slate-600">
          Total sesi tersimpan: <span className="font-semibold">{progress.reports?.length ?? 0}</span>
        </p>
        {simulationInsights ? (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            Dampak simulasi terbaru: peluang diterima <strong>{simulationInsights.latestChance}%</strong> ({simulationInsights.delta >= 0 ? '+' : ''}
            {simulationInsights.delta}% vs simulasi sebelumnya).
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setSession(null);
            setView('home');
          }}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Home size={18} /> Kembali ke beranda
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
          <BookOpen size={20} /> Mode Quiz ({session?.mode ?? '-'})
        </h2>
        <div className="text-right">
          <span className="block text-sm text-slate-500">
            {session ? `${session.currentIdx + 1}/${session.questions.length}` : '0/0'}
          </span>
          {activeSubTest && subTestRemainingSec !== null ? (
            <span className="block text-xs font-semibold text-amber-600">
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
            <button
              type="button"
              onClick={prevQuestion}
              disabled={session.currentIdx === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>

            {session.currentIdx === session.questions.length - 1 ? (
              <button
                type="button"
                onClick={finishQuiz}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} /> Submit
              </button>
            ) : (
              <button
                type="button"
                onClick={nextQuestion}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
              >
                Berikutnya <ChevronRight size={16} />
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-slate-600">Tidak ada sesi aktif.</p>
      )}
    </main>
  );
}
