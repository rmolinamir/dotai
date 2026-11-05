---
name: homelab-navigate
description: Locate Atomly homelab hosts, repository definitions, Kubernetes resources, and CI configuration when investigating the shared runner infrastructure.
---

Locate the `atomly/homelab` checkout before following repository-relative paths.
The usual local path is `/home/rmolinamir/projects/homelab`; verify its Git remote.
If it is elsewhere, use the matching checkout. Commands and paths such as
`arc/values.yaml`, `README.md`, and `scripts/` below refer to that repository,
not to the dotai checkout or the installed skill directory.

Read the root README and the current manifests before assuming the deployed state.
This repository owns the shared runner image and ARC scale-set configuration.
Application repositories own their tool versions, dependency lockfiles, and jobs.

## Hosts and access

The `development` VM uses `/home/rmolinamir` itself as the canonical
`rmolinamir/dotai` Git worktree. Confirm its Git remote before editing shared
skills. Pull that checkout instead of creating a duplicate under `projects/dotai`.
The `atomly/homelab` checkout remains a separate repository under `projects/`.

- K3s VM: `development-ci`, `192.168.122.170`, SSH user `rmolinamir`.
- VM checkout: `/home/rmolinamir/projects/homelab`.
- The local homelab host has a direct route to the VM; check `ip route get 192.168.122.170` if access fails.
- The VM login shell is Fish. For Bash scripts, use `ssh rmolinamir@192.168.122.170 bash -s` with a quoted heredoc.
- On the VM, set `KUBECONFIG="$HOME/.kube/config"`. Bare `kubectl` otherwise selects a root-only K3s config.
- Flux CLI: `~/.local/bin/flux`. Git, gh, kubectl, and Helm are also installed.
- Use existing SSH/gh authentication. Request missing credentials privately; never commit them.

## Where to look

| Concern | Location |
| --- | --- |
| Flux bootstrap and Git source | `clusters/development-ci/flux-system/` |
| ARC reconciliation switch | `clusters/development-ci/arc.yaml` |
| Helm release/chart/values | `arc/release.yaml`, `arc/chart.yaml`, `arc/values.yaml` |
| Persistent tool/browser caches | `arc/cache-pvcs.yaml` |
| Docker Hub pull-through cache | `arc/registry-cache.yaml` |
| Generic runner image and publisher | `images/actions-runner/Dockerfile`, `.github/workflows/runner-image.yml` |
| Candidate runtime smoke test | `scripts/validate-node-runner.sh` |
| First application integration | `atomly/servifai`: `.github/actions/setup-ci/action.yml`, `.github/workflows/ci.yml`, `mise.toml`, `mise.lock` |

Flux runs in `flux-system`; the controller and scale-set listeners run in
`arc-systems`; the `homelab-atomly` scale set and cache resources live in
`development-ci-arc-atomly`. Registration targets `https://github.com/Atomly` and
runner group `homelab`, which permits private organization repositories.

Use `flux get kustomizations -A`, `flux get helmreleases -A`, and
`kubectl -n development-ci-arc-atomly get pods,pvc,autoscalingrunnersets` to compare
Git with the live state. `helm get values` is useful for inspection; routine
changes belong in Git rather than a manual Helm upgrade.

For operation and rollback, read `../homelab-operate/SKILL.md`. For a new
application repository, read `../homelab-add-repository/SKILL.md`.
