import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(sourceDir, "..");
const home = homedir();

export const paths = {
  home,
  packageRoot,
  templates: join(packageRoot, "templates"),
  claude: {
    root: join(home, ".claude"),
    hooks: join(home, ".claude", "hooks"),
    settings: join(home, ".claude", "settings.json"),
    notificationPs1: join(home, ".claude", "hooks", "notification.ps1"),
    notificationBat: join(home, ".claude", "hooks", "notification.bat")
  },
  opencode: {
    root: join(home, ".config", "opencode"),
    hooks: join(home, ".config", "opencode", "hooks"),
    plugins: join(home, ".config", "opencode", "plugins")
  }
};

export function templatePath(...parts) {
  return join(paths.templates, ...parts);
}
