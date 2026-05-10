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

const notificationBanner = buildStackedBanner(["AGENT", "NOTIFICATION"]);

export function color(name, value) {
  return `${colors[name] ?? ""}${value}${colors.reset}`;
}

export async function showIntro(skipAnimation = false) {
  if (skipAnimation || !process.stdout.isTTY) {
    clearTerminal(true);
    writeCenteredBanner(notificationBanner);
    return;
  }

  const width = Math.max(...notificationBanner.map((line) => line.length));
  for (let column = 1; column <= width; column += 2) {
    clearTerminal(true);
    writeCenteredBanner(notificationBanner.map((line) => line.slice(0, column)));
    await delay(18);
  }

  clearTerminal(true);
  writeCenteredBanner(notificationBanner);
  await delay(180);
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
      clearTerminal();
      writeCenteredBanner(notificationBanner, 1);
      writeCentered(color("dim", "Desktop notifications for coding agents"));
      process.stdout.write("\n");
      writeCentered(color("bold", message));
      writeCentered(color("dim", "SPACE toggle    ENTER install    CTRL+C cancel"));
      process.stdout.write("\n");
      choices.forEach((choice, index) => {
        writeChoiceCard(choice, {
          focused: index === cursor,
          selected: selected.has(index)
        });
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
        clearTerminal(true);
        resolve(values);
        return;
      }
      if (shouldRender) render();
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

function buildBanner(text) {
  const letters = {
    A: [" ### ", "#   #", "#####", "#   #", "#   #"],
    C: [" ####", "#    ", "#    ", "#    ", " ####"],
    E: ["#####", "#    ", "#### ", "#    ", "#####"],
    F: ["#####", "#    ", "#### ", "#    ", "#    "],
    G: [" ####", "#    ", "#  ##", "#   #", " ####"],
    I: ["#####", "  #  ", "  #  ", "  #  ", "#####"],
    N: ["#   #", "##  #", "# # #", "#  ##", "#   #"],
    O: [" ### ", "#   #", "#   #", "#   #", " ### "],
    T: ["#####", "  #  ", "  #  ", "  #  ", "  #  "]
  };

  const rows = ["", "", "", "", ""];
  for (const character of text) {
    const pattern = character === " " ? ["     ", "     ", "     ", "     ", "     "] : letters[character] ?? ["     ", "     ", "     ", "     ", "     "];
    pattern.forEach((line, index) => {
      rows[index] += `${line} `;
    });
  }
  return rows.map((line) => line.trimEnd());
}

function buildStackedBanner(lines) {
  return lines.flatMap((line, index) => {
    const banner = buildBanner(line);
    return index === 0 ? [...banner, ""] : banner;
  });
}

function writeCenteredBanner(lines, topPadding = getTopPadding(lines.length + 8)) {
  process.stdout.write("\n".repeat(topPadding));
  lines.forEach((line) => {
    if (!line) process.stdout.write("\n");
    else writeCentered(color("magenta", color("bold", line)));
  });
  process.stdout.write("\n");
}

function writeChoiceCard(choice, state) {
  const width = Math.min(Math.max(64, terminalColumns() - 14), 86);
  const indent = " ".repeat(Math.max(0, Math.floor((terminalColumns() - width) / 2)));
  const top = `${state.focused ? ">" : " "} ${state.selected ? "[x]" : "[ ]"}  ${choice.label.toUpperCase()}`;
  const description = choice.description ?? "";
  const border = `${indent}+${"-".repeat(width - 2)}+`;
  const labelColor = state.focused ? "cyan" : state.selected ? "green" : "white";
  process.stdout.write(`${border}\n`);
  process.stdout.write(`${indent}| ${padRight(color(labelColor, color("bold", top)), width - 4)} |\n`);
  process.stdout.write(`${indent}| ${padRight(color("dim", description), width - 4)} |\n`);
  process.stdout.write(`${border}\n\n`);
}

function writeCentered(value) {
  const plain = stripAnsi(value);
  const padding = Math.max(0, Math.floor((terminalColumns() - plain.length) / 2));
  process.stdout.write(`${" ".repeat(padding)}${value}\n`);
}

function clearTerminal(clearScrollback = false) {
  if (!process.stdout.isTTY) return;
  if (clearScrollback) process.stdout.write("\x1b[3J");
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

function getTopPadding(contentHeight) {
  const rows = process.stdout.rows || 28;
  return Math.max(1, Math.floor((rows - contentHeight) / 3));
}

function terminalColumns() {
  return process.stdout.columns || 90;
}

function padRight(value, width) {
  const plainLength = stripAnsi(value).length;
  return `${value}${" ".repeat(Math.max(0, width - plainLength))}`;
}

function stripAnsi(value) {
  return String(value).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
}
