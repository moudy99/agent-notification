import { join } from "node:path";
import {
  copyTemplateFile,
  ensureDirectory,
  printCopyResult,
  writeJsonFile
} from "./installer.js";
import { paths, templatePath } from "./paths.js";
import { color } from "./prompts.js";

const notificationVbs = `Set objShell = CreateObject("WScript.Shell")
objShell.Run "powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -Sta -WindowStyle Hidden -File """ & Replace(WScript.ScriptFullName, "notification.vbs", "notification.ps1") & """", 0, False
`;

export async function installOpenCode(options = {}) {
  console.log(color("cyan", "\nInstalling OpenCode notification..."));

  await ensureDirectory(paths.opencode.plugins);
  await ensureDirectory(paths.opencode.hooks);

  const files = [
    {
      label: "OpenCode PowerShell toast",
      source: templatePath("opencode", "notification.ps1"),
      destination: join(paths.opencode.hooks, "notification.ps1")
    },
    {
      label: "OpenCode hidden spawner",
      source: templatePath("opencode", "notification.vbs"),
      destination: join(paths.opencode.hooks, "notification.vbs")
    },
    {
      label: "OpenCode batch launcher",
      source: templatePath("opencode", "notification.bat"),
      destination: join(paths.opencode.hooks, "notification.bat")
    },
    {
      label: "OpenCode plugin",
      source: templatePath("opencode", "plan-complete-notify.js"),
      destination: join(paths.opencode.plugins, "plan-complete-notify.js")
    }
  ];

  for (const file of files) {
    const result = await copyTemplateFile(file.source, file.destination, {
      ...options,
      fallbackContent: file.destination.endsWith("notification.vbs") ? notificationVbs : undefined
    });
    printCopyResult(file.label, result);
  }

  await writeJsonFile(join(paths.opencode.hooks, "notification-config.json"), {
    durationSeconds: options.durationSeconds ?? 5
  });
  console.log(`${color("green", "✓")} OpenCode notification duration ${color("dim", `${options.durationSeconds ?? 5}s`)}`);

  console.log(color("dim", "Restart OpenCode to load the plugin."));
}
