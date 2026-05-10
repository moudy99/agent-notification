import readline from "node:readline";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m"
};

export function color(name, value) {
  return `${colors[name] ?? ""}${value}${colors.reset}`;
}

export async function showIntro(skipAnimation = false) {
  const text = "AGENT NOTIFICATION";
  process.stdout.write("\n");
  if (skipAnimation || !process.stdout.isTTY) {
    process.stdout.write(`${color("magenta", color("bold", text))}\n\n`);
    return;
  }
  for (let index = 1; index <= text.length; index += 1) {
    process.stdout.write(`\r${color("magenta", color("bold", text.slice(0, index)))}`);
    await delay(22);
  }
  process.stdout.write(`\n${color("dim", "Desktop notifications for coding agents")}\n\n`);
}

export async function checkboxPrompt(message, choices) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return choices.filter((choice) => choice.checked).map((choice) => choice.value);
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  let cursor = 0;
  const selected = new Set(
    choices.map((choice, index) => (choice.checked ? index : -1)).filter((index) => index >= 0)
  );

  return new Promise((resolve, reject) => {
    const render = (errorText = "") => {
      process.stdout.write("\x1b[?25l");
      process.stdout.write("\x1b[2J\x1b[0f");
      process.stdout.write(`${color("bold", message)}\n`);
      process.stdout.write(`${color("dim", "Use ↑/↓, space to toggle, enter to confirm")}\n\n`);
      choices.forEach((choice, index) => {
        const pointer = index === cursor ? color("cyan", "›") : " ";
        const mark = selected.has(index) ? color("green", "●") : "○";
        process.stdout.write(`${pointer} ${mark} ${choice.label}\n`);
      });
      if (errorText) process.stdout.write(`\n${color("yellow", errorText)}\n`);
    };

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.off("keypress", onKeypress);
      process.stdout.write("\x1b[?25h");
    };

    const onKeypress = (_value, key) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Installation cancelled."));
        return;
      }
      if (key.name === "up") cursor = (cursor - 1 + choices.length) % choices.length;
      if (key.name === "down") cursor = (cursor + 1) % choices.length;
      if (key.name === "space") {
        if (selected.has(cursor)) selected.delete(cursor);
        else selected.add(cursor);
      }
      if (key.name === "return") {
        if (selected.size === 0) {
          render("Select at least one agent.");
          return;
        }
        const values = choices
          .map((choice, index) => (selected.has(index) ? choice.value : null))
          .filter(Boolean);
        cleanup();
        process.stdout.write("\x1b[2J\x1b[0f");
        resolve(values);
        return;
      }
      render();
    };

    process.stdin.on("keypress", onKeypress);
    render();
  });
}

export async function confirmPrompt(message, defaultValue = false) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return defaultValue;

  const suffix = defaultValue ? "[Y/n]" : "[y/N]";
  const answer = await ask(`${message} ${suffix} `);
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return defaultValue;
  return normalized === "y" || normalized === "yes";
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
