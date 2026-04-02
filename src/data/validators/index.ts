import { QUESTIONS } from '../questions';
import { STUDY_MATERIALS } from '../materials';
import { PTN_DATA } from '../ptn';
import { validateQuestions } from './questionValidator';
import { validateStudyMaterials } from './studyMaterialValidator';
import { validatePTNData } from './ptnValidator';
import type { ValidationIssue, ValidationReport, ValidationSummary } from './types';

function summarize(entity: ValidationSummary['entity'], total: number, issues: ValidationIssue[]): ValidationSummary {
  const flaggedIdCount = new Set(issues.map((issue) => issue.id)).size;
  return {
    entity,
    total,
    validCount: Math.max(0, total - flaggedIdCount),
    flaggedCount: flaggedIdCount,
  };
}

export function validateAllDataSchemas(): ValidationReport {
  const questionIssues = validateQuestions(QUESTIONS);
  const materialIssues = validateStudyMaterials(STUDY_MATERIALS);
  const ptnIssues = validatePTNData(PTN_DATA);

  const issues = [...questionIssues, ...materialIssues, ...ptnIssues];
  const summaries: ValidationSummary[] = [
    summarize('Question', QUESTIONS.length, questionIssues),
    summarize('StudyMaterial', STUDY_MATERIALS.length, materialIssues),
    summarize('PTN', PTN_DATA.length, ptnIssues),
  ];

  return {
    issues,
    summaries,
    generatedAt: new Date().toISOString(),
  };
}
