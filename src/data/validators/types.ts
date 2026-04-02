export interface ValidationIssue {
  entity: 'Question' | 'StudyMaterial' | 'PTN';
  id: string;
  field: string;
  message: string;
}

export interface ValidationSummary {
  entity: ValidationIssue['entity'];
  total: number;
  validCount: number;
  flaggedCount: number;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  summaries: ValidationSummary[];
  generatedAt: string;
}
