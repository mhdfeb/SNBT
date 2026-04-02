import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Home, Target } from 'lucide-react';
import { useQuiz } from './hooks/useQuiz';
import { QUESTIONS } from './data/questions';
import type { Question } from './types/quiz';

function QuestionCard({
  question,
  answer,
  onAnswer,
  submitted,
}: {
  question: Question;
  answer: unknown;
  onAnswer: (value: unknown) => void;
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

export default function App() {
  const {
    session,
    progress,
    startSession,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    setSession,
  } = useQuiz();

  const [view, setView] = useState<'home' | 'quiz' | 'result'>('home');

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    return session.questions[session.currentIdx] ?? null;
  }, [session]);

  const startQuickQuiz = () => {
    startSession('mini');
    setView('quiz');
  };

  const finishQuiz = () => {
    submitQuiz();
    setView('result');
  };

  if (view === 'home') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900">SNBT Practice Arena</h1>
        <p className="text-slate-600">
          Bank soal aktif: <span className="font-semibold">{QUESTIONS.length}</span> soal.
        </p>
        <button
          type="button"
          onClick={startQuickQuiz}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          <Target size={18} /> Mulai Quiz Cepat
        </button>
      </main>
    );
  }

  if (view === 'result') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6 py-10">
        <h2 className="text-2xl font-bold text-slate-900">Quiz selesai</h2>
        <p className="text-slate-600">
          Total sesi tersimpan: <span className="font-semibold">{progress.reports?.length ?? 0}</span>
        </p>
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
          <BookOpen size={20} /> Mode Quiz
        </h2>
        <span className="text-sm text-slate-500">
          {session ? `${session.currentIdx + 1}/${session.questions.length}` : '0/0'}
        </span>
      </header>

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
    </main>
  );
}
