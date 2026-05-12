import { spawnSync } from "node:child_process";

export function isAdministrator() {
  const result = spawnSync("net", ["session"], {
    stdio: "ignore",
    windowsHide: true
  });
  return result.status === 0;
}

export function relaunchAsAdministrator(argv) {
  const scriptPath = process.argv[1];
  const args = [scriptPath, ...argv.filter((arg) => arg !== "--elevated"), "--elevated"];
  const argumentList = args.map(quoteWindowsArgument).join(" ");
  const command = [
    "Start-Process",
    "-FilePath",
    powerShellQuote(process.execPath),
    "-ArgumentList",
    powerShellQuote(argumentList),
    "-WorkingDirectory",
    powerShellQuote(process.cwd()),
    "-Verb",
    "RunAs"
  ].join(" ");

  const result = spawnSync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    command
  ], {
    stdio: "inherit",
    windowsHide: false
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error("Administrator permission was not granted.");
  }
}

function powerShellQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function quoteWindowsArgument(value) {
  const text = String(value);
  let result = '"';
  let backslashes = 0;

  for (const character of text) {
    if (character === "\\") {
      backslashes += 1;
      continue;
    }

    if (character === '"') {
      result += "\\".repeat(backslashes * 2 + 1);
      result += '"';
      backslashes = 0;
      continue;
    }

    result += "\\".repeat(backslashes);
    result += character;
    backslashes = 0;
  }

  result += "\\".repeat(backslashes * 2);
  result += '"';
  return result;
}
