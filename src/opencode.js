import { join } from "node:path";
import {
  copyTemplateFile,
  ensureDirectory,
  printCopyResult,
  printRemoveResult,
  removeFileIfExists,
  writeJsonFile
} from "./installer.js";
import { paths, templatePath } from "./paths.js";
import { color } from "./prompts.js";

export async function installOpenCode(options = {}) {
  console.log(color("cyan", "\nInstalling OpenCode notification..."));

  await ensureDirectory(paths.opencode.plugins);
  await ensureDirectory(paths.opencode.hooks);

  const files = [
    {
      label: "OpenCode plugin",
      source: templatePath("opencode", "plan-complete-notify.js"),
      destination: join(paths.opencode.plugins, "plan-complete-notify.js")
    },
    {
      label: "OpenCode PowerShell toast",
      source: templatePath("opencode", "notification.ps1"),
      destination: join(paths.opencode.hooks, "notification.ps1")
    }
  ];

  for (const file of files) {
    const result = await copyTemplateFile(file.source, file.destination, options);
    printCopyResult(file.label, result);
  }

  await writeJsonFile(join(paths.opencode.hooks, "notification-config.json"), {
    durationSeconds: options.durationSeconds ?? 5
  });
  console.log(`${color("green", "✓")} OpenCode notification duration ${color("dim", `${options.durationSeconds ?? 5}s`)}`);

  const obsoleteFiles = ["notification.bat", "notification.vbs"];
  for (const obsoleteFile of obsoleteFiles) {
    const result = await removeFileIfExists(join(paths.opencode.hooks, obsoleteFile));
    printRemoveResult(`OpenCode obsolete ${obsoleteFile}`, result);
  }

  console.log(color("dim", "Restart OpenCode to load the plugin."));
}
