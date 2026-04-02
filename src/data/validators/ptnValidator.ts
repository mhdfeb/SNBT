import type { PTN } from '../../types/quiz';
import type { ValidationIssue } from './types';

const addIssue = (issues: ValidationIssue[], id: string, field: string, message: string) => {
  issues.push({ entity: 'PTN', id, field, message });
};

export function validatePTNData(ptnList: PTN[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  ptnList.forEach((ptn) => {
    const id = ptn.id || 'unknown-ptn-id';

    if (!ptn.name?.trim()) addIssue(issues, id, 'name', 'Nama PTN kosong.');
    if (!ptn.location?.trim()) addIssue(issues, id, 'location', 'Lokasi PTN kosong.');
    if (!ptn.logo?.trim()) addIssue(issues, id, 'logo', 'Logo PTN kosong.');

    if (!ptn.prodi || ptn.prodi.length === 0) {
      addIssue(issues, id, 'prodi', 'Prodi minimal 1 item.');
      return;
    }

    ptn.prodi.forEach((prodi, index) => {
      if (!prodi.id?.trim()) addIssue(issues, id, `prodi[${index}].id`, 'ID prodi kosong.');
      if (!prodi.name?.trim()) addIssue(issues, id, `prodi[${index}].name`, 'Nama prodi kosong.');
      if (!Number.isFinite(prodi.passingGrade) || prodi.passingGrade <= 0) {
        addIssue(issues, id, `prodi[${index}].passingGrade`, 'Passing grade harus angka > 0.');
      }
      if (!Number.isInteger(prodi.capacity) || prodi.capacity <= 0) {
        addIssue(issues, id, `prodi[${index}].capacity`, 'Kapasitas harus bilangan bulat > 0.');
      }
      if (!Number.isInteger(prodi.applicants) || prodi.applicants < 0) {
        addIssue(issues, id, `prodi[${index}].applicants`, 'Peminat harus bilangan bulat >= 0.');
      }
    });
  });

  return issues;
}
