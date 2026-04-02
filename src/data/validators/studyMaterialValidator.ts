import type { StudyMaterial } from '../../types/quiz';
import type { ValidationIssue } from './types';

const addIssue = (issues: ValidationIssue[], id: string, field: string, message: string) => {
  issues.push({ entity: 'StudyMaterial', id, field, message });
};

export function validateStudyMaterials(materials: StudyMaterial[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  materials.forEach((material) => {
    const id = material.id || 'unknown-material-id';

    if (!material.title?.trim()) addIssue(issues, id, 'title', 'Judul materi kosong.');
    if (!material.summary?.trim()) addIssue(issues, id, 'summary', 'Ringkasan materi kosong.');
    if (!material.fullContent?.trim()) addIssue(issues, id, 'fullContent', 'Konten materi kosong.');

    if (!material.sources || material.sources.length === 0) {
      addIssue(issues, id, 'sources', 'Sumber materi minimal 1 item.');
    } else {
      material.sources.forEach((source, index) => {
        if (!source.name?.trim()) addIssue(issues, id, `sources[${index}].name`, 'Nama sumber kosong.');
        if (!source.url?.trim()) addIssue(issues, id, `sources[${index}].url`, 'URL sumber kosong.');
      });
    }

    if (!material.studyBlocks || material.studyBlocks.length === 0) {
      addIssue(issues, id, 'studyBlocks', 'Study blocks minimal 1 item.');
    }
  });

  return issues;
}
