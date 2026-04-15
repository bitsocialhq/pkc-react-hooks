import fs from "node:fs";
import path from "node:path";

export const repoRoot = path.resolve(import.meta.dirname, "..");
export const distRoot = path.join(repoRoot, "dist");

const staticImportPattern = /(from\s+|import\s+)(['"])(\.\.?\/[^'"]+)\2/g;
const dynamicImportPattern = /\bimport\(\s*(['"])(\.\.?\/[^'"]+)\1\s*\)/g;

const splitSpecifier = (specifier) => {
  const suffixStart = specifier.search(/[?#]/);

  if (suffixStart === -1) {
    return { bareSpecifier: specifier, suffix: "" };
  }

  return {
    bareSpecifier: specifier.slice(0, suffixStart),
    suffix: specifier.slice(suffixStart),
  };
};

const resolveRelativeSpecifier = (filePath, specifier) => {
  const { bareSpecifier, suffix } = splitSpecifier(specifier);

  if (path.extname(bareSpecifier)) {
    return null;
  }

  const absoluteSpecifierPath = path.resolve(path.dirname(filePath), bareSpecifier);

  if (fs.existsSync(`${absoluteSpecifierPath}.js`)) {
    return `${bareSpecifier}.js${suffix}`;
  }

  if (fs.existsSync(path.join(absoluteSpecifierPath, "index.js"))) {
    return `${bareSpecifier}/index.js${suffix}`;
  }

  return null;
};

const relativeSpecifierExists = (filePath, specifier) => {
  const { bareSpecifier } = splitSpecifier(specifier);
  const absoluteSpecifierPath = path.resolve(path.dirname(filePath), bareSpecifier);

  if (path.extname(bareSpecifier)) {
    return fs.existsSync(absoluteSpecifierPath);
  }

  return (
    fs.existsSync(`${absoluteSpecifierPath}.js`) ||
    fs.existsSync(path.join(absoluteSpecifierPath, "index.js"))
  );
};

export const listDistModuleFiles = () => {
  const files = [];
  const stack = [distRoot];

  while (stack.length) {
    const currentPath = stack.pop();
    if (!currentPath || !fs.existsSync(currentPath)) {
      continue;
    }

    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (
        entry.isFile() &&
        (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts"))
      ) {
        files.push(entryPath);
      }
    }
  }

  return files.sort();
};

export const normalizeRelativeSpecifiers = (source, filePath) => {
  let rewriteCount = 0;

  const replaceStaticSpecifier = (match, prefix, quote, specifier) => {
    const resolvedSpecifier = resolveRelativeSpecifier(filePath, specifier);

    if (!resolvedSpecifier || resolvedSpecifier === specifier) {
      return match;
    }

    rewriteCount += 1;
    return `${prefix}${quote}${resolvedSpecifier}${quote}`;
  };

  const replaceDynamicSpecifier = (match, quote, specifier) => {
    const resolvedSpecifier = resolveRelativeSpecifier(filePath, specifier);

    if (!resolvedSpecifier || resolvedSpecifier === specifier) {
      return match;
    }

    rewriteCount += 1;
    return `import(${quote}${resolvedSpecifier}${quote})`;
  };

  const updatedSource = source
    .replace(staticImportPattern, replaceStaticSpecifier)
    .replace(dynamicImportPattern, replaceDynamicSpecifier);

  return { updatedSource, rewriteCount };
};

export const findInvalidRelativeSpecifiers = (source, filePath) => {
  const issues = [];
  const collect = (specifier) => {
    if (!relativeSpecifierExists(filePath, specifier)) {
      issues.push(specifier);
    }
  };

  const collectStatic = (match, prefix, quote, specifier) => {
    collect(specifier);
    return match;
  };

  const collectDynamic = (match, quote, specifier) => {
    collect(specifier);
    return match;
  };

  source
    .replace(staticImportPattern, collectStatic)
    .replace(dynamicImportPattern, collectDynamic);

  return issues;
};
