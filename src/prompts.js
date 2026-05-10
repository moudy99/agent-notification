import readline from "node:readline";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
  white: "\x1b[37m"
};

const title = "AGENT NOTIFICATION";
const subtitle = "Desktop notifications for coding agents";

export function color(name, value) {
  return `${colors[name] ?? ""}${value}${colors.reset}`;
}

export async function showIntro(skipAnimation = false) {
  clearTerminal(true);

  if (skipAnimation || !process.stdout.isTTY) {
    writeLogo(title);
    return;
  }

  for (let index = 1; index <= title.length; index += 1) {
    clearTerminal();
    writeLogo(title.slice(0, index).padEnd(title.length, " "));
    await delay(28);
  }

  clearTerminal();
  writeLogo(title);
  await delay(180);
}

export async function checkboxPrompt(message, choices) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return choices.filter((choice) => choice.checked).map((choice) => choice.value);
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  let cursor = 0;
  let renderedLines = 0;
  const selected = new Set(
    choices.map((choice, index) => (choice.checked ? index : -1)).filter((index) => index >= 0)
  );

  return new Promise((resolve, reject) => {
    const render = (errorText = "") => {
      process.stdout.write("\x1b[?25l");
      if (renderedLines > 0) {
        readline.moveCursor(process.stdout, 0, -renderedLines);
        readline.clearScreenDown(process.stdout);
      }

      const lines = buildSelectionLines(message, choices, selected, cursor, errorText);
      process.stdout.write(`${lines.join("\n")}\n`);
      renderedLines = lines.length;
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

      let shouldRender = false;
      if (key.name === "up") {
        cursor = (cursor - 1 + choices.length) % choices.length;
        shouldRender = true;
      }
      if (key.name === "down") {
        cursor = (cursor + 1) % choices.length;
        shouldRender = true;
      }
      if (key.name === "space") {
        if (selected.has(cursor)) selected.delete(cursor);
        else selected.add(cursor);
        shouldRender = true;
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
        process.stdout.write("\n");
        resolve(values);
        return;
      }

      if (shouldRender) render();
    };

    process.stdin.on("keypress", onKeypress);
    render();
  });
}

export async function numberPrompt(message, defaultValue, options = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return defaultValue;

  const min = options.min ?? 1;
  const max = options.max ?? 60;

  while (true) {
    const answer = await ask(`${message} (${min}-${max}, default ${defaultValue}): `);
    const value = answer.trim();
    if (!value) return defaultValue;

    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= min && parsed <= max) {
      return parsed;
    }

    console.log(color("yellow", `Enter a whole number from ${min} to ${max}.`));
  }
}

export async function confirmPrompt(message, defaultValue = false) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return defaultValue;

  const suffix = defaultValue ? "[Y/n]" : "[y/N]";
  const answer = await ask(`${message} ${suffix} `);
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return defaultValue;
  return normalized === "y" || normalized === "yes";
}

function buildSelectionLines(message, choices, selected, cursor, errorText) {
  const lines = [
    "",
    center(color("bold", message)),
    center(color("dim", "UP/DOWN move    SPACE select    ENTER continue    CTRL+C cancel")),
    ""
  ];

  for (const [index, choice] of choices.entries()) {
    lines.push(...buildChoiceCard(choice, {
      focused: index === cursor,
      selected: selected.has(index)
    }));
  }

  if (errorText) {
    lines.push(center(color("yellow", errorText)));
  }

  return lines;
}

function buildChoiceCard(choice, state) {
  const width = Math.min(Math.max(64, terminalColumns() - 14), 86);
  const indent = " ".repeat(Math.max(0, Math.floor((terminalColumns() - width) / 2)));
  const border = `${indent}+${"-".repeat(width - 2)}+`;
  const pointer = state.focused ? ">" : " ";
  const mark = state.selected ? "[x]" : "[ ]";
  const labelColor = state.focused ? "cyan" : state.selected ? "green" : "white";
  const titleLine = `${pointer} ${mark}  ${choice.label}`;
  const description = choice.description ?? "";

  return [
    border,
    `${indent}| ${padRight(color(labelColor, color("bold", titleLine)), width - 4)} |`,
    `${indent}| ${padRight(color("dim", description), width - 4)} |`,
    border,
    ""
  ];
}

function writeLogo(value) {
  const width = Math.min(Math.max(46, title.length + 14), terminalColumns() - 4);
  const border = `+${"-".repeat(width - 2)}+`;
  const empty = `|${" ".repeat(width - 2)}|`;
  const titleLine = `|${padCenter(color("bold", value), width - 2)}|`;
  const subtitleLine = `|${padCenter(color("dim", subtitle), width - 2)}|`;

  process.stdout.write("\n".repeat(getTopPadding(7)));
  writeCentered(color("magenta", border));
  writeCentered(color("magenta", empty));
  writeCentered(color("magenta", titleLine));
  writeCentered(color("magenta", subtitleLine));
  writeCentered(color("magenta", empty));
  writeCentered(color("magenta", border));
  process.stdout.write("\n");
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

function writeCentered(value) {
  process.stdout.write(`${center(value)}\n`);
}

function center(value) {
  const plain = stripAnsi(value);
  const padding = Math.max(0, Math.floor((terminalColumns() - plain.length) / 2));
  return `${" ".repeat(padding)}${value}`;
}

function clearTerminal(clearScrollback = false) {
  if (!process.stdout.isTTY) return;
  if (clearScrollback) process.stdout.write("\x1b[3J");
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

function getTopPadding(contentHeight) {
  const rows = process.stdout.rows || 28;
  return Math.max(1, Math.floor((rows - contentHeight) / 4));
}

function terminalColumns() {
  return process.stdout.columns || 90;
}

function padCenter(value, width) {
  const plainLength = stripAnsi(value).length;
  const total = Math.max(0, width - plainLength);
  const left = Math.floor(total / 2);
  const right = total - left;
  return `${" ".repeat(left)}${value}${" ".repeat(right)}`;
}

function padRight(value, width) {
  const plainLength = stripAnsi(value).length;
  return `${value}${" ".repeat(Math.max(0, width - plainLength))}`;
}

function stripAnsi(value) {
  return String(value).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
}
