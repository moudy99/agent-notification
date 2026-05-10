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

## Automatic npm Publish

This repository includes a GitHub Actions workflow that publishes to npm when you push to `main` with a new package version.

Add this GitHub repository secret first:

```text
NPM_TOKEN
```

Create the token in npm:

```text
npmjs.com → Access Tokens → Granular Access Token
```

Recommended token settings:

- Read and write access
- Package access for `@moudy99/agent-notification`
- Bypass 2FA enabled if your npm account requires it

Then publish a new version by pushing a version bump:

```bash
npm version patch --no-git-tag-version
git add .
git commit -m "Release v1.0.3"
git push
```

The workflow checks npm first. If that version already exists, it skips publishing instead of failing.

## Manual npm Publish

```bash
npm version patch
npm publish --access public
```
