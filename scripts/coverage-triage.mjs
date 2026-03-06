#!/usr/bin/env node
/**
 * Prints uncovered statement/function/branch lines from coverage-final.json
 * for src/hooks and src/stores. Run after `yarn test:coverage`.
 * Supports both coverage/ and src/coverage/ (vitest root: "src/").
 */
import fs from "fs";
import path from "path";

const CWD = process.cwd();
const CANDIDATE_PATHS = [
  path.join(CWD, "coverage", "coverage-final.json"),
  path.join(CWD, "src", "coverage", "coverage-final.json"),
];

const TARGET_SEGMENTS = ["/src/hooks/", "/src/stores/"];

const coveragePath = CANDIDATE_PATHS.find((p) => fs.existsSync(p));
if (!coveragePath) {
  console.error(
    `[coverage-triage] Missing coverage-final.json. Checked: ${CANDIDATE_PATHS.map((p) => `"${p}"`).join(", ")}. Run "yarn test:coverage" first.`,
  );
  process.exit(1);
}

const raw = fs.readFileSync(coveragePath, "utf8");
const coverage = JSON.parse(raw);

const isTarget = (filepath) => {
  const n = filepath.replaceAll(path.sep, "/");
  return TARGET_SEGMENTS.some((seg) => n.includes(seg));
};

for (const [filepath, data] of Object.entries(coverage)) {
  if (!isTarget(filepath)) continue;

  const shortPath = filepath.replace(CWD + path.sep, "").replace(/^src[/\\]/, "");
  const stmtLines = [];
  const funcLines = [];
  const branchLines = [];

  const sm = data.statementMap ?? {};
  const s = data.s ?? {};
  for (const id of Object.keys(sm)) {
    if (Number(s[id]) === 0) {
      stmtLines.push(sm[id].start?.line ?? "?");
    }
  }

  const fm = data.fnMap ?? {};
  const f = data.f ?? {};
  for (const id of Object.keys(fm)) {
    if (Number(f[id]) === 0) {
      funcLines.push(fm[id].line ?? fm[id].loc?.start?.line ?? "?");
    }
  }

  const bm = data.branchMap ?? {};
  const b = data.b ?? {};
  for (const id of Object.keys(bm)) {
    const counts = b[id];
    if (Array.isArray(counts) && counts.some((c) => Number(c) === 0)) {
      branchLines.push(bm[id].line ?? bm[id].loc?.start?.line ?? "?");
    }
  }

  if (stmtLines.length || funcLines.length || branchLines.length) {
    console.log(`\n${shortPath}`);
    if (stmtLines.length) {
      const sorted = [...new Set(stmtLines)].sort((a, b) => a - b);
      console.log(`  stmt:  ${formatRanges(sorted)}`);
    }
    if (funcLines.length) {
      const sorted = [...new Set(funcLines)].sort((a, b) => a - b);
      console.log(`  func:  ${formatRanges(sorted)}`);
    }
    if (branchLines.length) {
      const sorted = [...new Set(branchLines)].sort((a, b) => a - b);
      console.log(`  branch: ${formatRanges(sorted)}`);
    }
  }
}

function formatRanges(lines) {
  if (lines.length === 0) return "";
  const nums = lines.filter((l) => typeof l === "number");
  if (nums.length === 0) return lines.join(", ");
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = start;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}
