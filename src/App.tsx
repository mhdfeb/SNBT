import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Home,
  LineChart,
  Sparkles,
  Target,
} from 'lucide-react';
import { useQuiz } from './hooks/useQuiz';
import { QUESTIONS } from './data/questions';
import { PTN_DATA } from './data/ptn';
import { STUDY_MATERIALS } from './data/materials';
import { PREDICTIONS_2026 } from './data/predictions2026';
import type { AssessmentReport, Concept, PTN, Prodi, Question, QuestionAnswer } from './types/quiz';

type Screen = 'Dashboard' | 'Tryout' | 'Simulation' | 'Target PTN' | 'Materi' | 'Review';

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

  return (
    <div className="space-y-3">
      <p className="font-semibold text-slate-700">{question.question}</p>
      <div className="space-y-2">
        {question.options?.map((option, idx) => {
          const selected = answer === idx;
          return (
            <button
              key={`${question.id}-${idx}`}
              type="button"
              disabled={submitted}
              onClick={() => onAnswer(idx)}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {String.fromCharCode(65 + idx)}. {option}
            </button>
          );
        })}
      </div>
    </div>
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

  const [screen, setScreen] = useState<Screen>('Dashboard');
  const [now, setNow] = useState(() => Date.now());
  const [latestReport, setLatestReport] = useState<AssessmentReport | null>(null);
  const [selectedPtnId, setSelectedPtnId] = useState<string>(PTN_DATA[0]?.id ?? '');
  const [selectedProdiId, setSelectedProdiId] = useState<string>(PTN_DATA[0]?.prodi?.[0]?.id ?? '');
  const [selectedMaterialConcept, setSelectedMaterialConcept] = useState<Concept | null>(null);

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    return session.questions[session.currentIdx] ?? null;
  }, [session]);

  const weakConcepts = useMemo(() => {
    const entries = Object.entries(progress.materialMastery ?? {});
    if (entries.length === 0) return ['Penalaran Induktif', 'Literasi Bahasa Indonesia', 'Penalaran Matematika'] as Concept[];

    return entries
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([concept]) => concept as Concept);
  }, [progress.materialMastery]);

  const remedialMaterials = useMemo(
    () => STUDY_MATERIALS.filter((material) => weakConcepts.includes(material.concept)).slice(0, 6),
    [weakConcepts],
  );

  const weeklyInsights = useMemo(() => {
    const weakCategories = Object.entries(latestReport?.categoryScores ?? {})
      .sort((a, b) => a[1] - b[1])
      .map(([category]) => category);

    const prioritized = PREDICTIONS_2026.filter((prediction) => weakCategories.includes(prediction.category));
    return (prioritized.length > 0 ? prioritized : PREDICTIONS_2026).slice(0, 3);
  }, [latestReport]);

  const selectedPtn = useMemo<PTN | null>(() => PTN_DATA.find((item) => item.id === selectedPtnId) ?? null, [selectedPtnId]);

  const selectedProdi = useMemo<Prodi | null>(
    () => selectedPtn?.prodi.find((item) => item.id === selectedProdiId) ?? null,
    [selectedPtn, selectedProdiId],
  );

  const latestScore = latestReport?.totalScore ?? progress.reports?.[0]?.totalScore ?? 0;
  const targetGap = selectedProdi ? selectedProdi.passingGrade - latestScore : null;

  const startTryout = () => {
    startSession('tryout');
    setScreen('Tryout');
  };

  const startSimulation = () => {
    startSession('simulation');
    setScreen('Simulation');
  };

  const startTargetedDrill = (concept?: Concept) => {
    const focusConcept = concept ?? weakConcepts[0];
    startSession('targeted', undefined, { concept: focusConcept });
    setSelectedMaterialConcept(focusConcept);
    setScreen('Tryout');
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

  const activeSubTest = useMemo(() => {
    if (!session?.subTests?.length) return null;
    return session.subTests[session.currentSubTestIdx ?? 0] ?? null;
  }, [session]);

  const subTestRemainingSec = useMemo(() => {
    if (!activeSubTest?.expiresAt) return null;
    return Math.max(0, Math.ceil((activeSubTest.expiresAt - now) / 1000));
  }, [activeSubTest, now]);

  const renderQuizScreen = () => (
    <>
      <header className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
          <BookOpen size={20} /> {session?.mode === 'simulation' ? 'Mode Simulasi' : 'Mode Tryout / Drill'}
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

      {selectedMaterialConcept ? (
        <p className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
          Drill targeted aktif untuk konsep: <span className="font-semibold">{selectedMaterialConcept}</span>
        </p>
      ) : null}

      {session && currentQuestion ? (
        <>
          <QuestionCard
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
