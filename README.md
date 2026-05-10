# Agent Notification

Windows desktop notifications for Claude Code and OpenCode.

The installer copies local hook files into the current user's config folders and configures the selected agent integrations. It does not call any remote service at runtime.

## Usage

From GitHub:

```bash
npx github:moudy99/agent-notification
```

After publishing to npm:

```bash
npx @moudy99/agent-notification
```

The CLI lets you select one or both integrations:

- OpenCode
- Claude Code

## What Gets Installed

OpenCode:

```text
~/.config/opencode/plugins/plan-complete-notify.js
~/.config/opencode/hooks/welcome.ps1
~/.config/opencode/hooks/welcome.bat
~/.config/opencode/hooks/welcome.vbs
```

Claude Code:

```text
~/.claude/hooks/welcome.ps1
~/.claude/hooks/welcome.bat
~/.claude/settings.json
```

## Behavior

OpenCode notifications fire when:

- The agent completes a response.
- The agent asks a question, including plan-mode questions.
- The agent needs permission to continue.

Claude Code notifications fire when:

- The main agent completes a response.
- Claude Code is waiting for user input or permission.

Subagent completion notifications are not installed.

## Safety

- Windows-only.
- Uses PowerShell WPF notifications.
- Writes only to user-level config folders.
- Backs up `~/.claude/settings.json` before modifying it.
- Prompts before overwriting existing hook files.
- No runtime network calls.

## Requirements

- Windows
- Node.js 18+
- PowerShell
