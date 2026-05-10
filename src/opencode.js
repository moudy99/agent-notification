import { join } from "node:path";
import { copyTemplateFile, ensureDirectory, printCopyResult } from "./installer.js";
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
      source: templatePath("opencode", "welcome.ps1"),
      destination: join(paths.opencode.hooks, "welcome.ps1")
    },
    {
      label: "OpenCode batch launcher",
      source: templatePath("opencode", "welcome.bat"),
      destination: join(paths.opencode.hooks, "welcome.bat")
    },
    {
      label: "OpenCode hidden spawner",
      source: templatePath("opencode", "welcome.vbs"),
      destination: join(paths.opencode.hooks, "welcome.vbs")
    }
  ];

  for (const file of files) {
    const result = await copyTemplateFile(file.source, file.destination, options);
    printCopyResult(file.label, result);
  }

  console.log(color("dim", "Restart OpenCode to load the plugin."));
}
