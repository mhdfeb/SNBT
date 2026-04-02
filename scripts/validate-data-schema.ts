import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateAllDataSchemas } from '../src/data/validators';

function formatIssueLine(issue: { entity: string; id: string; field: string; message: string }) {
  return `- [${issue.entity}] id=${issue.id} field=${issue.field} :: ${issue.message}`;
}

function writeAuditMarkdown(report: ReturnType<typeof validateAllDataSchemas>) {
  const auditDir = resolve(process.cwd(), 'audit');
  mkdirSync(auditDir, { recursive: true });

  const lines: string[] = [
    '# Data Validation Audit',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    '| Entity | Total | Valid Count | Flagged Count |',
    '|---|---:|---:|---:|',
    ...report.summaries.map((summary) => `| ${summary.entity} | ${summary.total} | ${summary.validCount} | ${summary.flaggedCount} |`),
    '',
  ];

  if (report.issues.length > 0) {
    lines.push('## Flagged Items', '', ...report.issues.map(formatIssueLine), '');
  } else {
    lines.push('## Flagged Items', '', 'Tidak ada item bermasalah.', '');
  }

  const outputPath = resolve(auditDir, 'data_validation_audit.md');
  writeFileSync(outputPath, `${lines.join('\n')}`, 'utf-8');
  return outputPath;
}

function run() {
  const report = validateAllDataSchemas();
  const auditPath = writeAuditMarkdown(report);

  console.log('=== Data Schema Validation ===');
  report.summaries.forEach((summary) => {
    console.log(`${summary.entity}: total=${summary.total}, valid=${summary.validCount}, flagged=${summary.flaggedCount}`);
  });
  console.log(`Audit markdown ditulis ke: ${auditPath}`);

  if (report.issues.length > 0) {
    console.error('\n❌ Ditemukan data invalid:');
    report.issues.forEach((issue) => console.error(formatIssueLine(issue)));
    process.exit(1);
  }

  console.log('\n✅ Semua data lolos validasi skema.');
}

run();
