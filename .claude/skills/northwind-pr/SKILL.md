---
name: northwind-pr
description: Write a pull request description for Northwind work in the team's required format, checked against the org engineering standards. Use when drafting or writing a PR description in this repo, when /submit needs a PR body, or when the user invokes /northwind-pr.
---

# /northwind-pr

Write the pull request description for this branch, in the team's required format and held to `docs/ORG-STANDARDS.md`.

`/pr` covers writing a readable description anywhere. This is the Northwind layer on top: a fixed set of sections, the standards a reviewer here cites by number, and the release rules the console requires before a merge. When both apply, this one wins — `/submit` looks for this skill first.

## 1. Read before you write

Read all four. Do not start the description until you have.

- `git log main..HEAD --oneline` — how the work was sequenced
- `git diff main...HEAD --stat`, then the diff itself — what actually changed
- The ticket in `docs/tickets/` — the acceptance criteria, **verbatim**
- The spec in `docs/specs/`, if one exists — what was planned, and where the build departed from it

Never describe a change you have not seen in the diff. If the branch does something you cannot explain, say so under **Deliberately not done** or Notes rather than inventing a reason for it.

## 2. Run the verification before you write about it

Not from memory, not from intent. Run them now:

```bash
npm test
npm run lint
```

Keep the **actual summary line** — `Tests  34 passed (34)` — not a paraphrase of it. If something fails, the PR says it fails.

For anything user-facing, exercise it and record what you saw: the URL or control you used and the observed result. A `curl` against a route and a browser check both count.

## 3. Audit your own diff against the standards

Walk `docs/ORG-STANDARDS.md` item by item. The ones that catch real changes here:

| # | What a violation looks like in your diff |
| --- | --- |
| 1, 2 | A float amount, a `/ 100` outside a formatter, or formatter output flowing back into arithmetic or storage |
| 4, 5 | Bucketing or comparing on server local time; a bare `new Date()` near a query |
| 6 | A second filtering or sorting path that should have gone through the shared query builder |
| 7 | A client value reaching a query, a filename, or the store without an allowlist check |
| 8 | A full card number anywhere outside the single creation response |
| 10 | A stray `console.log`, commented-out code, or a TODO about to be merged |

Fix what you find. Anything you are deliberately leaving goes in **Deliberately not done**, with the reason.

Also confirm `git branch --show-current` is not `main`. If it is, stop and tell the user before writing anything.

## 4. Write the description

Title: `<TICKET-ID>: <what it does>` — the ID from the branch name (`NWP-201-issue-cards` → `NWP-201`), the summary from the ticket title.

Five required sections, in this order. Start from `.github/pull_request_template.md` and leave no placeholder comments behind.

### What changed

One paragraph, plain language. What can the app do now that it could not do before?

Not a file list — the diff is already a file list. "Ops can now choose which columns go in the export, and the card last four is off by default" beats "modified csv.ts, route.ts, and page.tsx."

### How I verified it

The commands you actually ran and what they actually output. Paste the test summary line from step 2. Name what you clicked or requested and what appeared.

"Tests pass" is weak. "`npm test` — 34 passed (3 files), including the empty-column-selection case" is evidence. If the change accepts client input, show the rejection path too — the `400`, not just the success.

### Acceptance criteria

The ticket's checkboxes, copied over and ticked honestly.

A criterion that is half met is written as half met, naming **which half**. An unmet criterion stated plainly reads as judgment; the same criterion quietly ticked reads as a lie, and the reviewer finds it either way.

### Deliberately not done

Anything out of scope, deferred, or left for a follow-up — each with one line of reasoning.

Stretch goals you skipped, a test you decided was not worth it, an edge case the ticket did not ask for, refactors you noticed and left alone. A reviewer who finds an omission here reads it as a decision. The same omission discovered in the diff reads as an oversight, and costs you the benefit of the doubt on everything else in the PR.

Write "Nothing" if that is true. Do not leave the section out.

### Business impact

One sentence on what this is worth to whoever asked for it, per the console's release standards in `build-battle/merchant-console/CLAUDE.md`. Prefer the ticket's own numbers: *"Removes 3–4 hours a month of manual spreadsheet editing and the risk of card data reaching a merchant unredacted."* Not *"improves the export."*

## 5. Hand it over

Print the finished description. Then offer — do not run:

```bash
gh pr create --title "<TICKET-ID>: <what it does>" --body-file <file>
```

Opening a pull request is the user's call. Ask which repo it targets if there is any chance of ambiguity between a fork and upstream.

## Rules

- **Never claim a verification step that was not run.** Not a softened version, not an implied one. If you did not run it, it does not go in the PR. This is the single failure that makes every other honest line in the description worth less, and it is the easiest one to check.
- **Evidence, not adjectives.** "`npm test` — 34 passed (3 files)" is evidence. "Fully tested" is not.
- **Cite standards by number.** "Validated server-side against `EXPORT_COLUMNS` (#7)" tells a reviewer exactly which rule you are answering.
- **Plain language over ceremony.** "Ops can now issue a card and see it in the list" beats "implemented card issuance functionality."
- **Scannable.** Short paragraphs, real bullets, no emoji, no filler, no summary of the summary. A reviewer skims first and reads second.

## Why this exists

A description is not paperwork. It is the difference between a reviewer who understands the change in thirty seconds and one who reverse-engineers it from a diff and guesses at intent.

The standards document is written to be checked rather than admired, and the check is cheapest while the change is still yours. Auditing your own diff takes a few minutes and turns review into a conversation about trade-offs instead of a hunt for a `/ 100`.
