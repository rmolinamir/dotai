````md
---
description: Create a GitHub PR and return its URL.
---

# Create PR

Create a pull request from the current changes and return the PR URL.

Arguments:

- `$1`: Optional branch name
- `$2`: Optional commit message
- `$3`: Optional PR title

Use sensible defaults from the diff when arguments are missing.

## Steps

1. Inspect the changes:
   ```bash
   git status -sb
   git diff
   git diff --cached
   git log -5 --oneline
  ````
2. Resolve the default branch with `gh repo view`.
3. If on the default branch or detached HEAD, create a branch using `$1` or a concise derived name.
4. Stage only relevant changes. Do not include unrelated or sensitive files.
5. Run the most relevant available checks.
6. Commit staged changes using `$2` or a concise conventional commit message.
7. Push the current branch:
   ```bash
   git push -u origin "$(git branch --show-current)"
   ````
8. If a PR already exists for the branch, return its URL.
9. Use the repository’s PR template when available. Otherwise use the fallback PR request below.
10. Create the PR with `$3` or a title derived from the full branch diff, then return the URL.

## Fallback PR Request Template

Use the following template if there are no `PULL_REQUEST_TEMPLATE.md` documents:

```md
# Summary

- **Problem:** [Briefly state the problem being solved]
- **Solution:** [Describe the high-level approach taken]

## Implementation

[Succinctly explain what changes were made]

## Verification

[How was this change verified?]

- **Checks**: [e.g., Passed all CI checks]
- **Tests:** [e.g., Passed 12/12 tests in `user_service_test.ext`]

## Notes

- [ ] **Risk Level:** [Low/Medium/High]
- [ ] **Refactoring:** [Did this PR include unexpected refactors?]
- [ ] **Assumptions:** [What assumptions did you make about the existing codebase?]

```
