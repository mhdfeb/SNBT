import { Question } from '../types/quiz';
import { SNBT2025_QUESTIONS } from './questions/snbt2025';

// Paket simulasi premium dipisahkan dari latihan harian/mini untuk mencegah hafalan pola.
export const SIMULATION_QUESTIONS: Question[] = [...SNBT2025_QUESTIONS];
