#!/usr/bin/env node

/**
 * validate_coverage.mjs
 *
 * Validates that every changed line from a git diff appears in the organized review sections.
 *
 * Usage:
 *   node validate_coverage.mjs <raw_diff_file_or_-> <organized_sections.json>
 *
 * Examples:
 *   git diff main...HEAD | node validate_coverage.mjs - sections.json
 *   node validate_coverage.mjs raw.diff sections.json
 *
 * Exit codes:
 *   0 = full coverage
 *   1 = missing lines found
 *   2 = input error
 */

import { readFileSync } from "fs";
import { resolve } from "path";

function readDiffInput(arg) {
  if (arg === "-") {
    return readFileSync(0, "utf-8");
  }
  return readFileSync(resolve(arg), "utf-8");
}

/**
 * Parse a unified diff into a set of changed lines.
 * Returns: Map<filePath, Set<string>> where each string is "add:lineNo" or "delete:lineNo"
 */
function parseDiff(diffText) {
  const files = new Map();
  let currentFile = null;
  let oldLine = 0;
  let newLine = 0;

  for (const rawLine of diffText.split("\n")) {
    // Detect file path from diff header
    const diffMatch = rawLine.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (diffMatch) {
      currentFile = diffMatch[2];
      if (!files.has(currentFile)) files.set(currentFile, new Set());
      continue;
    }

    // Hunk header
    const hunkMatch = rawLine.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[2], 10);
      continue;
    }

    if (!currentFile) continue;

    // Skip binary / no newline markers
    if (
      rawLine.startsWith("---") ||
      rawLine.startsWith("+++") ||
      rawLine.startsWith("\\")
    )
      continue;
    if (
      rawLine.startsWith("index ") ||
      rawLine.startsWith("new file") ||
      rawLine.startsWith("deleted file") ||
      rawLine.startsWith("similarity") ||
      rawLine.startsWith("rename") ||
      rawLine.startsWith("old mode") ||
      rawLine.startsWith("new mode")
    )
      continue;

    const lineSet = files.get(currentFile);
    if (!lineSet) continue;

    if (rawLine.startsWith("+")) {
      lineSet.add(`add:${newLine}`);
      newLine++;
    } else if (rawLine.startsWith("-")) {
      lineSet.add(`delete:${oldLine}`);
      oldLine++;
    } else if (rawLine.startsWith(" ") || rawLine === "") {
      // Context line
      oldLine++;
      newLine++;
    }
  }

  return files;
}

/**
 * Parse organized sections JSON into the same format for comparison.
 */
function parseSections(sections) {
  const files = new Map();
  for (const section of sections) {
    for (const file of section.files || []) {
      const parsed = parseDiff((file.patches || []).join("\n"));
      for (const [path, lineSet] of parsed) {
        if (!files.has(path)) files.set(path, new Set());
        for (const key of lineSet) files.get(path).add(key);
      }
    }
  }
  return files;
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: node validate_coverage.mjs <raw_diff_file_or_-> <organized_sections.json>",
  );
  process.exit(2);
}

try {
  const diffText = readDiffInput(args[0]);
  const sectionsJson = readFileSync(resolve(args[1]), "utf-8");
  const sectionsData = JSON.parse(sectionsJson);
  const sections = sectionsData.sections || sectionsData;

  const diffLines = parseDiff(diffText);
  const sectionLines = parseSections(
    Array.isArray(sections) ? sections : [sections],
  );

  let totalChanged = 0;
  let totalCovered = 0;
  const missing = new Map();

  for (const [filePath, lineSet] of diffLines) {
    const coveredSet = sectionLines.get(filePath) || new Set();
    const fileMissing = [];

    for (const lineKey of lineSet) {
      totalChanged++;
      if (coveredSet.has(lineKey)) {
        totalCovered++;
      } else {
        fileMissing.push(lineKey);
      }
    }

    if (fileMissing.length > 0) {
      missing.set(filePath, fileMissing);
    }
  }

  const coverage =
    totalChanged > 0 ? ((totalCovered / totalChanged) * 100).toFixed(1) : 100;

  console.log(`\nCoverage Report`);
  console.log(`===============`);
  console.log(`Total changed lines: ${totalChanged}`);
  console.log(`Covered in review:   ${totalCovered}`);
  console.log(`Coverage:            ${coverage}%\n`);

  if (missing.size > 0) {
    console.log(`Missing lines:`);
    for (const [filePath, lines] of missing) {
      console.log(`\n  ${filePath}:`);
      for (const line of lines.sort()) {
        const [type, no] = line.split(":");
        const prefix = type === "add" ? "+" : "-";
        console.log(`    ${prefix} line ${no}`);
      }
    }
    console.log("");
    process.exit(1);
  } else {
    console.log(`All changed lines are covered in the review sections.`);
    process.exit(0);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(2);
}
