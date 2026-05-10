# Agent Notification

Beautiful Windows toast notifications for **OpenCode** and **Claude Code**.

Run one command, choose the agents you use, and the installer adds the local notification hooks for you.

## Install And Run

```bash
npx @moudy99/agent-notification
```

The CLI opens an interactive installer:

```text
AGENT NOTIFICATION

Select agents to install notifications for:

[ ] OpenCode
[ ] Claude Code
```

Use:

```text
SPACE  toggle
ENTER  install
CTRL+C cancel
```

You can select **OpenCode**, **Claude Code**, or both.

## Direct Commands

Install both without the selector:

```bash
npx @moudy99/agent-notification --all
```

Install only OpenCode:

```bash
npx @moudy99/agent-notification --opencode
```

Install only Claude Code:

```bash
npx @moudy99/agent-notification --claude
```

Overwrite existing files without asking:

```bash
npx @moudy99/agent-notification --all --yes
```

## What It Installs

### OpenCode

```text
~/.config/opencode/plugins/plan-complete-notify.js
~/.config/opencode/hooks/notification.ps1
~/.config/opencode/hooks/notification.bat
~/.config/opencode/hooks/notification.vbs
```

Notifications fire when:

- OpenCode completes a response.
- OpenCode asks a plan-mode question.
- OpenCode needs permission to continue.

Restart OpenCode after installing.

### Claude Code

```text
~/.claude/hooks/notification.ps1
~/.claude/hooks/notification.bat
~/.claude/settings.json
```

The installer adds these hook events:

- `Stop`
- `Notification`

It does **not** add `SubagentStop`, so subagent completions do not trigger premature notifications.

Restart Claude Code after installing.

## Safety

- Windows-only.
- Uses local PowerShell WPF toast windows.
- No runtime network calls.
- Writes only to your user config folders.
- Asks before overwriting existing hook files.
- Backs up `~/.claude/settings.json` before editing.
- Removes old package-installed `welcome.ps1` Claude hook entries to avoid duplicate notifications.

## Requirements

- Windows
- Node.js 18+
- PowerShell

## Publish A New Version

```bash
npm version patch
npm publish --access public
```
