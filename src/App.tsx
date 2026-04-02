import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useQuiz } from './hooks/useQuiz';
import { QUESTIONS } from './data/questions';
import { QuestionRenderer } from './components/quiz/QuestionRenderer';
import type { Concept, QuizSession } from './types/quiz';

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
  } = useQuiz();

  const [view, setView] = useState<AppView>('home');
  const [now, setNow] = useState(() => Date.now());
  const [selectedPtnId, setSelectedPtnId] = useState<string>(PTN_DATA[0]?.id ?? '');
  const [selectedProdiId, setSelectedProdiId] = useState<string>(PTN_DATA[0]?.prodi[0]?.id ?? '');

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    return session.questions[session.currentIdx] ?? null;
  }, [session]);

  const firstCategory = useMemo(() => QUESTIONS[0]?.category, []);
  const availableConcepts = useMemo(
    () => Array.from(new Set(QUESTIONS.map((question) => question.concept).filter(Boolean))) as Concept[],
    [],
  );
  const weakestConcept = useMemo(() => {
    if (availableConcepts.length === 0) return undefined;

    const mastered = progress.materialMastery ?? {};
    return [...availableConcepts].sort((a, b) => (mastered[a] ?? 0) - (mastered[b] ?? 0))[0];
  }, [availableConcepts, progress.materialMastery]);

  const startModeSession = (mode: QuizSession['mode']) => {
    if (mode === 'category' && firstCategory) {
      startSession(mode, firstCategory);
    } else if (mode === 'targeted') {
      startSession(mode, undefined, { concept: weakestConcept ?? availableConcepts[0] });
    } else {
      startSession(mode);
    }
    setView('quiz');
  };

  const startTargetedDrill = (concept: Concept) => {
    startSession('targeted', undefined, { concept });
    setView('quiz');
  };

  const finishQuiz = () => {
    submitQuiz();
    setView('result');
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
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">SNBT Practice Arena</h1>
        <p className="text-slate-600">
          Bank soal aktif: <span className="font-semibold">{QUESTIONS.length}</span> soal.
        </p>
        <div className="flex flex-wrap gap-3">
          {SESSION_MODES.map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => startModeSession(item.mode)}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              <Target size={18} /> {item.label}
            </button>
          ))}
        </div>
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
        <div className="flex flex-wrap gap-3">
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
          <button
            type="button"
            onClick={() => {
              setSession(null);
              setView('dashboard');
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <BarChart3 size={18} /> Lihat Analisis Progres
          </button>
        </div>
      </main>
    );
  }

  if (view === 'dashboard') {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Progres</h2>
          <button
            type="button"
            onClick={() => setView('home')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
          >
            <Home size={16} /> Beranda
          </button>
        </header>

        {!latestReport ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Belum ada report. Jalankan quiz dulu untuk melihat kategori lemah/kuat.
          </p>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Skor terakhir</p>
                <p className="text-2xl font-bold text-slate-900">{latestReport.totalScore}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Konsep lemah</p>
                <p className="text-2xl font-bold text-rose-600">{weakConcepts.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Konsep kuat</p>
                <p className="text-2xl font-bold text-emerald-600">{strongConcepts.length}</p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <h3 className="font-semibold text-rose-900">Kategori lemah (basis latihan targeted)</h3>
                <ul className="mt-2 space-y-2 text-sm text-rose-800">
                  {weakConcepts.length > 0 ? (
                    weakConcepts.map((concept) => (
                      <li key={concept} className="flex items-center justify-between gap-2">
                        <span>{concept}</span>
                        <button
                          type="button"
                          onClick={() => startTargetedDrill(concept)}
                          className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Latihan targeted
                        </button>
                      </li>
                    ))
                  ) : (
                    <li>Tidak ada konsep kritis. Pertahankan konsistensi dengan mini quiz.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="font-semibold text-emerald-900">Kategori kuat</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
                  {strongConcepts.length > 0 ? (
                    strongConcepts.map((concept) => <li key={concept}>{concept}</li>)
                  ) : (
                    <li>Belum ada konsep yang stabil di level kuat.</li>
                  )}
                </ul>
              </div>
            </section>

            <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <h3 className="inline-flex items-center gap-2 font-semibold text-indigo-900">
                <Sparkles size={16} /> Insight strategi mingguan (Prediksi 2026)
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {weeklyInsight.map((item) => (
                  <article key={item.id} className="rounded-lg border border-indigo-100 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    );
  }

  if (view === 'materials') {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Materi Belajar Rekomendasi</h2>
          <button
            type="button"
            onClick={() => setView('home')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
          >
            <Home size={16} /> Beranda
          </button>
        </header>

        <p className="text-slate-600">
          Materi diambil dari konsep lemah pada report terbaru. Jika belum ada report, sistem menampilkan materi prioritas umum.
        </p>

        <div className="grid gap-4">
          {recommendedMaterials.map((material) => (
            <article key={material.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                {material.category} · Priority {material.priority}
              </p>
              <h3 className="mt-1 font-semibold text-slate-900">{material.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{material.summary}</p>
              <p className="mt-2 text-xs text-slate-500">{material.scoreImpact}</p>
            </article>
          ))}
        </div>
      </main>
    );
  }

  if (view === 'target') {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Target PTN</h2>
          <button
            type="button"
            onClick={() => setView('home')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
          >
            <Home size={16} /> Beranda
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Pilih PTN</span>
            <select
              className="w-full rounded-lg border border-slate-300 p-2"
              value={selectedPtn?.id ?? ''}
              onChange={(event) => setSelectedPtnId(event.target.value)}
            >
              {PTN_DATA.map((ptn) => (
                <option key={ptn.id} value={ptn.id}>
                  {ptn.name} ({ptn.location})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Pilih Prodi</span>
            <select
              className="w-full rounded-lg border border-slate-300 p-2"
              value={selectedProdi?.id ?? ''}
              onChange={(event) => setSelectedProdiId(event.target.value)}
            >
              {(selectedPtn?.prodi ?? []).map((prodi) => (
                <option key={prodi.id} value={prodi.id}>
                  {prodi.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedPtn && selectedProdi ? (
          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">
              {selectedPtn.name} — {selectedProdi.name}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Passing grade estimasi: {selectedProdi.passingGrade}</li>
              <li>Daya tampung: {selectedProdi.capacity}</li>
              <li>Peminat tahun lalu: {selectedProdi.applicants}</li>
            </ul>
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {latestReport
                ? scoreGap && scoreGap > 0
                  ? `Skor kamu masih kurang ${scoreGap} poin dari target. Fokuskan latihan targeted ke konsep lemah.`
                  : 'Skor kamu sudah menyentuh/melewati passing grade target. Jaga konsistensi akurasi.'
                : 'Belum ada skor terbaru. Ambil quiz cepat dulu untuk mengukur gap terhadap target PTN.'}
            </p>
          </section>
        ) : null}
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
