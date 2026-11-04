# dotai

Shared instructions, skills, and commands for Codex, Claude Code, and OpenCode.
Keep reusable AI workflows in one place and link each app to them. Machine-specific
settings, credentials, sessions, caches, and Codex's built-in skills stay local.

## Layout

```text
AGENTS.md                     Shared agent instructions
skills/                       Reusable skills and their supporting files
commands/                     Explicit commands and custom prompt templates
skills-lock.json              Project-local upstream sources and content hashes
.github/workflows/            Scheduled skill updates
package.json                  Pinned Skills CLI and npm shortcuts
```

The repository includes relative symlinks for a home-directory worktree. You can
also keep the checkout in a separate directory and link it into your home directory
as shown below.

## Set up another machine

Requires macOS or Linux with symlink support, Git, and Node.js 22.20 or later.
The workflow uses Node.js 24. Install the AI apps separately. Commands that inspect
or create GitHub pull requests also need the [GitHub CLI](https://cli.github.com/)
and `gh auth login`.

Clone the repository and install its CLI dependency:

```bash
git clone https://github.com/rmolinamir/dotai.git "$HOME/dotai"
npm --prefix "$HOME/dotai" ci
```

Review `AGENTS.md` and the skills before using them. If a destination below already
exists, merge or move its contents aside first. The helper refuses to replace it.
Run the following in Bash or Zsh:

```bash
(
  set -e
  DOTAI="$HOME/dotai"

  link() {
    if [ -e "$2" ] || [ -L "$2" ]; then
      printf 'Destination already exists: %s\n' "$2" >&2
      return 1
    fi
    ln -s "$1" "$2"
  }

  mkdir -p "$HOME/.agents" "$HOME/.claude" "$HOME/.codex/skills" \
    "$HOME/.config/opencode"

  link "$DOTAI/skills" "$HOME/skills"
  link "$DOTAI/commands" "$HOME/commands"

  link "$DOTAI/skills" "$HOME/.agents/skills"

  link "$DOTAI/AGENTS.md" "$HOME/.claude/CLAUDE.md"
  link "$DOTAI/skills" "$HOME/.claude/skills"
  link "$DOTAI/commands" "$HOME/.claude/commands"

  link "$DOTAI/AGENTS.md" "$HOME/.codex/AGENTS.md"
  link "$DOTAI/commands" "$HOME/.codex/prompts"
  for skill in "$DOTAI"/skills/*; do
    link "$skill" "$HOME/.codex/skills/$(basename "$skill")"
  done

  link "$DOTAI/AGENTS.md" "$HOME/.config/opencode/AGENTS.md"
  link "$DOTAI/skills" "$HOME/.config/opencode/skills"
  link "$DOTAI/commands" "$HOME/.config/opencode/commands"
)
```

These links expose the shared files to each app. Maintain skills from the dotai
checkout with the project-local commands below; no home-directory CLI state or
`HOME` override is needed.

Restart the apps after changing instructions, skills, or commands. To get later
updates, pull the checkout. Existing directory links expose the updated contents.

## Shared instructions

`AGENTS.md` asks agents to speak in plain English, explain code through short
examples, and keep responses proportionate to the task. It points to the
`asd-ste100` skill for reports and substantial explanations, using its clarity
principles without requiring a rigid technical-writing style.

It also asks agents to bind development servers to a network interface, choose a
random available port for each start, and share a clickable host-IP URL in chat.
Agents must check the server locally and explain any limits on access from other
devices.

The same file is exposed as Codex's `AGENTS.md`, Claude Code's `CLAUDE.md`, and
OpenCode's `AGENTS.md`.

## Manage skills

Run these from the checkout:

```bash
npm run skills:list
npm run skills:update
npm run skills:add -- owner/repository --skill skill-name
```

The commands operate only inside this checkout. `.agents/skills` points to
`skills/`; Codex and OpenCode discover that canonical directory, and Claude's
skills directory points to the same files. Existing home-directory links can
still expose these skills globally without making the install commands global.

`npm run skills:restore` reinstalls tracked upstream skills from their sources.
The CLI's project lockfile records source paths and content hashes; it is not an
immutable Git revision pin. Restoring/updating may fetch newer upstream content,
so review the resulting skill and lockfile diff before committing.

| Skill | Source |
| --- | --- |
| `find-skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills) |
| `asd-ste100` | [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill) |
| `codebase-design`, `grill-me`, `grilling`, `tdd` | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `homelab-navigate`, `homelab-operate`, `homelab-add-repository` | Authored here for [atomly/homelab](https://github.com/atomly/homelab) |
| `gitops-knowledge`, `gitops-repo-audit`, `gitops-cluster-debug` | Official [Flux project skills](https://github.com/fluxcd/agent-skills) |

The homelab repository installs the three homelab skills from this repository and
tracks them in its own `skills-lock.json`. Make shared homelab skill changes here,
then update homelab's installed copies through the Skills CLI.

The Flux skills require Flux 2.10+; schema validation additionally needs
`flux-schema`, and live debugging needs `flux-operator-mcp` 0.60+. Installing the
skills does not install those executables or configure an MCP server. It also does
not authorize replacing the homelab's existing bootstrap installation with Flux
Operator. Upstream license text is in `licenses/fluxcd-agent-skills.txt`.

No official ARC skill was found in GitHub's Actions Runner Controller repository
or GitHub-owned skill search on 2026-11-04. Do not label a community ARC skill as
official. Use [GitHub's ARC documentation](https://docs.github.com/en/actions/concepts/runners/actions-runner-controller)
and the local homelab operating skill until an official skill is available.

Commit skill changes together with `skills-lock.json`. The old
`.agents/.skill-lock.json` is retained only for compatibility with existing home
links; it is a frozen legacy index and is no longer used by repository maintenance.
Its six existing entries were migrated using their installed contents, without
updating those skill files. Authored skills do not list this repository as their
own upstream in the project lockfile.

The CLI remains pinned to version 1.7.4 in `package-lock.json`. In that release,
`skills check` is an alias for the updater, not a read-only check.

## Commands and prompts

`commands/` is shared through Claude Code's and OpenCode's command directories,
and Codex's custom prompts directory. Tool-specific argument handling and
frontmatter can differ, so check compatibility when adding a command.

| Template | Purpose |
| --- | --- |
| `gh-pr` | Create a pull request from the current changes and return its URL |
| `pr-walkthrough` | Explain a PR with code examples, test coverage, and check results |

For example:

```text
# Claude Code / OpenCode
/pr-walkthrough 123 focus on authentication

# Codex custom prompts
/prompts:pr-walkthrough 123 focus on authentication
```

Codex does not load a `~/.codex/commands` directory. Its custom prompts are the
older mechanism; use skills for new portable workflows when appropriate.

## Automatic skill updates

The **Update skills** workflow runs every Monday at 08:17 UTC and can also be
started manually from GitHub Actions. It reads the tracked project lockfile and
opens or updates a PR on `automation/update-skills` when skills change.

The PR includes `skills/` and `skills-lock.json`. Review upstream changes
before merging. Codex-managed `.system` skills are outside this process.

For a fork, enable **Settings → Actions → General → Workflow permissions → Allow
GitHub Actions to create and approve pull requests**. The workflow must be on the
default branch for scheduled runs. GitHub may disable scheduled workflows in
public repositories after 60 days without repository activity.

## What stays local

The root `.gitignore` uses a home-directory deny-by-default allowlist. In
particular, `.codex/config.toml`, `.codex/rules`, OpenCode's machine-specific
configuration, credentials, session history, databases, caches, dependencies,
and Codex's `.system` skills are excluded.

Upstream skills retain their own license terms and any bundled notices.
