import fs from "node:fs";
import path from "node:path";

import { distRoot, listDistModuleFiles, normalizeRelativeSpecifiers } from "./dist-esm-utils.mjs";

if (!fs.existsSync(distRoot)) {
  console.error("[normalize-dist-esm] dist/ not found. Run the TypeScript build first.");
  process.exit(1);
}

let touchedFiles = 0;
let rewrittenImports = 0;

for (const filePath of listDistModuleFiles()) {
  const source = fs.readFileSync(filePath, "utf8");
  const { updatedSource, rewriteCount } = normalizeRelativeSpecifiers(source, filePath);

  if (!rewriteCount || updatedSource === source) {
    continue;
  }

  fs.writeFileSync(filePath, updatedSource, "utf8");
  touchedFiles += 1;
  rewrittenImports += rewriteCount;
}

const summary = `[normalize-dist-esm] Rewrote ${rewrittenImports} relative imports across ${touchedFiles} files.`;
console.log(summary);

if (!rewrittenImports) {
  console.warn(
    "[normalize-dist-esm] No dist imports needed rewriting. Verify the build output still matches package expectations.",
  );
}
