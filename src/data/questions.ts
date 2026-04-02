import { Question } from '../types/quiz';
import { TPS_QUESTIONS } from './questions/tps';
import { LITERASI_ID_QUESTIONS } from './questions/literasi_id';
import { LITERASI_EN_QUESTIONS } from './questions/literasi_en';
import { MATEMATIKA_QUESTIONS } from './questions/matematika';
import { HOTS_QUESTIONS } from './questions/hots';
import { SNBT2025_QUESTIONS } from './questions/snbt2025';

export const QUESTIONS: Question[] = [
  ...TPS_QUESTIONS,
  ...LITERASI_ID_QUESTIONS,
  ...LITERASI_EN_QUESTIONS,
  ...MATEMATIKA_QUESTIONS,
  ...HOTS_QUESTIONS,
  ...SNBT2025_QUESTIONS
];

// Bank simulasi ketat dipisahkan agar pola latihan harian tidak overfit ke soal ujian
export const SIMULATION_QUESTION_BANK: Question[] = [
  ...HOTS_QUESTIONS,
  ...SNBT2025_QUESTIONS,
];

export const TRAINING_QUESTION_BANK: Question[] = [
  ...TPS_QUESTIONS,
  ...LITERASI_ID_QUESTIONS,
  ...LITERASI_EN_QUESTIONS,
  ...MATEMATIKA_QUESTIONS,
];
