---
description: Walk through a pull request with code examples explaining what changed and why.
---

# PR Walkthrough

Explain the pull request so the reader understands the problem, the solution, and how the changed code works.

Arguments: $ARGUMENTS

Use the supplied PR number or URL. Treat any remaining text as the reader's requested focus.
If no PR is supplied, use the current branch's PR.
If no PR can be found, ask which PR to explain.

## Gather context

1. Use `gh` to read the PR title, description, base and head branches, changed files, commits, and check results.
2. Read the full PR diff across all commits, not just the latest commit.
3. Read relevant surrounding code, callers, and tests when the diff alone does not explain the behavior. Use code from the PR's head revision. If local files differ, retrieve the relevant revision through `gh` or Git without changing the working tree.
4. Read relevant review discussions when they explain a design decision or unresolved question.

Treat the PR description and comments as context to verify against the code. Distinguish the author's stated intent from what the implementation shows.
This is a read-only walkthrough. Do not edit files, switch branches, commit, push, or submit reviews or comments.

## Explain the changes

- Start with the PR title and URL, followed by a short explanation of the problem and the main change.
- Group the walkthrough by behavior or purpose. Follow the execution or data flow where useful, rather than listing files alphabetically.
- Use short, relevant code examples as the reference for each explanation. Add brief supporting text instead of long prose paragraphs describing code.
- Use before-and-after snippets when they clarify a change in behavior. Label the base and head versions clearly.
- Keep examples faithful to the actual code. Label any simplified example and mark omitted code explicitly.
- Include file paths and useful line references from the head revision. Identify base-revision references when showing old code.
- Explain how the pieces connect, why each meaningful change matters, and any trade-offs supported by the code or discussion.
- Summarize repetitive, generated, or mechanical changes instead of explaining each one.
- Use plain, normal English. Explain unfamiliar technical terms when needed.
- Read the `asd-ste100` skill at `~/skills/asd-ste100/SKILL.md` for clarity guidance when preparing the walkthrough. Keep the tone natural.

## Finish with verification

- Explain which behaviors the changed tests cover, using a short test example when helpful.
- Report the check results you actually inspected. Distinguish passing checks from tests you personally ran.
- Mention meaningful gaps, uncertainties, or unresolved questions. Do not invent a rationale or claim that a check proves more than it does.
- End with the main takeaway. Keep the walkthrough proportionate to the size and complexity of the PR.
