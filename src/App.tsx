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

const screenOrder: Screen[] = ['Dashboard', 'Tryout', 'Simulation', 'Target PTN', 'Materi', 'Review'];

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

  const finishQuiz = useCallback(() => {
    const report = submitQuiz();
    if (report) {
      setLatestReport(report);
    }
    setScreen('Review');
  }, [submitQuiz]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if ((screen !== 'Tryout' && screen !== 'Simulation') || !session?.subTests?.length || session.isSubmitted) return;

    const currentSubTest = session.subTests[session.currentSubTestIdx ?? 0];
    if (!currentSubTest?.expiresAt) return;

    if (Date.now() >= currentSubTest.expiresAt) {
      nextSubTest();
    }
  }, [nextSubTest, screen, session, now]);

  useEffect(() => {
    if ((screen !== 'Tryout' && screen !== 'Simulation') || !session?.isSubmitted) return;
    finishQuiz();
  }, [finishQuiz, session?.isSubmitted, screen]);

  useEffect(() => {
    if (!selectedPtn?.prodi?.length) return;
    setSelectedProdiId((prev) => {
      if (selectedPtn.prodi.some((prodi) => prodi.id === prev)) return prev;
      return selectedPtn.prodi[0].id;
    });
  }, [selectedPtn]);

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

      {selectedMaterialConcept ? (
        <p className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
          Drill targeted aktif untuk konsep: <span className="font-semibold">{selectedMaterialConcept}</span>
        </p>
      ) : null}

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
    </>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SNBT Practice Arena</h1>
          <p className="text-sm text-slate-600">Bank soal aktif: {QUESTIONS.length} soal</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {screenOrder.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScreen(item)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                screen === item ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-slate-700'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      {screen === 'Dashboard' ? (
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Aksi Cepat</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startTryout}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white"
              >
                <Target size={16} /> Mulai Tryout
              </button>
              <button
                type="button"
                onClick={startSimulation}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
              >
                <Compass size={16} /> Simulasi
              </button>
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
              <LineChart size={18} /> Insight Belajar Mingguan (Prediksi 2026)
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {weeklyInsights.map((insight) => (
                <li key={insight.id} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold">{insight.title}</p>
                  <p>{insight.summary}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {screen === 'Tryout' || screen === 'Simulation' ? <section className="space-y-4">{renderQuizScreen()}</section> : null}

      {screen === 'Target PTN' ? (
        <section className="grid gap-4 md:grid-cols-2">
          <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Target Kampus & Prodi</h3>
            <label className="block text-sm text-slate-600">
              Pilih PTN
              <select
                value={selectedPtnId}
                onChange={(e) => setSelectedPtnId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
              >
                {PTN_DATA.map((ptn) => (
                  <option key={ptn.id} value={ptn.id}>
                    {ptn.name} ({ptn.location})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-600">
              Pilih Prodi
              <select
                value={selectedProdiId}
                onChange={(e) => setSelectedProdiId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
              >
                {selectedPtn?.prodi.map((prodi) => (
                  <option key={prodi.id} value={prodi.id}>
                    {prodi.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => selectedPtn && selectedProdi && setTarget({ ptnId: selectedPtn.id, prodiId: selectedProdi.id })}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white"
            >
              Simpan Target
            </button>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
            <h4 className="text-lg font-bold text-slate-900">Kebutuhan Skor</h4>
            {selectedPtn && selectedProdi ? (
              <div className="mt-3 space-y-2">
                <p>
                  Target: <span className="font-semibold">{selectedPtn.name} - {selectedProdi.name}</span>
                </p>
                <p>Passing grade estimasi: <span className="font-semibold">{selectedProdi.passingGrade}</span></p>
                <p>Daya tampung: {selectedProdi.capacity} | Peminat: {selectedProdi.applicants}</p>
                <p>
                  Skor terkini kamu: <span className="font-semibold">{latestScore}</span>
                </p>
                <p className={targetGap !== null && targetGap <= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                  Gap menuju target: {targetGap !== null ? (targetGap <= 0 ? `+${Math.abs(targetGap)} (Aman)` : `-${targetGap}`) : '-'}
                </p>
              </div>
            ) : (
              <p className="mt-3">Pilih PTN dan prodi untuk melihat kebutuhan skor.</p>
            )}
          </article>
        </section>
      ) : null}

      {screen === 'Materi' ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
            <Sparkles size={18} /> Materi Remedial Otomatis
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Berdasarkan konsep lemah kamu: <span className="font-semibold">{weakConcepts.join(', ')}</span>
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {remedialMaterials.map((material) => (
              <article key={material.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase text-indigo-600">{material.category}</p>
                <h4 className="font-semibold text-slate-900">{material.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{material.summary}</p>
                <button
                  type="button"
                  onClick={() => startTargetedDrill(material.concept)}
                  className="mt-3 rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700"
                >
                  Drill targeted konsep ini
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {screen === 'Review' ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-xl font-bold text-slate-900">Report Detail Hasil Sesi</h3>
          {latestReport ? (
            <>
              <p className="text-slate-700">
                Skor total: <span className="font-semibold">{latestReport.totalScore}</span> | Readiness index:{' '}
                <span className="font-semibold">{latestReport.readinessIndex}</span> | Konsistensi:{' '}
                <span className="font-semibold">{latestReport.consistency}</span>
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {latestReport.readinessBySubTest.map((item) => (
                  <div key={item.subTest} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{item.subTest}</p>
                    <p>
                      Readiness: <span className="font-semibold">{item.readiness}</span> | Skor: {item.score}
                    </p>
                    <p>Trend: {item.trend} poin/sesi</p>
                    <p>Stability: {item.stability}%</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Rekomendasi Fokus</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {(latestReport.focusRecommendations ?? []).map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
                <p className="mt-3">
                  Prediksi performa: <span className="font-medium">{latestReport.performancePrediction?.summary}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setScreen('Materi')}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white"
                >
                  1) Lanjut ke Rekomendasi Materi
                </button>
                <button
                  type="button"
                  onClick={() => startTargetedDrill()}
                  className="rounded-lg border border-indigo-300 px-4 py-2 font-semibold text-indigo-700"
                >
                  2) Drill Targeted Konsep Lemah
                </button>
                <button
                  type="button"
                  onClick={startSimulation}
                  className="rounded-lg border border-emerald-300 px-4 py-2 font-semibold text-emerald-700"
                >
                  3) Simulasi Ulang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSession(null);
                    setSelectedMaterialConcept(null);
                    setScreen('Dashboard');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  <Home size={16} /> Kembali Dashboard
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-600">Belum ada report. Selesaikan tryout/simulasi terlebih dahulu.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
