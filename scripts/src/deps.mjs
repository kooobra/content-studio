// Finds the engine's dependencies. Installed plugins must not write into their own folder (it is replaced on every
// update), so setup.sh installs playwright-core and the Python venv into a deps folder, in this order:
//   1. CONTENT_STUDIO_DEPS (the plugin's ${CLAUDE_PLUGIN_DATA}; the skill exports it)
//   2. ~/.claude/plugins/data/content-studio*/ (an installed plugin's data folder)
//   3. the engine's own scripts/ folder (a checkout used directly, e.g. while developing)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirs = () => {
  const base = path.join(os.homedir(), ".claude/plugins/data");
  return fs.existsSync(base) ? fs.readdirSync(base).filter(d => d.startsWith("content-studio")).map(d => path.join(base, d)) : [];
};
const candidates = [process.env.CONTENT_STUDIO_DEPS, ...dataDirs(), SCRIPTS].filter(Boolean).map(d => path.resolve(d));
export const DEPS = candidates.find(d => fs.existsSync(path.join(d, "node_modules/playwright-core")));
if (!DEPS) throw new Error(`playwright-core not found. Run setup first: bash <plugin>/scripts/setup.sh <deps folder> (looked in: ${candidates.join(", ")})`);
// python with Pillow for review.py / snapsheet.py
export const PYTHON = [path.join(DEPS, ".venv/bin/python"), path.join(SCRIPTS, "../.venv/bin/python")].find(p => fs.existsSync(p)) || "python3";

const req = createRequire(path.join(DEPS, "package.json"));
const pw = await import(pathToFileURL(req.resolve("playwright-core")).href);
export const chromium = pw.chromium ?? pw.default.chromium; // CommonJS package: named export may sit on default
