import fs from "fs";
import path from "path";

const CWD = process.cwd();
const CANDIDATE_PATHS = [
  path.join(CWD, "coverage", "coverage-summary.json"),
  path.join(CWD, "src", "coverage", "coverage-summary.json"),
];

const COVERAGE_SUMMARY_PATH = CANDIDATE_PATHS.find((p) => fs.existsSync(p)) ?? CANDIDATE_PATHS[0];

const TARGET_SEGMENTS = ["/src/hooks/", "/src/stores/"];
const METRICS = ["lines", "branches", "functions", "statements"];

const fail = (message) => {
  console.error(`[coverage] ${message}`);
  process.exit(1);
};

if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
  fail(
    `Missing coverage summary. Checked: ${CANDIDATE_PATHS.map((p) => `"${p}"`).join(", ")}. Run "yarn test:coverage" first.`,
  );
}

const raw = fs.readFileSync(COVERAGE_SUMMARY_PATH, "utf8");
const summary = JSON.parse(raw);

const fileEntries = Object.entries(summary).filter(([key]) => key !== "total");
const targetEntries = fileEntries.filter(([filename]) => {
  const normalized = filename.replaceAll(path.sep, "/");
  return TARGET_SEGMENTS.some((segment) => normalized.includes(segment));
});

if (targetEntries.length === 0) {
  fail(
    `No covered files found under src/hooks or src/stores. Summary path: "${COVERAGE_SUMMARY_PATH}".`,
  );
}

const failures = [];
for (const [filename, report] of targetEntries) {
  for (const metric of METRICS) {
    const pct = report?.[metric]?.pct;
    if (typeof pct !== "number" || pct < 100) {
      failures.push(`${filename} -> ${metric}: ${pct ?? "n/a"}%`);
    }
  }
}

if (failures.length > 0) {
  console.error("[coverage] 100% coverage required for src/hooks and src/stores.");
  console.error(`[coverage] Summary path: "${COVERAGE_SUMMARY_PATH}"`);
  for (const line of failures) {
    console.error(`- ${line}`);
  }
  process.exit(1);
}

console.log(
  `[coverage] Hooks/stores coverage is 100% for ${targetEntries.length} files (lines/branches/functions/statements).`,
);
