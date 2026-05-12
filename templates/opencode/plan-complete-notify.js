import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const NOTIFY_FILE = join(tmpdir(), "opencode-notify.json");
const NOTIFICATION_PS1 = join(homedir(), ".config", "opencode", "hooks", "notification.ps1");

export const AgentNotification = async () => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        notify({ type: "idle" });
        return;
      }

      if (event.type === "question.asked") {
        const questions = event.properties?.questions || [];
        const body = questions[0]?.header || questions[0]?.question || "OpenCode is waiting for your input";
        notify({ type: "question", body });
        return;
      }

      if (event.type === "permission.asked") {
        notify({ type: "permission" });
      }
    }
  };
};

function notify(payload) {
  try {
    writeFileSync(NOTIFY_FILE, JSON.stringify(payload), "utf8");
    const child = spawn("powershell.exe", [
      "-ExecutionPolicy",
      "Bypass",
      "-NoProfile",
      "-NonInteractive",
      "-Sta",
      "-WindowStyle",
      "Hidden",
      "-File",
      NOTIFICATION_PS1
    ], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    child.unref();
  } catch {}
}
