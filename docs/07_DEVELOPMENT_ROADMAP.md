# Michiko Smart Ledger — Development Roadmap

**Status:** Sequencing plan only; no phase is implemented by this document

Every phase requires reviewed entry criteria before work begins. Later-phase convenience must not weaken earlier Domain invariants.

## Phase 0 — Foundation and business rules

- **Objective:** establish one approved product language and rule set.
- **Major deliverables:** seven-document foundation, confirmed vocabulary, observed reception workflow, anonymized scenarios, open-rule register, privacy baseline.
- **Entry criteria:** project mission and stakeholders identified.
- **Exit criteria:** reception, accounting, management, and engineering approve the foundation and know which rules remain provisional.
- **Risks:** undocumented handwritten exceptions, conflicting terminology, and premature technical decisions.
- **Must not be implemented early:** application UI, schema, migrations, or automated business behavior.

## Phase 1 — Domain model and invariants

- **Objective:** define canonical business concepts and ownership.
- **Major deliverables:** reviewed transactions, branches, patients, HN Registry, payments, entitlements, Member relationships, audit model, invariants, and use-case boundaries.
- **Entry criteria:** Phase 0 rules are approved or explicitly marked unresolved.
- **Exit criteria:** representative clinic scenarios can be expressed without free-text relationships or duplicated facts.
- **Risks:** database-shaped modeling, unclear correction semantics, and conflated Member roles.
- **Must not be implemented early:** final schema, UI components, OCR, or reports.

## Phase 2 — Narrative Engine specification

- **Objective:** define deterministic Human narrative before renderer design.
- **Major deliverables:** structured output contract, wording versions, source references, warnings, approved Thai examples, and scenario acceptance cases.
- **Entry criteria:** Domain facts and entitlement relationships are stable enough to supply narratives.
- **Exit criteria:** Course, Package, Deposit, Member, Shared Member, payment, and correction stories have reviewed meaning; provisional wording is clearly labeled.
- **Risks:** narrative logic leaking into UI, invented missing facts, and wording that hides source relationships.
- **Must not be implemented early:** renderer-specific HTML, PDF layout, or editable narrative truth.

## Phase 3 — Database schema and migrations

- **Objective:** design safe relational persistence from the approved Domain Model.
- **Major deliverables:** schema design, constraints, indexes, audit retention, concurrency strategy, migration plan, backup plan, and restore rehearsal plan.
- **Entry criteria:** Domain Model and Narrative Engine data requirements are reviewed.
- **Exit criteria:** schema review demonstrates global HN safety, atomic entitlement use, exact money, branch isolation, correction trace, and rebuildable projections.
- **Risks:** duplicated balances, weak foreign keys, unsafe concurrency, and irreversible migrations.
- **Must not be implemented early:** production migration or data import before review and representative tests.

## Phase 4 — Design system and ledger prototype

- **Objective:** validate Michiko Blossom and Daily Ledger readability with reception.
- **Major deliverables:** tokens, typography, accessible primitives, nonfunctional ledger prototype, responsive behavior, print exploration, and iPad usability findings.
- **Entry criteria:** narrative examples and required ledger information are available.
- **Exit criteria:** reception recognizes the workflow and approves reading density, Details hierarchy, blank payment cells, input order, and touch comfort.
- **Risks:** dashboard styling, decorative color overuse, inaccessible pastels, and narrative truncation.
- **Must not be implemented early:** business persistence, entitlement calculation, or report writes.

## Phase 5 — Daily Ledger entry and review workflow

- **Objective:** safely create, review, post, correct, and void canonical Daily Ledger events.
- **Major deliverables:** active branch context, HN-first patient selection, draft/review/post lifecycle, correction/void flow, audit events, and branch/day ledger projection.
- **Entry criteria:** schema and tested design prototype are approved.
- **Exit criteria:** authorized users can complete representative basic transactions with mandatory HN, separate branches, and traceable posted history.
- **Risks:** silent edits, duplicate submission, repeated branch selection, and name-based patient matching.
- **Must not be implemented early:** unresolved entitlement behavior, combined management reporting, or OCR autofill.

## Phase 6 — Payments and reconciliation

- **Objective:** represent exact payment allocations and branch daily totals.
- **Major deliverables:** Cash, SCB, LP, Credit Card, Member, Deposit, and Outstanding allocations; validation; blank-cell presentation; reconciliation views; exception handling.
- **Entry criteria:** canonical transaction lifecycle is stable.
- **Exit criteria:** all supported payment scenarios reconcile exactly in integer satang and reproduce correct Daily Ledger columns and branch totals.
- **Risks:** floating point, placeholder zero allocations, surcharges without rules, and cross-branch totals.
- **Must not be implemented early:** fee behavior that remains unconfirmed or independent accounting records.

## Phase 7 — Course, Package, Deposit, and Member ledgers

- **Objective:** implement source-linked entitlements and Every usage has a story.
- **Major deliverables:** entitlement accounts and entries, purchase/use flows, explicit source selection, remainders, usage sequence, completion behavior, narrative integration, and concurrency tests.
- **Entry criteria:** payment reconciliation and related entitlement rules are approved.
- **Exit criteria:** every use links to an eligible source, commits atomically, calculates its remainder, and produces an approved narrative without typed references.
- **Risks:** overspending, ambiguous source choice, manually edited balances, and free-text Package usage.
- **Must not be implemented early:** expiry, transfers, stacking, or refunds until those rules are confirmed.

## Phase 8 — Shared Member

- **Objective:** support safe Member sharing through explicit relationships.
- **Major deliverables:** owner and authorized-user management, eligible-account suggestions, explicit multi-account choice, recipient and payer roles, audit, and approved narrative.
- **Entry criteria:** ordinary Member behavior is stable and Shared Member permissions are confirmed.
- **Exit criteria:** one owner, multiple permitted relationships, actual recipient, payer, and balance source remain distinguishable in all tested scenarios.
- **Risks:** treating notes as authorization, silently locking past choices, and using the wrong account.
- **Must not be implemented early:** automatic source confirmation when multiple accounts are eligible.

## Phase 9 — Receipt import and review

- **Objective:** assist entry from receipts without bypassing Domain validation.
- **Major deliverables:** controlled intake, source metadata, matching, duplicate detection, review queue, exceptions, human confirmation, and audit trail.
- **Entry criteria:** manual Daily Ledger, payment, and entitlement workflows are reliable.
- **Exit criteria:** imported facts cannot post until validated, matched to HN, assigned to one branch, and reviewed according to policy.
- **Risks:** wrong patient matching, duplicate transactions, trusted unstructured text, and sensitive-data leakage.
- **Must not be implemented early:** automatic posting or OCR-based identity decisions.

## Phase 10 — Daily PDF, print, copy, and accounting delivery

- **Objective:** deliver the same Daily Ledger meaning through authorized channels.
- **Major deliverables:** PDF renderer, print layout, copyable summary, authorized accounting delivery, repeated headers, page-break behavior, and export audit.
- **Entry criteria:** Narrative Engine output and Daily Ledger projection are stable.
- **Exit criteria:** all renderers preserve structured meaning, branch/date identity, Details readability, blank cells, and source access where authorized.
- **Risks:** renderer-specific wording, clipped narratives, color-dependent output, and unauthorized patient-data export.
- **Must not be implemented early:** separate export facts or manually maintained report prose.

## Phase 11 — Management reports and analytics

- **Objective:** provide authorized derived insight without weakening Branch first.
- **Major deliverables:** branch reports, explicit combined management mode, monthly New totals, audit-aware metrics, filters, and controlled exports.
- **Entry criteria:** canonical facts and operational reconciliation are proven reliable.
- **Exit criteria:** every metric is reproducible from canonical records, counts each HN correctly, and visibly communicates branch scope.
- **Risks:** duplicate fact stores, text-based HN comparison, implicit branch mixing, and metrics that reduce narrative clarity.
- **Must not be implemented early:** independent reporting writes or combined views for normal users.

## Phase 12 — OCR and smart suggestions

- **Objective:** reduce repetitive input while preserving human control and Domain certainty.
- **Major deliverables:** OCR extraction, confidence model, suggestions, ambiguity warnings, correction feedback, and privacy safeguards.
- **Entry criteria:** manual workflows, receipt review, and source selection are stable and measurable.
- **Exit criteria:** uncertain output requires confirmation, missing facts are never guessed, and suggestions cannot bypass HN, branch, source, or reconciliation rules.
- **Risks:** automation bias, wrong HN, hidden branch assumptions, invented facts, and sensitive-data exposure.
- **Must not be implemented early:** autonomous confirmation, posting, or silent Member-source choice.
