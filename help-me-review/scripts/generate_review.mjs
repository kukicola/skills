#!/usr/bin/env node

/**
 * generate_review.mjs
 *
 * Injects organized diff JSON into the static HTML template.
 *
 * Usage:
 *   node generate_review.mjs <input.json> [output.html]
 *   cat input.json | node generate_review.mjs > output.html
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, "../ui/dist/index.html");

const args = process.argv.slice(2);
const jsonInput = args[0]
  ? readFileSync(resolve(args[0]), "utf-8")
  : readFileSync(0, "utf-8");
const outputPath = args[1] || null;

const data = JSON.parse(jsonInput);
if (!data.sections || !Array.isArray(data.sections)) {
  console.error("Error: Input JSON must have a 'sections' array.");
  process.exit(1);
}

const template = readFileSync(TEMPLATE_PATH, "utf-8");
const html = template.replace(
  "window.__REVIEW_DATA__ = window.__REVIEW_DATA__ || null;",
  `window.__REVIEW_DATA__ = ${JSON.stringify(data)};`,
);

if (outputPath) {
  writeFileSync(resolve(outputPath), html, "utf-8");
  console.log(`Review page written to: ${resolve(outputPath)}`);
} else {
  process.stdout.write(html);
}
