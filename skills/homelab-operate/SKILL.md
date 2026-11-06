---
name: homelab-operate
description: Change, validate, diagnose, or clean Atomly's Flux-managed ARC runners, shared image, and persistent caches, including controller adoption, rollout, and rollback.
---

Locate the `atomly/homelab` checkout before following repository-relative paths.
The usual local path is `/home/rmolinamir/projects/homelab`; verify its Git remote.
If it is elsewhere, use the matching checkout. Commands and paths such as
`arc/values.yaml`, `README.md`, and `scripts/` below refer to that repository,
not to the dotai checkout or the installed skill directory.

Use `../homelab-navigate/SKILL.md` for access and resource locations. Inspect the
current Git and cluster state before changing it. Keep the existing working
runner available until a candidate passes real repository CI.

## Delivery and validation

Make infrastructure changes through a PR. Render the scale-set configuration:

```bash
flux build kustomization atomly-arc --path ./arc \
  --kustomization-file ./clusters/development-ci/arc.yaml --dry-run
```

For controller changes, also render:

```bash
flux build kustomization atomly-arc-controller --path ./arc-controller \
  --kustomization-file ./clusters/development-ci/arc-controller.yaml --dry-run
```

Flux manages the existing controller release `arc` in `arc-systems`. Preserve its
release/storage identity. The scale-set Kustomization and HelmRelease depend on
controller readiness. Inspect `arc-controller/` and `docs/arc-controller.md` before
controller upgrades, adoption, or recovery. Compare the pinned chart, rendered
RBAC, image, and pod settings with the working release. OCI chart-version labels
can cause a controller pod restart even when its image is unchanged. Keep active
runner jobs intact. The current `upgrade.crds: Skip` preserves existing CRDs;
future chart upgrades need an explicit CRD compatibility and lifecycle review.

The publisher builds and smoke-tests the generic image, then publishes on main
and on its weekly schedule. Publishing `latest` does not change the deployed
digest. The publisher currently does not open a promotion PR automatically. A
maintainer opens that PR after validating the candidate. Automatic digest-PR
creation is a proposal tracked separately from the existing publisher.

Promote a tested digest in `arc/values.yaml` for BOTH the runner and
`init-dind-externals`. Keep `IfNotPresent` so K3s reuses node-local image layers.

Confirm package visibility through `gh api orgs/atomly/packages/container/actions-runner`.
Verify anonymous manifest access or an unauthenticated pull as well. New GHCR
packages default to private; changing visibility requires GitHub package settings,
not the packages REST API. Do not activate an image that requires an unconfigured
registry credential.

Validate real locked tool installation, dependency installation, Chromium launch,
and Docker connectivity. `scripts/validate-node-runner.sh` runs inside a candidate
with a checkout, cache mounts, and `BROWSER_WORKSPACE` set. Test four concurrent
pods and a replacement pod with a fresh checkout. Warm logs should show installed
mise tools, pnpm reuse with no downloads for an unchanged lockfile, and no browser
download. Kubelet events should show the pinned images already present. Confirm
Docker's `Registry Mirrors` includes the internal cache.

For workflow changes, a temporary canary scale set can use the same reviewed
values, cache PVCs, and candidate digest with a different scale-set/release name.
Servifai's optional `ARC_RUNNER` variable selects it. Keep the original scale set
available, test the PR on the canary, then merge and activate production. Remove
the variable and temporary release after production CI passes. Temporary test
resources must not become an alternative permanent deployment path.

After merge, Flux reconciles Git automatically. For an immediate check:

```bash
flux reconcile kustomization flux-system --with-source
flux reconcile kustomization atomly-arc-controller
flux reconcile kustomization atomly-arc
flux get kustomizations -A
flux get helmreleases -A
```

Verify controller release `arc` and runner release `homelab-atomly` are Ready.
Check the expected controller and runner images.
Preserve the runner scale set's name, group, authentication Secret reference,
custom DinD template,
and runner-only AppArmor workaround unless the task explicitly changes them.
Never print Secret payloads or kubeconfig contents.

## Cache and capacity rules

- `arc-tool-cache`: mise installs under `.local/share/mise` and pnpm's store under `.local/share/pnpm/store`.
- `arc-browser-cache`: mise downloads under `.cache/mise` and Playwright revisions under `.cache/ms-playwright`.
- `arc-registry-cache`: Docker Hub content served by the internal registry; proxy entries expire after seven days.
- Each job owns its checkout, `node_modules`, and DinD daemon state. Never share `/var/lib/docker` between daemons.
- Use the shared mise and browser install locks from the current CI action. Keep `PLAYWRIGHT_SKIP_BROWSER_GC=1`.
- These are single-node local-path RWO claims. Multiple pods can share them on this node; adding nodes requires a new storage plan.
- Local-path sizes are not filesystem quotas. Check `df -h /`, cache usage, and `kubectl top` before increasing concurrency. Account for runner, DinD, and system services together.

## Rollback and cleanup

Record the working digest and Helm values before a rollout. Prefer reverting the
activation/image PR so Flux restores the previous configuration. Suspending a
Kustomization pauses reconciliation; it does not undo an upgrade. If emergency
manual Helm work is necessary, suspend the owning reconciliation first and make
Git agree before resuming it.

For controller recovery, suspend HelmRelease `arc` in `arc-systems` as well as
Kustomization `atomly-arc-controller` before manual Helm changes. Suspending only
the Kustomization does not pause HelmRelease reconciliation. Do not delete the
controller HelmRelease, namespace, or ARC CRDs to roll back. Child Kustomizations
use `prune: false`, but explicit HelmRelease deletion can uninstall the release.
Removing manifests from Git is not a Helm rollback. Follow `docs/arc-controller.md`
for the recorded backup, release history, and recovery procedure.

The initial pre-Flux backup is on the VM at
`~/.local/state/homelab/homelab-atomly.pre-flux.yaml`. Its old image package may
have been retired, so verify image availability before treating it as a rollback.

Inspect containers, pod image IDs, image digests, and package references before
deleting anything. Remove completed validation Jobs and temporary canaries. Delete
retired publishing workflows before deleting their packages, so CI cannot recreate
them. Preserve current/rollback image digests, PVCs, and active workloads. Prune
only identified unused CI images; avoid broad system or volume pruning. Browser
cleanup requires checking the revisions needed by onboarded repositories while
runners are idle. Never remove another repository's active cache revision.

## Official upstream guidance

Official Flux skills are published at https://github.com/fluxcd/agent-skills.
They may recommend Flux Operator for new installations. This homelab currently
uses committed Flux bootstrap manifests; a skill installation or update does not
authorize replacing that working architecture.

No official ARC skill was found in the upstream ARC repository. For ARC-specific
behavior, consult GitHub's official documentation and the chart version deployed
here: https://docs.github.com/en/actions/concepts/runners/actions-runner-controller
and https://github.com/actions/actions-runner-controller.
