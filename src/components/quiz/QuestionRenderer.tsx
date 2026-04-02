import type { Question, QuestionAnswer } from '../../types/quiz';

interface RendererProps {
  question: Question;
  answer: QuestionAnswer;
  onAnswer: (value: QuestionAnswer) => void;
  submitted: boolean;
}

interface ErrorStateProps {
  title: string;
  detail: string;
}

const ErrorState = ({ title, detail }: ErrorStateProps) => (
  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
    <p className="font-semibold text-rose-700">{title}</p>
    <p className="mt-1 text-sm text-rose-600">{detail}</p>
  </div>
);

const MultipleChoiceRenderer = ({ question, answer, onAnswer, submitted }: RendererProps) => {
  if (!Array.isArray(question.options) || question.options.length === 0) {
    return (
      <ErrorState
        title="Payload soal tidak valid"
        detail="Tipe multiple choice memerlukan minimal 1 opsi jawaban."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-semibold text-slate-700">{question.question}</p>
      <div className="space-y-2">
        {question.options.map((option, idx) => {
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
};

const ShortAnswerRenderer = ({ question, answer, onAnswer, submitted }: RendererProps) => (
  <div className="space-y-3">
    <p className="font-semibold text-slate-700">{question.question}</p>
    <input
      type="number"
      className="w-full rounded-lg border border-slate-300 p-3"
      value={typeof answer === 'number' ? answer : ''}
      disabled={submitted}
      onChange={(e) => {
      const rawValue = e.target.value.trim();
      onAnswer(rawValue === '' ? null : Number(rawValue));
    }}
      placeholder="Masukkan jawaban"
    />
  </div>
);

const ComplexMultipleChoiceRenderer = ({ question, answer, onAnswer, submitted }: RendererProps) => {
  if (!Array.isArray(question.complexOptions) || question.complexOptions.length === 0) {
    return (
      <ErrorState
        title="Payload soal tidak valid"
        detail="Tipe complex multiple choice memerlukan daftar pernyataan yang valid."
      />
    );
  }

  const selectedAnswers = Array.isArray(answer) ? answer : [];

  return (
    <div className="space-y-3">
      <p className="font-semibold text-slate-700">{question.question}</p>
      <div className="space-y-2">
        {question.complexOptions.map((option, idx) => {
          const selected = Boolean(selectedAnswers[idx]);

          return (
            <button
              key={`${question.id}-${idx}`}
              type="button"
              disabled={submitted}
              onClick={() => {
                const nextAnswer = [...selectedAnswers];
                nextAnswer[idx] = !selected;
                onAnswer(nextAnswer);
              }}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="font-semibold">{selected ? '✓' : '○'}</span> {option.statement}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export function QuestionRenderer(props: RendererProps) {
  switch (props.question.type) {
    case 'multiple_choice':
      return <MultipleChoiceRenderer {...props} />;
    case 'short_answer':
      return <ShortAnswerRenderer {...props} />;
    case 'complex_multiple_choice':
      return <ComplexMultipleChoiceRenderer {...props} />;
    default:
      return (
        <ErrorState
          title="Tipe soal tidak dikenali"
          detail="Silakan periksa payload soal sebelum melanjutkan sesi."
        />
      );
  }
}
