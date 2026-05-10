import { join } from "node:path";
import {
  backupFile,
  copyTemplateFile,
  ensureDirectory,
  pathExists,
  printCopyResult,
  readJsonFile,
  writeJsonFile
} from "./installer.js";
import { paths, templatePath } from "./paths.js";
import { color } from "./prompts.js";

export async function installClaude(options = {}) {
  console.log(color("cyan", "\nInstalling Claude Code notification..."));

  await ensureDirectory(paths.claude.root);
  await ensureDirectory(paths.claude.hooks);

  const files = [
    {
      label: "Claude PowerShell toast",
      source: templatePath("claude", "notification.ps1"),
      destination: join(paths.claude.hooks, "notification.ps1")
    },
    {
      label: "Claude batch launcher",
      source: templatePath("claude", "notification.bat"),
      destination: join(paths.claude.hooks, "notification.bat")
    }
  ];

  for (const file of files) {
    const result = await copyTemplateFile(file.source, file.destination, options);
    printCopyResult(file.label, result);
  }

  await writeJsonFile(join(paths.claude.hooks, "notification-config.json"), {
    durationSeconds: options.durationSeconds ?? 5
  });
  console.log(`${color("green", "✓")} Claude notification duration ${color("dim", `${options.durationSeconds ?? 5}s`)}`);

  await mergeClaudeSettings();
  console.log(color("dim", "Restart Claude Code to activate hooks."));
}

async function mergeClaudeSettings() {
  const settingsPath = paths.claude.settings;
  const exists = await pathExists(settingsPath);
  const settings = exists ? await readJsonFile(settingsPath) : {};

  settings.hooks = isObject(settings.hooks) ? settings.hooks : {};
  removeLegacyWelcomeHooks(settings);
  ensureHook(settings, "Stop", "Response complete — notifying...");
  ensureHook(settings, "Notification", "Claude is waiting for input — notifying...");

  const backupPath = exists ? await backupFile(settingsPath) : null;
  await writeJsonFile(settingsPath, settings);

  if (backupPath) console.log(`${color("green", "✓")} Claude settings backup ${color("dim", backupPath)}`);
  console.log(`${color("green", "✓")} Claude settings updated`);
}

function ensureHook(settings, eventName, statusMessage) {
  const command = `& '${escapePowerShellSingleQuoted(paths.claude.notificationPs1)}'`;
  const hook = {
    type: "command",
    command,
    shell: "powershell",
    statusMessage,
    async: true
  };

  if (!Array.isArray(settings.hooks[eventName])) settings.hooks[eventName] = [];

  for (const group of settings.hooks[eventName]) {
    if (!isObject(group) || !Array.isArray(group.hooks)) continue;
    const existing = group.hooks.find((item) => isObject(item) && item.command === command);
    if (existing) {
      Object.assign(existing, hook);
      return;
    }
  }

  settings.hooks[eventName].push({ hooks: [hook] });
}

function removeLegacyWelcomeHooks(settings) {
  for (const eventName of ["Stop", "Notification"]) {
    if (!Array.isArray(settings.hooks[eventName])) continue;

    settings.hooks[eventName] = settings.hooks[eventName]
      .map((group) => {
        if (!isObject(group) || !Array.isArray(group.hooks)) return group;
        return {
          ...group,
          hooks: group.hooks.filter((hook) => !isLegacyWelcomeCommand(hook))
        };
      })
      .filter((group) => !isObject(group) || !Array.isArray(group.hooks) || group.hooks.length > 0);
  }
}

function isLegacyWelcomeCommand(hook) {
  if (!isObject(hook) || typeof hook.command !== "string") return false;
  const command = hook.command.toLowerCase().replaceAll("/", "\\");
  return command.includes("\\.claude\\hooks\\welcome.ps1");
}

function escapePowerShellSingleQuoted(value) {
  return value.replaceAll("'", "''");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
