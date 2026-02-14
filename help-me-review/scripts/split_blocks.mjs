#!/usr/bin/env node

/**
 * split_blocks.mjs
 *
 * Splits a raw unified diff into individual block files (one per hunk)
 * and generates an index.md summary.
 *
 * Usage:
 *   node split_blocks.mjs <raw.diff> <output-dir>
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";

function parseRawDiff(input) {
  const lines = input.split("\n");
  const blocks = [];

  let currentFilePath = null;
  let currentMeta = []; // diff --git, ---, +++, index, etc.
  let currentHunkHeader = null;
  let currentHunkLines = [];

  function flushHunk() {
    if (currentHunkHeader && currentFilePath) {
      blocks.push({
        filePath: currentFilePath,
        meta: [...currentMeta],
        hunkHeader: currentHunkHeader,
        hunkLines: [...currentHunkLines],
      });
    }
    currentHunkHeader = null;
    currentHunkLines = [];
  }

  for (const line of lines) {
    // New file
    const diffGitMatch = line.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (diffGitMatch) {
      flushHunk();
      currentFilePath = diffGitMatch[2];
      currentMeta = [line];
      continue;
    }

    // Meta lines (between diff --git and first @@)
    if (
      currentFilePath &&
      !currentHunkHeader &&
      (line.startsWith("--- ") ||
        line.startsWith("+++ ") ||
        line.startsWith("index ") ||
        line.startsWith("new file") ||
        line.startsWith("deleted file") ||
        line.startsWith("similarity") ||
        line.startsWith("rename") ||
        line.startsWith("old mode") ||
        line.startsWith("new mode") ||
        line.startsWith("Binary"))
    ) {
      currentMeta.push(line);
      continue;
    }

    // Hunk header
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
    if (hunkMatch) {
      flushHunk();
      currentHunkHeader = line;
      continue;
    }

    // Hunk content
    if (currentHunkHeader) {
      currentHunkLines.push(line);
    }
  }

  flushHunk();
  return blocks;
}

function countChanges(hunkLines) {
  let adds = 0;
  let deletes = 0;
  for (const line of hunkLines) {
    if (line.startsWith("+")) adds++;
    else if (line.startsWith("-")) deletes++;
  }
  return { adds, deletes };
}

function annotateHunk(hunkHeader, hunkLines) {
  const match = hunkHeader.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  if (!match) return null;

  let oldLine = parseInt(match[1]);
  let newLine = parseInt(match[3]);
  const oldCount = match[2] !== undefined ? parseInt(match[2]) : 1;
  const newCount = match[4] !== undefined ? parseInt(match[4]) : 1;

  const maxOld = oldLine + oldCount;
  const maxNew = newLine + newCount;
  const w = Math.max(3, String(maxOld).length, String(maxNew).length);

  const rows = [`${"Old".padStart(w)} | ${"New".padStart(w)} |`];
  for (const line of hunkLines) {
    if (line.startsWith("\\")) continue;
    if (line.startsWith("+")) {
      rows.push(`${"".padStart(w)} | ${String(newLine).padStart(w)} | ${line}`);
      newLine++;
    } else if (line.startsWith("-")) {
      rows.push(`${String(oldLine).padStart(w)} | ${"".padStart(w)} | ${line}`);
      oldLine++;
    } else {
      rows.push(`${String(oldLine).padStart(w)} | ${String(newLine).padStart(w)} | ${line}`);
      oldLine++;
      newLine++;
    }
  }

  return rows.join("\n");
}

function pad(n, width) {
  return String(n).padStart(width, "0");
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node split_blocks.mjs <raw.diff> <output-dir>");
  process.exit(2);
}

const diffPath = resolve(args[0]);
const outputDir = resolve(args[1]);
const input = readFileSync(diffPath, "utf-8");
const blocks = parseRawDiff(input);

if (blocks.length === 0) {
  console.error("Error: No hunks found in diff.");
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

// Count unique files
const uniqueFiles = new Set(blocks.map((b) => b.filePath));

// Write block files and build index
const indexParts = [];

for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  const num = i + 1;
  const fileName = `block-${pad(num, 3)}.diff`;

  const content = [
    ...block.meta,
    block.hunkHeader,
    ...block.hunkLines,
  ].join("\n");

  writeFileSync(join(outputDir, fileName), content, "utf-8");

  const { adds, deletes } = countChanges(block.hunkLines);
  const annotated = annotateHunk(block.hunkHeader, block.hunkLines);
  indexParts.push(
    `## Block ${num} — ${block.filePath}  (+${adds} -${deletes})\n\n` +
    `\`\`\`\n` +
    `${annotated}\n` +
    `\`\`\``
  );
}

// Write index.md
const index = `# Diff Blocks

Total: ${blocks.length} blocks across ${uniqueFiles.size} files

Line numbers below are absolute file line numbers. Use the Old column for \`"side": "old"\` comments and the New column for \`"side": "new"\` comments.

${indexParts.join("\n\n")}
`;

writeFileSync(join(outputDir, "index.md"), index, "utf-8");

console.log(
  `Split into ${blocks.length} blocks across ${uniqueFiles.size} files → ${outputDir}`
);
