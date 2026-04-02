import { execSync } from 'node:child_process';

const markerPattern = ['<'.repeat(7), '='.repeat(7), '>'.repeat(7)].join('|');
const cmd = `rg -n --glob '!node_modules/**' --glob '!dist/**' --glob '!scripts/check-conflict-markers.mjs' "${markerPattern}" .`;

try {
  const output = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (output) {
    console.error('❌ Merge-conflict markers detected:\n');
    console.error(output);
    process.exit(1);
  }
} catch (error) {
  if (typeof error?.status === 'number' && error.status === 1) {
    console.log('✅ No merge-conflict markers found.');
    process.exit(0);
  }

  console.error('❌ Failed to run conflict-marker check.');
  console.error(error?.message ?? error);
  process.exit(1);
}
