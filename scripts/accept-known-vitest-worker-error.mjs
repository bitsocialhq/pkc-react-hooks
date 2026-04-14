import fs from "fs";
import path from "path";

const logPath = process.argv[2];

if (!logPath) {
  console.error("Usage: node scripts/accept-known-vitest-worker-error.mjs <log-path>");
  process.exit(1);
}

const resolvedLogPath = path.resolve(logPath);
if (!fs.existsSync(resolvedLogPath)) {
  console.error(`Vitest log not found at ${resolvedLogPath}`);
  process.exit(1);
}

const log = fs.readFileSync(resolvedLogPath, "utf8");
const plainLog = log.replace(/\u001b\[[0-9;]*m/g, "");

const hasKnownWorkerError = /\[vitest-pool\]: Worker (forks|threads) emitted error\./.test(
  plainLog,
);
const hasOutOfMemorySignal = /JS heap out of memory|ERR_WORKER_OUT_OF_MEMORY/.test(plainLog);
const hasSingleUnhandledError = /Vitest caught 1 unhandled error during the test run\./.test(
  plainLog,
);

const testFilesLine = plainLog.match(/Test Files\s+([^\n]+)/)?.[1] || "";
const testsLine = plainLog.match(/Tests\s+([^\n]+)/)?.[1] || "";

const coverageSummaryCandidates = [
  path.join(process.cwd(), "coverage", "coverage-summary.json"),
  path.join(process.cwd(), "src", "coverage", "coverage-summary.json"),
];
const coverageSummaryPath = coverageSummaryCandidates.find((candidate) => fs.existsSync(candidate));

if (!coverageSummaryPath) {
  console.error("Coverage summary not found after Vitest failure.");
  process.exit(1);
}

if (!hasKnownWorkerError || !hasOutOfMemorySignal) {
  console.error("Vitest failure was not the known worker-teardown OOM.");
  process.exit(1);
}

if (!testFilesLine || /\bfailed\b/i.test(testFilesLine)) {
  console.error(`Vitest test-file summary was not fully green: ${testFilesLine || "<missing>"}`);
  process.exit(1);
}

if (!testsLine || /\bfailed\b/i.test(testsLine)) {
  console.error(`Vitest test summary was not fully green: ${testsLine || "<missing>"}`);
  process.exit(1);
}

if (!hasSingleUnhandledError) {
  console.error("Vitest failure did not match the known single unhandled worker error.");
  process.exit(1);
}

console.log(
  `Accepting known Vitest false-negative after coverage completed: ${path.relative(process.cwd(), coverageSummaryPath)}`,
);
