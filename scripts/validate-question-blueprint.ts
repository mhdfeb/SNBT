import { QUESTIONS } from '../src/data/questions';

const MIN_COVERAGE = {
  byCategory: 5,
  byCognitiveLevel: 5,
  bySourceValidity: 5,
};

function toCountMap<T extends string>(items: T[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

const bySubtopic = toCountMap(QUESTIONS.map((q) => q.blueprint.subtopic));
const byCognitive = toCountMap(QUESTIONS.map((q) => q.blueprint.cognitiveLevel));
const bySourceValidity = toCountMap(QUESTIONS.map((q) => q.blueprint.sourceValidity));
const byCategory = toCountMap(QUESTIONS.map((q) => q.category));

const issues: string[] = [];

Object.entries(byCategory).forEach(([category, count]) => {
  if (count < MIN_COVERAGE.byCategory) {
    issues.push(`Kategori ${category} hanya memiliki ${count} soal (< ${MIN_COVERAGE.byCategory}).`);
  }
});

Object.entries(byCognitive).forEach(([level, count]) => {
  if (count < MIN_COVERAGE.byCognitiveLevel) {
    issues.push(`Level kognitif ${level} hanya ${count} soal (< ${MIN_COVERAGE.byCognitiveLevel}).`);
  }
});

Object.entries(bySourceValidity).forEach(([source, count]) => {
  if (count < MIN_COVERAGE.bySourceValidity) {
    issues.push(`Source validity ${source} hanya ${count} soal (< ${MIN_COVERAGE.bySourceValidity}).`);
  }
});

console.log('=== Blueprint Distribution ===');
console.log('Total soal:', QUESTIONS.length);
console.log('Kategori:', byCategory);
console.log('Subtopik:', bySubtopic);
console.log('Level kognitif:', byCognitive);
console.log('Source validity:', bySourceValidity);

if (issues.length > 0) {
  console.error('\nVALIDASI GAGAL:');
  issues.forEach((issue) => console.error('-', issue));
  process.exit(1);
}

console.log('\nVALIDASI LULUS: distribusi blueprint memenuhi batas minimum.');
