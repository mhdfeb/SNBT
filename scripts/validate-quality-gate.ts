import { QUESTIONS } from '../src/data/questions';
import { Category, Difficulty, ItemLifecycleStatus } from '../src/types/quiz';

const BLUEPRINT_PROPORTION: Record<Category, Record<Difficulty, number>> = {
  TPS: { easy: 0.3, medium: 0.45, trap: 0.25 },
  'Literasi Indonesia': { easy: 0.25, medium: 0.5, trap: 0.25 },
  'Literasi Inggris': { easy: 0.25, medium: 0.5, trap: 0.25 },
  'Penalaran Matematika': { easy: 0.2, medium: 0.45, trap: 0.35 },
};

const TOLERANCE = 0.35;

function checkRequiredMetadata() {
  const errors: string[] = [];
  QUESTIONS.forEach((question) => {
    const md = question.qualityMetadata;
    if (!md.subtopic?.trim()) errors.push(`${question.id}: subtopic kosong`);
    if (!md.cognitiveLevel) errors.push(`${question.id}: cognitiveLevel kosong`);
    if (!md.targetDifficulty) errors.push(`${question.id}: targetDifficulty kosong`);
    if (!md.competencyGoal?.trim()) errors.push(`${question.id}: competencyGoal kosong`);
    if (!md.lifecycleStatus) errors.push(`${question.id}: lifecycleStatus kosong`);
  });
  return errors;
}

function checkBlueprintCoverage() {
  const activeQuestions = QUESTIONS.filter((q) => q.qualityMetadata.lifecycleStatus === 'active');
  const errors: string[] = [];

  (Object.keys(BLUEPRINT_PROPORTION) as Category[]).forEach((category) => {
    const byCategory = activeQuestions.filter((q) => q.category === category);
    const total = byCategory.length || 1;

    (Object.keys(BLUEPRINT_PROPORTION[category]) as Difficulty[]).forEach((difficulty) => {
      const actual = byCategory.filter((q) => q.qualityMetadata.targetDifficulty === difficulty).length / total;
      const target = BLUEPRINT_PROPORTION[category][difficulty];
      if (Math.abs(actual - target) > TOLERANCE) {
        errors.push(
          `${category} ${difficulty}: proporsi ${(actual * 100).toFixed(1)}% di luar toleransi target ${(target * 100).toFixed(1)}% ± ${(TOLERANCE * 100).toFixed(1)}%`
        );
      }
    });
  });

  return errors;
}

function checkLifecycleProgression() {
  const lifecycleOrder: ItemLifecycleStatus[] = ['draft', 'reviewed', 'active', 'deprecated'];
  const lifecycleSet = new Set(QUESTIONS.map((q) => q.qualityMetadata.lifecycleStatus));
  const missing = lifecycleOrder.filter((status) => !lifecycleSet.has(status));
  return missing.map((status) => `Status lifecycle belum terpakai: ${status}`);
}

function run() {
  const metadataErrors = checkRequiredMetadata();
  const blueprintErrors = checkBlueprintCoverage();
  const lifecycleErrors = checkLifecycleProgression();
  const allErrors = [...metadataErrors, ...blueprintErrors, ...lifecycleErrors];

  if (allErrors.length > 0) {
    console.error('❌ Quality gate gagal:');
    allErrors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`✅ Quality gate lulus untuk ${QUESTIONS.length} soal.`);
}

run();
