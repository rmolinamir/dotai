---
name: homelab-add-repository
description: Onboard a trusted private Atomly repository to the shared homelab-atomly runner with repository-owned mise tools and persistent CI caches.
---

Locate the `atomly/homelab` checkout before following repository-relative paths.
The usual local path is `/home/rmolinamir/projects/homelab`; verify its Git remote.
If it is elsewhere, use the matching checkout. Commands and paths such as
`arc/values.yaml`, `README.md`, and `scripts/` below refer to that repository,
not to the dotai checkout or the installed skill directory.

Use the existing organization scale set. Do not create a repository-specific
runner image, copy ARC configuration into the application repository, or write a
second version resolver. Read the current `arc/values.yaml` and the working
Servifai setup action as examples rather than assuming their tooling fits every
repository.

## Repository contract

The repository must be trusted: these jobs share executable caches and privileged
DinD. Confirm runner group `homelab` includes the private repository and excludes
public/untrusted fork jobs. Gate trusted jobs before checkout, preserve draft/fork
protections, and scope credentials to the steps that need them.

Declare tools in the repository using mise's native version discovery. For a Node
repository with `package.json` devEngines, the Servifai pattern is:

```toml
[tool_config]
locked = true

[settings]
idiomatic_version_file_enable_tools = ['node', 'pnpm']
```

Commit `mise.lock`, including Linux x64 downloads for the VM. Generate it with
`mise lock --platform linux-x64` plus any local platforms the repository supports.
Use `[tools]` when that is the repository's chosen version source. Do not duplicate
package-manifest versions in shell scripts or in the shared image.

## Workflow setup

Use `runs-on: homelab-atomly` for trusted heavy jobs, and keep lightweight control
jobs on GitHub-hosted runners when appropriate. After checkout, install from the
lock and export the resulting tool paths:

```bash
mkdir -p "$MISE_DATA_DIR"
mise trust --yes
flock --timeout 600 "$MISE_DATA_DIR/.install.lock" mise install --locked
mise env --json | jq -r '.PATH | split(":")[]' >> "$GITHUB_PATH"
```

Subsequent steps can use the installed tools. Alternatively run commands through
`mise exec -- ...`. On hosted runners, `jdx/mise-action@v5` can install the locked
tools and use GitHub-managed caching. Do not restore remote archives over the
shared self-hosted tool or package stores.

For pnpm, install with `pnpm install --frozen-lockfile --no-runtime`. Preserve the
runner's `PNPM_CONFIG_STORE_DIR`; do not redirect it into `_work` or cache
`node_modules` between jobs. Root-only change-detection installs can remain
filtered. Other ecosystems need their own dependency-cache decision.

For Playwright, keep the package in the application's dependency lockfile. Run the
browser install after dependencies, under
`$PLAYWRIGHT_BROWSERS_PATH/.install.lock`, then run the repository's tests. The
runner supplies Chromium system libraries and persistent binaries, with browser
GC disabled. Do not require a globally installed Playwright CLI. A Playwright
upgrade can require an infrastructure-library refresh even when browser downloads
are cached.

Native jobs receive the PVC mounts. Docker job containers do not automatically
inherit them. DinD images from Docker Hub use the shared mirror; other registries
need a separate explicit caching plan. Never mount a shared Docker daemon data
directory into multiple runner pods.

## Acceptance

Confirm the existing controller release `arc` and scale-set release
`homelab-atomly` are Ready with `flux get helmreleases -A`. If controller readiness
blocks runner reconciliation, use `homelab-operate` and the homelab checkout's
`docs/arc-controller.md`; do not create a parallel controller for the new repository.

Use a PR to prove the repository's real build/tests on the runner. Repeat from a
new ephemeral pod and verify tool, package, browser, and runner-image reuse as
applicable. Check its resources alongside other repositories. Keep repositories
independent: different locked tool or browser versions must coexist.

Document any repository-specific services or step credentials in that repository.
Shared runner/Flux changes belong here. A new language, service image, or storage
requirement must not silently turn the generic runner into an application image.
