import { promises as fs } from "node:fs";
import { basename, dirname } from "node:path";
import { confirmPrompt, color } from "./prompts.js";

export async function ensureDirectory(path) {
  await fs.mkdir(path, { recursive: true });
}

export async function copyTemplateFile(source, destination, options = {}) {
  await ensureDirectory(dirname(destination));

  const exists = await pathExists(destination);
  if (exists && !options.yes) {
    const shouldOverwrite = await confirmPrompt(`${basename(destination)} already exists. Overwrite?`, false);
    if (!shouldOverwrite) {
      return { destination, action: "skipped" };
    }
  }

  try {
    await fs.copyFile(source, destination);
  } catch (error) {
    if (!options.fallbackContent) throw error;
    await fs.writeFile(destination, options.fallbackContent, "utf8");
    return { destination, action: exists ? "generated" : "created" };
  }

  return { destination, action: exists ? "updated" : "created" };
}

export async function readJsonFile(path) {
  const content = await fs.readFile(path, "utf8");
  return JSON.parse(content);
}

export async function writeJsonFile(path, value) {
  await ensureDirectory(dirname(path));
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function removeFileIfExists(path) {
  if (!(await pathExists(path))) return { destination: path, action: "missing" };
  await fs.rm(path, { force: true });
  return { destination: path, action: "removed" };
}

export async function backupFile(path) {
  if (!(await pathExists(path))) return null;
  const backupPath = `${path}.bak-${timestamp()}`;
  await fs.copyFile(path, backupPath);
  return backupPath;
}

export async function pathExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export function printCopyResult(label, result) {
  const mark = result.action === "skipped" ? color("yellow", "-") : color("green", "✓");
  console.log(`${mark} ${label} ${color("dim", result.action)}`);
}

export function printRemoveResult(label, result) {
  if (result.action === "missing") return;
  console.log(`${color("green", "✓")} ${label} ${color("dim", result.action)}`);
}

function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}
