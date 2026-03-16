import fs from "fs";
import path from "path";

const CWD = process.cwd();
const COVERAGE_SUMMARY_PATHS = [
  path.join(CWD, "coverage", "coverage-summary.json"),
  path.join(CWD, "src", "coverage", "coverage-summary.json"),
];
const BADGE_OUTPUT_PATH = path.join(CWD, "badges", "coverage.json");

const coverageSummaryPath = COVERAGE_SUMMARY_PATHS.find((candidate) => fs.existsSync(candidate));
if (!coverageSummaryPath) {
  const checkedPaths = COVERAGE_SUMMARY_PATHS.map((candidate) => `"${candidate}"`).join(", ");
  console.error(`[coverage-badge] Missing coverage summary. Checked: ${checkedPaths}.`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, "utf8"));
const lineCoveragePct = summary?.total?.lines?.pct;
if (typeof lineCoveragePct !== "number") {
  console.error(`[coverage-badge] Missing total.lines.pct in "${coverageSummaryPath}".`);
  process.exit(1);
}

const roundedPct = Number(lineCoveragePct.toFixed(1));
const color =
  lineCoveragePct >= 95
    ? "brightgreen"
    : lineCoveragePct >= 90
      ? "green"
      : lineCoveragePct >= 80
        ? "yellowgreen"
        : lineCoveragePct >= 70
          ? "yellow"
          : lineCoveragePct >= 60
            ? "orange"
            : "red";

const badge = {
  schemaVersion: 1,
  label: "coverage",
  message: `${roundedPct}%`,
  color,
};

fs.mkdirSync(path.dirname(BADGE_OUTPUT_PATH), { recursive: true });
fs.writeFileSync(BADGE_OUTPUT_PATH, `${JSON.stringify(badge, null, 2)}\n`);

console.log(
  `[coverage-badge] Wrote "${BADGE_OUTPUT_PATH}" from "${coverageSummaryPath}" (${roundedPct}%).`,
);
