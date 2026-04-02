import { EditorialMetadata, Question } from '../types/quiz';
import { TPS_QUESTIONS } from './questions/tps';
import { LITERASI_ID_QUESTIONS } from './questions/literasi_id';
import { LITERASI_EN_QUESTIONS } from './questions/literasi_en';
import { MATEMATIKA_QUESTIONS } from './questions/matematika';
import { HOTS_QUESTIONS } from './questions/hots';
import { SNBT2025_QUESTIONS } from './questions/snbt2025';

const DEFAULT_EDITORIAL_CHECKLIST = {
  stemClarity: true,
  optionQuality: true,
  singleBestAnswer: true,
  answerKeyRationale: true,
};

const QUESTION_EDITORIAL_METADATA: Record<string, EditorialMetadata> = {
  'pi-1': {
    author: 'Tim Konten SNBT',
    reviewer: 'Lead Reviewer TPS',
    reviewedAt: '2026-03-15',
    checklist: DEFAULT_EDITORIAL_CHECKLIST,
    revisionLog: [
      {
        revisionDate: '2026-03-15',
        author: 'Tim Konten SNBT',
        reviewer: 'Lead Reviewer TPS',
        changeSummary: 'Standardisasi format stem dan penjelasan kunci jawaban.',
      },
    ],
  },
};

const applyEditorialMetadata = (questions: Question[]): Question[] =>
  questions.map((question) => ({
    ...question,
    editorial: QUESTION_EDITORIAL_METADATA[question.id] ?? {
      author: 'Tim Konten SNBT',
      reviewer: 'Reviewer Belum Ditentukan',
      reviewedAt: '2026-01-01',
      checklist: DEFAULT_EDITORIAL_CHECKLIST,
      revisionLog: [
        {
          revisionDate: '2026-01-01',
          author: 'Tim Konten SNBT',
          reviewer: 'Reviewer Belum Ditentukan',
          changeSummary: 'Migrasi metadata editorial awal.',
        },
      ],
    },
  }));

export const QUESTIONS: Question[] = applyEditorialMetadata([
  ...TPS_QUESTIONS,
  ...LITERASI_ID_QUESTIONS,
  ...LITERASI_EN_QUESTIONS,
  ...MATEMATIKA_QUESTIONS,
  ...HOTS_QUESTIONS,
  ...SNBT2025_QUESTIONS
]);
