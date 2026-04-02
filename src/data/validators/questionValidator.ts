import type { Question } from '../../types/quiz';
import type { ValidationIssue } from './types';

const addIssue = (issues: ValidationIssue[], id: string, field: string, message: string) => {
  issues.push({ entity: 'Question', id, field, message });
};

export function validateQuestions(questions: Question[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  questions.forEach((question) => {
    const id = question.id || 'unknown-question-id';

    if (!question.question?.trim()) addIssue(issues, id, 'question', 'Pertanyaan kosong.');
    if (!question.explanation?.trim()) addIssue(issues, id, 'explanation', 'Penjelasan kosong.');
    if (!question.concept?.trim()) addIssue(issues, id, 'concept', 'Concept kosong.');
    if (!question.blueprint?.subtopic?.trim()) addIssue(issues, id, 'blueprint.subtopic', 'Subtopic blueprint kosong.');

    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length < 4) {
        addIssue(issues, id, 'options', 'Multiple choice harus punya minimal 4 opsi.');
      }
      if (typeof question.correctAnswer !== 'number') {
        addIssue(issues, id, 'correctAnswer', 'Multiple choice harus memiliki correctAnswer numerik.');
      }
    }

    if (question.type === 'complex_multiple_choice') {
      if (!question.complexOptions || question.complexOptions.length < 2) {
        addIssue(issues, id, 'complexOptions', 'Complex multiple choice harus punya minimal 2 statement.');
      }
    }

    if (question.type === 'short_answer' && typeof question.shortAnswerCorrect !== 'number') {
      addIssue(issues, id, 'shortAnswerCorrect', 'Short answer harus memiliki shortAnswerCorrect numerik.');
    }

    if (!question.irtParams) {
      addIssue(issues, id, 'irtParams', 'IRT params wajib diisi.');
    } else {
      const { discrimination, guessing } = question.irtParams;
      if (!Number.isFinite(discrimination) || discrimination <= 0) {
        addIssue(issues, id, 'irtParams.discrimination', 'Discrimination harus angka > 0.');
      }
      if (!Number.isFinite(guessing) || guessing < 0 || guessing > 1) {
        addIssue(issues, id, 'irtParams.guessing', 'Guessing harus di rentang 0 sampai 1.');
      }
    }
  });

  return issues;
}
