---
name: northwind-pr
description: Write a pull request description for Northwind work, checked against the org engineering standards and the console's release standards. Use when drafting a PR in this repo, when /submit needs a PR body, or when the user invokes /northwind-pr.
---

# /northwind-pr

Write the pull request description for this branch, held to `docs/ORG-STANDARDS.md`.

`/pr` covers how to write a readable description anywhere. This is the Northwind layer on top: the standards a reviewer here will cite by number, and the three release rules the console requires before a merge. When both apply, this one wins — `/submit` looks for this skill first.

## 1. Gather facts, do not recall them

Read, in this order:

- `git log main..HEAD --oneline` — the sequence
- `git diff main...HEAD --stat`, then the diff — what actually changed
- The ticket in `docs/tickets/` — acceptance criteria, **verbatim**
- The spec in `docs/specs/`, if one exists — and where the build departed from it
- `docs/ORG-STANDARDS.md` — the numbered list you are about to be judged against

Never describe a change you have not read in the diff. If the branch does something you cannot explain, say so in Notes rather than inventing a reason.

## 2. Run the verification before you write about it

Do not write this section from memory or intent. Run them now:

```bash
npm test
npm run lint
```

Capture the **actual summary line** — `Tests  34 passed (34)` — not a paraphrase. If anything fails, the PR says it fails. A red suite reported honestly is a working relationship; a red suite described as green is discovered in about four minutes and costs you every future benefit of the doubt.

For anything user-facing, exercise it and record what you saw: the URL or control you used, and the observed result. `curl` against a route and a browser check both count. "Checked it in the browser" alone does not — name what appeared.

## 3. Audit against the standards

Walk `docs/ORG-STANDARDS.md` and check your own diff, item by item. The ones that catch real changes here:

| # | What a violation looks like in your diff |
| --- | --- |
| 1, 2 | A float amount, a `/ 100` outside a formatter, or formatter output flowing back into arithmetic or storage |
| 4, 5 | Bucketing or comparing on server local time; a bare `new Date()` near a query |
| 6 | A second filtering or sorting path that should have gone through the shared query builder |
| 7 | A client value reaching a query, filename, or the store without an allowlist check |
| 8 | A full card number anywhere outside the single creation response |
| 10 | A stray `console.log`, commented-out code, or a TODO you are about to merge |

Item 7 deserves a line of its own in the description whenever the change accepts client input. Name the allowlist and where it sits — a reviewer should not have to hunt for the boundary.

Fix what you find. If you are deliberately leaving something, put it in Notes with the reason; do not let a reviewer discover it.

## 4. Meet the console's release standards

From `build-battle/merchant-console/CLAUDE.md`. All three, every time:

- **Test evidence before merging** — the summary line from step 2, in the body.
- **No direct commits to `main`** — confirm with `git branch --show-current`. If it returns `main`, stop and tell the user before writing anything.
- **A one-line business impact summary** — one sentence on what this is worth to whoever asked for it. Prefer the ticket's own numbers: *"Removes 3–4 hours a month of manual spreadsheet editing and the risk of card data reaching a merchant unredacted."* Not *"improves the export."*

## 5. Fill in the template

Use `.github/pull_request_template.md`. Every section, no placeholder comments left behind.

Add one section the template does not have, after **What changed**:

```markdown
## Business impact

<!-- One sentence. -->
```

On **Acceptance criteria**: copy the ticket's checkboxes and tick them truthfully. A criterion that is half met is written as half met, naming which half. An unmet criterion stated plainly reads as judgment; the same criterion quietly ticked reads as a lie, and the reviewer finds it either way.

## 6. Hand it over

Print the finished description. Then offer — do not run:

```bash
gh pr create --title "<TICKET-ID>: <what it does>" --body-file <file>
```

Opening a pull request is the user's call. Ask which repo it targets if there is any chance of ambiguity between a fork and upstream.

## Rules

- **Evidence, not adjectives.** "`npm test` — 34 passed (3 files)" is evidence. "Fully tested" is not.
- **Never claim a step you did not run.** This is the one failure that makes everything else in the PR worth less.
- **Cite standards by number.** "Validated server-side against `EXPORT_COLUMNS` (#7)" tells a reviewer exactly which rule you are answering.
- **Say what you left out.** A stated limit is cheaper than a discovered one.
- **Plain language, scannable.** Short paragraphs, real bullets, no emoji, no summary of the summary.

## Why this exists

The standards document is written to be checked rather than admired, and the check is cheapest while the change is still yours. Auditing your own diff against it takes a few minutes and turns review into a conversation about trade-offs instead of a hunt for a `/ 100`.
