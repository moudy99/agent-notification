# Agent Notification

[![npm version](https://img.shields.io/npm/v/@moudy99/agent-notification.svg)](https://www.npmjs.com/package/@moudy99/agent-notification)
[![npm downloads](https://img.shields.io/npm/dm/@moudy99/agent-notification.svg)](https://www.npmjs.com/package/@moudy99/agent-notification)
[![GitHub repo](https://img.shields.io/badge/GitHub-moudy99%2Fagent--notification-181717?logo=github)](https://github.com/moudy99/agent-notification)

Beautiful Windows toast notifications for **OpenCode** and **Claude Code**.
<img width="1920" height="1080" alt="openCode" src="https://github.com/user-attachments/assets/5c761c27-e9bc-4105-b6c6-5135032804a2" />
<img width="1920" height="1080" alt="agent notification" src="https://github.com/user-attachments/assets/65693910-e135-4f26-8cf3-d5c6e20e4688" />


Run one command, choose the agents you use, and the installer adds the local notification hooks for you.

- npm: [`@moudy99/agent-notification`](https://www.npmjs.com/package/@moudy99/agent-notification)
- GitHub: [`moudy99/agent-notification`](https://github.com/moudy99/agent-notification)

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
<img width="1920" height="1080" alt="agetn-notification-install" src="https://github.com/user-attachments/assets/bd742fb0-b0a5-46db-81e8-24e3c13602f2" />


You can select **OpenCode**, **Claude Code**, or both.

After selecting agents, enter how many seconds each notification should stay visible.

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

Set the notification duration directly:

```bash
npx @moudy99/agent-notification --all --duration=10
```

## What It Installs

### OpenCode

```text
~/.config/opencode/plugins/plan-complete-notify.js
~/.config/opencode/hooks/notification.ps1
~/.config/opencode/hooks/notification-config.json
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
~/.claude/hooks/notification-config.json
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
- Stores only the notification display duration in `notification-config.json`.

## Version

Current package version: `1.0.10`

