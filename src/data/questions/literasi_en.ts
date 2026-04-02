import { Question } from '../../types/quiz';
import { withBlueprintMetadata } from './quality';

export const LITERASI_EN_QUESTIONS: Question[] = withBlueprintMetadata([
  // --- Literasi Bahasa Inggris ---
  {
    id: 'lit-en-1',
    category: 'Literasi Inggris',
    concept: 'Literasi Bahasa Inggris',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Text: "Artificial Intelligence (AI) is transforming the healthcare industry by providing faster diagnosis and personalized treatment plans." What is the main idea of the text?',
    options: [
      'The history of AI in medicine',
      'How AI is used in technology',
      'The impact of AI on healthcare',
      'The cost of AI in hospitals',
      'The risks of using AI for diagnosis'
    ],
    correctAnswer: 2,
    explanation: 'The text focuses on how AI is changing (transforming) healthcare through diagnosis and treatment.',
    irtParams: { difficulty: 0.3, discrimination: 1.3, guessing: 0.2 }
  },
  {
    id: 'lit-en-2',
    category: 'Literasi Inggris',
    concept: 'Literasi Bahasa Inggris',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'What is the synonym of the word "ENORMOUS"?',
    options: ['Small', 'Tiny', 'Huge', 'Weak', 'Soft'],
    correctAnswer: 2,
    explanation: 'Enormous means very large in size, quantity, or extent. Huge is the closest synonym.',
    irtParams: { difficulty: 1.4, discrimination: 1.1, guessing: 0.2 }
  },
  {
    id: 'lit-en-3-new',
    category: 'Literasi Inggris',
    concept: 'Literasi Bahasa Inggris',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Text: "The Great Barrier Reef is facing severe threats from climate change, which causes coral bleaching." What is the cause of coral bleaching according to the text?',
    options: ['Pollution', 'Overfishing', 'Climate change', 'Tourism', 'Natural predators'],
    correctAnswer: 2,
    explanation: 'The text explicitly states that climate change causes coral bleaching.',
    irtParams: { difficulty: 0.2, discrimination: 1.2, guessing: 0.2 }
  },
  {
    id: 'lit-en-4-new',
    category: 'Literasi Inggris',
    concept: 'Literasi Bahasa Inggris',
    difficulty: 'trap',
    type: 'multiple_choice',
    question: 'Text: "The rapid depletion of fossil fuels has prompted scientists to explore sustainable energy alternatives such as solar and wind power." The word "prompted" is closest in meaning to...',
    options: ['Discouraged', 'Encouraged', 'Delayed', 'Prevented', 'Ignored'],
    correctAnswer: 1,
    explanation: 'Prompted means to cause or bring about an action. Encouraged is the closest synonym in this context.',
    irtParams: { difficulty: 1.3, discrimination: 1.4, guessing: 0.2 }
  },
  {
    id: 'lit-en-7',
    category: 'Literasi Inggris',
    concept: 'Literasi Bahasa Inggris',
    difficulty: 'medium',
    type: 'multiple_choice',
    question: 'Teks: "The mountains stood majestically against the clear blue sky, their snow-capped peaks glistening in the morning sun. The air was crisp and fresh, filled with the sweet scent of pine and the distant sound of a rushing stream." What is the tone of the author in the text?',
    options: ['Sarcastic', 'Critical', 'Appreciative', 'Indifferent', 'Pessimistic'],
    correctAnswer: 2,
    explanation: 'The author uses positive and descriptive words like "majestically", "glistening", and "sweet scent", which shows an appreciative tone towards nature.',
    irtParams: { difficulty: 1.5, discrimination: 1.4, guessing: 0.2 }
  }
]);
