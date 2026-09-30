import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skipBundle = process.argv.includes('--fast');

function run(label, cmd, args, opts = {}) {
  process.stdout.write(`\n── ${label} ──\n`);
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: opts.quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (res.status !== 0 && res.status !== null) {
    const out = `${res.stdout || ''}${res.stderr || ''}`.trim();
    if (opts.quiet && out) process.stdout.write(`${out.split('\n').slice(-25).join('\n')}\n`);
    return { ok: false, out };
  }
  return { ok: true, out: `${res.stdout || ''}${res.stderr || ''}` };
}

const results = [];
function track(label, res) {
  results.push({ label, ok: res.ok });
  return res;
}

track('TypeScript (strict)', run('TypeScript (strict)', 'npx', ['tsc', '--noEmit'], { quiet: true }));

const jest = track('Jest', run('Jest', 'npx', ['jest', '--silent'], { quiet: true }));
const m = jest.out.match(/Tests:\s+(?:.*?)(\d+) failed/);
if (jest.ok && !m) {
  const p = jest.out.match(/Tests:\s+.*?(\d+) passed/);
  if (p) process.stdout.write(`   ${p[1]} tests passed\n`);
}

const KNOWN_DOCTOR = [
  'Check Expo config for common issues',
  'Validate packages against React Native Directory package metadata',
];

const doctor = run('Expo doctor', 'npx', ['expo-doctor'], { quiet: true });
const p = doctor.out.match(/(\d+)\/(\d+) checks passed/);
if (p) process.stdout.write(`   ${p[1]}/${p[2]} passed\n`);
const failedChecks = [...doctor.out.matchAll(/✖ ([^\n]+)/g)].map((x) => x[1].trim());
const known = failedChecks.filter((n) => KNOWN_DOCTOR.some((k) => n.includes(k.slice(0, 30))));
const unknown = failedChecks.filter((n) => !KNOWN_DOCTOR.some((k) => n.includes(k.slice(0, 30))));
for (const n of failedChecks) {
  process.stdout.write(`   ${known.includes(n) ? '(known)' : '! NEW'}  ${n}\n`);
}
results.push({ label: 'Expo doctor', ok: unknown.length === 0, warn: unknown.length === 0 && known.length > 0 });

const audit = run('npm audit', 'npm', ['audit', '--audit-level=high'], { quiet: true });
let high = 0;
const ah = audit.out.match(/(\d+)\s+high(?!\w)/);
const at = audit.out.match(/(\d+) vulnerabilities?\s+\(/);
if (ah) high = Number(ah[1]);
if (at) process.stdout.write(`   ${at[1]} total, ${high} high\n`);
const highNames = [...audit.out.matchAll(/^(\S+)[@\s].*\nSeverity: high/gm)].map((x) => x[1]);
results.push({ label: 'npm audit (high)', ok: high === 0 });

let bundled = null;
if (!skipBundle) {
  const outDir = join(root, '.check-build');
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  bundled = run('Bundle (export)', 'npx', ['expo', 'export', '--platform', 'web', '--output-dir', '.check-build', '--clear'], { quiet: true });
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  if (bundled.ok) {
    const b = bundled.out.match(/\((\d+) modules\)/);
    if (b) process.stdout.write(`   bundled ${b[1]} modules\n`);
  }
  results.push({ label: 'Bundle', ok: bundled.ok });
} else {
  process.stdout.write(`\n── Bundle ── skipped (--fast)\n`);
}

const failed = results.filter((r) => !r.ok);
process.stdout.write(`\n${'═'.repeat(46)}\n`);
for (const r of results) {
  const tag = r.ok ? (r.warn ? 'WARN' : 'PASS') : 'FAIL';
  process.stdout.write(`${tag}  ${r.label}\n`);
}
process.stdout.write(`${'═'.repeat(46)}\n`);

if (failed.length) {
  process.stdout.write(`\n${failed.length} check(s) failed.\n`);
  process.exit(1);
}
const warned = results.filter((r) => r.warn);
process.stdout.write(
  warned.length
    ? `\nAll checks passed. ${warned.length} known warning(s) pending.\n`
    : `\nAll checks passed.\n`,
);
