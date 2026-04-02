import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  LoaderCircle,
  Route,
  Target,
} from 'lucide-react';
import { useQuiz } from './hooks/useQuiz';
import { QUESTIONS } from './data/questions';
import { PTN_DATA } from './data/ptn';
import { STUDY_MATERIALS } from './data/materials';
import { PREDICTIONS_2026 } from './data/predictions2026';
import { Button, Card, StatePanel } from './components/ui';
import { trackEvent, trackPageView } from './lib/analytics';
import { markMainPageRender, markQuestionNavigationLatency } from './lib/slo';
import { QuestionRenderer } from './components/quiz/QuestionRenderer';

type AppView = 'dashboard' | 'tryout' | 'simulation' | 'target' | 'materials' | 'review';

export default function App() {
  const { session, progress, startSession, answerQuestion, nextQuestion, prevQuestion, submitQuiz, nextSubTest, setSession, setTarget } = useQuiz();

  const [view, setView] = useState<AppView>('dashboard');
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
    }, 200);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    trackPageView(`/${view}`);
  }, [view]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedPtnData) return;
    if (!selectedPtnData.prodi.some((prodi) => prodi.id === selectedProdi)) {
      setSelectedProdi(selectedPtnData.prodi[0]?.id ?? '');
    }
  }, [selectedPtnData, selectedProdi]);

  useEffect(() => {
    if (!session?.subTests?.length || session.isSubmitted) return;
    const currentSubTest = session.subTests[session.currentSubTestIdx ?? 0];
    if (!currentSubTest?.expiresAt) return;
    if (Date.now() >= currentSubTest.expiresAt) nextSubTest();
  }, [nextSubTest, now, session]);

  const activeSubTest = useMemo(() => {
    if (!session?.subTests?.length) return null;
    return session.subTests[session.currentSubTestIdx ?? 0] ?? null;
  }, [session]);

  const subTestRemainingSec = useMemo(() => {
    if (!activeSubTest?.expiresAt) return null;
    return Math.max(0, Math.ceil((activeSubTest.expiresAt - now) / 1000));
  }, [activeSubTest, now]);

  const startMode = (mode: 'tryout' | 'simulation') => {
    try {
      startSession(mode);
      trackEvent('start_session', { mode });
      setView(mode);
    } catch (error) {
      console.error(error);
      setAppError('Gagal memulai sesi. Silakan ulangi.');
    }
  };

  const handleQuestionMove = (action: 'prev' | 'next') => {
    navStartRef.current = performance.now();
    if (action === 'next') nextQuestion();
    else prevQuestion();
    requestAnimationFrame(() => markQuestionNavigationLatency(performance.now() - navStartRef.current));
  };

  const finishQuiz = () => {
    submitQuiz();
    trackEvent('submit_session', {
      mode: session?.mode ?? 'unknown',
      answered_count: Object.keys(session?.answers ?? {}).length,
      total_questions: session?.questions.length ?? 0,
    });
    setView('review');
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
      <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <StatePanel kind="loading" title="Menyiapkan SNBT Practice Arena" description="Memuat bank soal, report, dan preferensi target PTN." action={<LoaderCircle className="animate-spin" />} />
      </main>
    );
  }

  if (appError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <StatePanel
          kind="error"
          title="Terjadi kendala"
          description={appError}
          action={<Button variant="secondary" onClick={() => setAppError(null)}><AlertCircle size={16} /> Coba lagi</Button>}
        />
      </main>
    );
  }

  const isQuizView = view === 'tryout' || view === 'simulation';

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-950">SNBT Practice Arena</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant={view === 'dashboard' ? 'primary' : 'secondary'} onClick={() => setView('dashboard')}><Home size={16} /> Dashboard</Button>
          <Button variant={view === 'tryout' ? 'primary' : 'secondary'} onClick={() => startMode('tryout')}><Target size={16} /> Tryout</Button>
          <Button variant={view === 'simulation' ? 'primary' : 'secondary'} onClick={() => startMode('simulation')}><Route size={16} /> Simulation</Button>
          <Button variant={view === 'target' ? 'primary' : 'secondary'} onClick={() => setView('target')}><Target size={16} /> Target PTN</Button>
          <Button variant={view === 'materials' ? 'primary' : 'secondary'} onClick={() => setView('materials')}><BookOpen size={16} /> Materi</Button>
          <Button variant={view === 'review' ? 'primary' : 'secondary'} onClick={() => setView('review')}><BarChart3 size={16} /> Review</Button>
        </div>
      </header>

      {view === 'dashboard' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-bold">Ringkasan Kesiapan</h2>
            <p>Bank soal: <strong>{QUESTIONS.length}</strong></p>
            <p>Readiness index terakhir: <strong>{progress.reports?.[0]?.readinessIndex ?? 0}</strong></p>
            <p>Trend sesi: <strong>{progress.reports?.slice(0, 3).map((r) => r.totalScore).join(' → ') || 'Belum ada data'}</strong></p>
          </Card>
          <Card>
            <h2 className="font-bold">Insight Prediksi 2026</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {PREDICTIONS_2026.slice(0, 3).map((item) => <li key={item.id}>{item.title}</li>)}
            </ul>
          </Card>
        </div>
      )}

      {view === 'target' && (
        <Card className="space-y-3">
          <h2 className="font-bold text-slate-900">Target PTN & Prodi</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-slate-800">
              <span>Pilih PTN</span>
              <select className="w-full rounded-xl border border-slate-300 p-2" value={selectedPtn} onChange={(e) => setSelectedPtn(e.target.value)}>
                {PTN_DATA.map((ptn) => <option key={ptn.id} value={ptn.id}>{ptn.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-semibold text-slate-800">
              <span>Pilih Prodi</span>
              <select className="w-full rounded-xl border border-slate-300 p-2" value={selectedProdi} onChange={(e) => setSelectedProdi(e.target.value)}>
                {(selectedPtnData?.prodi ?? []).map((prodi) => <option key={prodi.id} value={prodi.id}>{prodi.name}</option>)}
              </select>
            </label>
          </div>
          <Button variant="secondary" onClick={applyTarget}>Tetapkan Target</Button>
        </Card>
      )}

      {view === 'materials' && (
        <div className="grid gap-3 md:grid-cols-2">
          {STUDY_MATERIALS.slice(0, 6).map((material) => (
            <Card key={material.id}>
              <h3 className="font-semibold">{material.title}</h3>
              <p className="text-sm text-slate-600">{material.summary}</p>
            </Card>
          ))}
        </div>
      )}

      {view === 'review' && (
        <Card className="space-y-2">
          <h2 className="font-bold text-slate-900">Laporan Lengkap</h2>
          {progress.reports?.length ? (
            <>
              <p>Readiness: <strong>{progress.reports[0]?.readinessScore}</strong></p>
              <p>Gap subtes: {JSON.stringify(progress.reports[0]?.gapBySubTest ?? {})}</p>
              <p>Rekomendasi fokus: {(progress.reports[0]?.focusRecommendations ?? []).join(', ') || 'Belum tersedia'}</p>
            </>
          ) : (
            <p className="text-slate-600">Belum ada report. Jalankan tryout/simulation dulu.</p>
          )}
        </Card>
      )}

      {isQuizView && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{session ? `${session.currentIdx + 1}/${session.questions.length}` : '0/0'}</span>
            {activeSubTest && subTestRemainingSec !== null ? <span className="text-sm text-amber-700">{activeSubTest.name}: {subTestRemainingSec}s</span> : null}
          </div>
          {session && currentQuestion ? (
            <>
              <QuestionRenderer question={currentQuestion} answer={session.answers[currentQuestion.id] ?? null} onAnswer={answerQuestion} submitted={session.isSubmitted} />
              <div className="flex items-center justify-between gap-2">
                <Button variant="secondary" onClick={() => handleQuestionMove('prev')} disabled={session.currentIdx === 0}><ChevronLeft size={16} /> Sebelumnya</Button>
                {session.currentIdx === session.questions.length - 1 ? (
                  <Button variant="success" onClick={finishQuiz}><CheckCircle2 size={16} /> Submit</Button>
                ) : (
                  <Button onClick={() => handleQuestionMove('next')}>Berikutnya <ChevronRight size={16} /></Button>
                )}
              </div>
            </>
          ) : (
            <StatePanel kind="empty" title="Tidak ada sesi aktif" description="Mulai tryout atau simulation untuk melanjutkan." action={<Button variant="secondary" onClick={() => setView('dashboard')}>Kembali</Button>} />
          )}
          <Button variant="secondary" onClick={() => { setSession(null); setView('dashboard'); }}>Akhiri sesi</Button>
        </section>
      )}
    </main>
  );
}
