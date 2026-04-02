import {
  Difficulty,
  Question,
  QuestionBlueprint,
  QuestionQualityMetadata,
  SourceValidity,
} from '../../types/quiz';

const COGNITIVE_BY_DIFFICULTY: Record<Difficulty, QuestionBlueprint['cognitiveLevel']> = {
  easy: 'C2',
  medium: 'C3',
  trap: 'C4',
};

const QUALITY_COGNITIVE_BY_DIFFICULTY: Record<Difficulty, QuestionQualityMetadata['cognitiveLevel']> = {
  easy: 'understand',
  medium: 'apply',
  trap: 'analyze',
};

const SOURCE_VALIDITY_BY_CATEGORY: Record<Question['category'], SourceValidity> = {
  TPS: 'verified',
  'Literasi Indonesia': 'reviewed',
  'Literasi Inggris': 'reviewed',
  'Penalaran Matematika': 'verified',
};

type QuestionSeed = Omit<Question, 'blueprint' | 'qualityMetadata'> &
  Partial<Pick<Question, 'blueprint' | 'qualityMetadata'>>;

const DEFAULT_IRT: Question['irtParams'] = {
  difficulty: 0,
  discrimination: 1,
  guessing: 0.2,
};

function normalizeByType(question: QuestionSeed): QuestionSeed {
  if (question.type === 'multiple_choice') {
    const safeOptions = question.options?.length
      ? question.options
      : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E'];
    const safeCorrectAnswer =
      typeof question.correctAnswer === 'number' && question.correctAnswer >= 0
        ? question.correctAnswer
        : 0;
    return {
      ...question,
      options: safeOptions,
      correctAnswer: safeCorrectAnswer,
      complexOptions: undefined,
      shortAnswerCorrect: undefined,
    };
  }

  if (question.type === 'complex_multiple_choice') {
    const safeComplexOptions = question.complexOptions?.length
      ? question.complexOptions
      : [{ statement: 'Pernyataan placeholder', correct: false }];
    return {
      ...question,
      complexOptions: safeComplexOptions,
      options: undefined,
      correctAnswer: undefined,
      shortAnswerCorrect: undefined,
    };
  }

  const safeShortAnswer =
    typeof question.shortAnswerCorrect === 'number' ? question.shortAnswerCorrect : 0;
  return {
    ...question,
    shortAnswerCorrect: safeShortAnswer,
    options: undefined,
    correctAnswer: undefined,
    complexOptions: undefined,
  };
}

function ensureQualityMetadata(question: QuestionSeed): QuestionQualityMetadata {
  if (question.qualityMetadata) return question.qualityMetadata;

  return {
    subtopic: question.concept,
    cognitiveLevel: QUALITY_COGNITIVE_BY_DIFFICULTY[question.difficulty] ?? 'apply',
    targetDifficulty: question.difficulty,
    competencyGoal: getDefaultCompetencyIndicator(question.concept, COGNITIVE_BY_DIFFICULTY[question.difficulty] ?? 'C3'),
    lifecycleStatus: 'active',
  };
}

export function withBlueprintMetadata(questions: QuestionSeed[]): Question[] {
  return questions.map((rawQuestion) => {
    const question = normalizeByType(rawQuestion);
    const cognitiveLevel = COGNITIVE_BY_DIFFICULTY[question.difficulty] ?? 'C3';
    return {
      ...question,
      blueprint: {
        subtopic: question.concept,
        cognitiveLevel,
        competencyIndicator: getDefaultCompetencyIndicator(question.concept, cognitiveLevel),
        sourceValidity: SOURCE_VALIDITY_BY_CATEGORY[question.category] ?? 'draft',
      },
      irtParams: question.irtParams ?? DEFAULT_IRT,
      qualityMetadata: ensureQualityMetadata(question),
    };
  });
}

function getDefaultCompetencyIndicator(concept: string, level: QuestionBlueprint['cognitiveLevel']): string {
  return `Peserta mampu menyelesaikan soal ${concept.toLowerCase()} pada level ${level}`;
}
