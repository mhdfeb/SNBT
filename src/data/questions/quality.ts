import { Difficulty, Question, QuestionBlueprint, SourceValidity } from '../../types/quiz';

const COGNITIVE_BY_DIFFICULTY: Record<Difficulty, QuestionBlueprint['cognitiveLevel']> = {
  easy: 'C2',
  medium: 'C3',
  trap: 'C4',
};

const SOURCE_VALIDITY_BY_CATEGORY: Record<Question['category'], SourceValidity> = {
  TPS: 'verified',
  'Literasi Indonesia': 'reviewed',
  'Literasi Inggris': 'reviewed',
  'Penalaran Matematika': 'verified',
};

export function withBlueprintMetadata(questions: Omit<Question, 'blueprint'>[]): Question[] {
  return questions.map((question) => {
    const cognitiveLevel = COGNITIVE_BY_DIFFICULTY[question.difficulty] ?? 'C3';
    return {
      ...question,
      blueprint: {
        subtopic: question.concept,
        cognitiveLevel,
        competencyIndicator: getDefaultCompetencyIndicator(question.concept, cognitiveLevel),
        sourceValidity: SOURCE_VALIDITY_BY_CATEGORY[question.category] ?? 'draft',
      },
    };
  });
}

function getDefaultCompetencyIndicator(concept: string, level: QuestionBlueprint['cognitiveLevel']): string {
  return `Peserta mampu menyelesaikan soal ${concept.toLowerCase()} pada level ${level}`;
}
