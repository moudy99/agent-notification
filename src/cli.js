import { installClaude } from "./claude.js";
import { installOpenCode } from "./opencode.js";
import { checkboxPrompt, color, numberPrompt, showIntro } from "./prompts.js";

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (process.platform !== "win32") {
    throw new Error("Agent Notification currently supports Windows only.");
  }

  await showIntro(options.noAnimation);

  const selected = await selectTargets(options);
  if (selected.length === 0) {
    throw new Error("No agents selected.");
  }

  options.durationSeconds = await selectDuration(options);

  console.log(color("bold", "Installing selected notifications..."));

  if (selected.includes("opencode")) await installOpenCode(options);
  if (selected.includes("claude")) await installClaude(options);

  console.log(color("green", "\nAll selected notifications are installed."));
}

function parseArgs(argv) {
  return {
    opencode: argv.includes("--opencode"),
    claude: argv.includes("--claude"),
    all: argv.includes("--all"),
    yes: argv.includes("--yes") || argv.includes("-y"),
    noAnimation: argv.includes("--no-animation"),
    durationSeconds: parseDurationArg(argv)
  };
}

async function selectTargets(options) {
  if (options.all) return ["opencode", "claude"];

  const selected = [];
  if (options.opencode) selected.push("opencode");
  if (options.claude) selected.push("claude");
  if (selected.length > 0) return selected;

  return checkboxPrompt("Select agents to install notifications for:", [
    {
      label: "OpenCode",
      value: "opencode",
      checked: false,
      description: "Response complete, plan questions, and permission prompts"
    },
    {
      label: "Claude Code",
      value: "claude",
      checked: false,
      description: "Stop and Notification hooks for main-agent responses"
    }
  ]);
}

async function selectDuration(options) {
  if (options.durationSeconds) return options.durationSeconds;
  return numberPrompt("Notification display time", 5, {
    min: 0
  });
}

function parseDurationArg(argv) {
  const durationEquals = argv.find((value) => value.startsWith("--duration="));
  const durationIndex = argv.indexOf("--duration");
  if (!durationEquals && durationIndex === -1) return null;

  const raw = durationEquals ? durationEquals.slice("--duration=".length) : argv[durationIndex + 1];
  if (!raw) throw new Error("--duration requires a positive number of seconds.");

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--duration must be a positive number of seconds.");
  }
  return parsed;
}
