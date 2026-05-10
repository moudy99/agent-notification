import { installClaude } from "./claude.js";
import { installOpenCode } from "./opencode.js";
import { checkboxPrompt, color, showIntro } from "./prompts.js";

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
    noAnimation: argv.includes("--no-animation")
  };
}

async function selectTargets(options) {
  if (options.all) return ["opencode", "claude"];

  const selected = [];
  if (options.opencode) selected.push("opencode");
  if (options.claude) selected.push("claude");
  if (selected.length > 0) return selected;

  return checkboxPrompt("Select agents to install notifications for:", [
    { label: "OpenCode", value: "opencode", checked: false },
    { label: "Claude Code", value: "claude", checked: false }
  ]);
}
