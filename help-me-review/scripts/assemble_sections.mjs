#!/usr/bin/env node

/**
 * assemble_sections.mjs
 *
 * Builds sections.json from a manifest.json and block files.
 *
 * Usage:
 *   node assemble_sections.mjs <manifest.json> <blocks-dir> [output.json]
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, join, extname } from "path";

function detectLanguage(filePath) {
  const ext = extname(filePath).replace(/^\./, "").toLowerCase();
  return ext || "";
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: node assemble_sections.mjs <manifest.json> <blocks-dir> [output.json]"
  );
  process.exit(2);
}

const manifestPath = resolve(args[0]);
const blocksDir = resolve(args[1]);
const outputPath = args[2] ? resolve(args[2]) : null;

// Read manifest
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
} catch (err) {
  console.error(`Error reading manifest: ${err.message}`);
  process.exit(2);
}

// Support both object { title, base, head, sections: [...] } and plain array [...]
const manifestTitle = manifest.title || "";
const manifestBase = manifest.base || "";
const manifestHead = manifest.head || "";
const manifestSections = Array.isArray(manifest) ? manifest : manifest.sections;

if (!Array.isArray(manifestSections)) {
  console.error("Error: manifest.json must be a JSON array or an object with a 'sections' array.");
  process.exit(2);
}

// Discover available blocks
const blockFiles = readdirSync(blocksDir)
  .filter((f) => /^block-\d+\.diff$/.test(f))
  .sort();

const totalBlocks = blockFiles.length;

// Track which blocks are referenced
const referencedBlocks = new Set();

// Build sections
const sections = [];

for (let i = 0; i < manifestSections.length; i++) {
  const entry = manifestSections[i];
  const title = entry.title || `Section ${i + 1}`;
  const description = entry.description || "";
  const blockNums = entry.blocks || [];

  // Map: filePath → { path, language, patches[] }
  const fileMap = new Map();

  for (const num of blockNums) {
    if (referencedBlocks.has(num)) {
      console.error(`Warning: Block ${num} referenced more than once.`);
    }
    referencedBlocks.add(num);

    const fileName = `block-${String(num).padStart(3, "0")}.diff`;
    let content;
    try {
      content = readFileSync(join(blocksDir, fileName), "utf-8");
    } catch {
      console.error(`Error: Block file ${fileName} not found.`);
      process.exit(1);
    }

    const diffMatch = content.match(/^diff --git a\/(.+) b\/(.+)$/m);
    if (!diffMatch) {
      console.error(`Warning: Block ${num} (${fileName}) has no diff header.`);
      continue;
    }

    const filePath = diffMatch[2];
    if (!fileMap.has(filePath)) {
      fileMap.set(filePath, {
        path: filePath,
        language: detectLanguage(filePath),
        patches: [],
      });
    }
    fileMap.get(filePath).patches.push(content);
  }

  sections.push({
    title,
    description,
    priority: i + 1,
    comments: entry.comments || [],
    files: [...fileMap.values()],
  });
}

// Check for unreferenced blocks
const missingBlocks = [];
for (let i = 1; i <= totalBlocks; i++) {
  if (!referencedBlocks.has(i)) {
    missingBlocks.push(i);
  }
}

if (missingBlocks.length > 0) {
  console.error(
    `Error: ${missingBlocks.length} blocks not referenced in manifest: ${missingBlocks.join(", ")}`
  );
  process.exit(1);
}

const data = {
  title: manifestTitle,
  base_ref: manifestBase,
  head_ref: manifestHead,
  sections,
};

const json = JSON.stringify(data, null, 2);

if (outputPath) {
  writeFileSync(outputPath, json, "utf-8");
  console.log(
    `Assembled ${sections.length} sections, ${sections.reduce((a, s) => a + s.files.length, 0)} files → ${outputPath}`
  );
} else {
  process.stdout.write(json);
}
