import fs from "node:fs";
import path from "node:path";

import { distRoot, findInvalidRelativeSpecifiers, listDistModuleFiles } from "./dist-esm-utils.mjs";

if (!fs.existsSync(distRoot)) {
  console.error("[verify-dist-esm] dist/ not found. Run the TypeScript build first.");
  process.exit(1);
}

const failures = [];

for (const filePath of listDistModuleFiles()) {
  const source = fs.readFileSync(filePath, "utf8");
  const invalidSpecifiers = findInvalidRelativeSpecifiers(source, filePath);

  if (invalidSpecifiers.length) {
    failures.push(
      `${path.relative(distRoot, filePath)} has unresolved relative imports: ${invalidSpecifiers.join(", ")}`,
    );
  }
}

const packageEntryPath = path.join(distRoot, "index.js");
if (fs.existsSync(packageEntryPath)) {
  const packageEntry = fs.readFileSync(packageEntryPath, "utf8");

  if (
    packageEntry.includes('require("util")') ||
    packageEntry.includes("DEBUG_DEPTH") ||
    packageEntry.includes("DEBUG_ARRAY")
  ) {
    failures.push("index.js still contains the Node-only util debug patch.");
  }
}

if (failures.length) {
  console.error("[verify-dist-esm] Build output is not publishable:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[verify-dist-esm] dist ESM output verified.");
