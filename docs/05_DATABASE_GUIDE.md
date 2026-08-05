# Michiko Smart Ledger — Database Design Guide

**Status:** Provisional design guidance; not SQL or a migration

## 1. Purpose

This guide translates the approved Domain Model into database principles without finalizing tables or implementation details. The Domain Model remains the authority for meaning and invariants.

## 2. Relational database principles

- Use a relational database for transactional consistency and referential integrity.
- Store canonical business facts once.
- Enforce stable identifiers, required relationships, uniqueness, and valid states with appropriate constraints.
- Keep branch scope explicit on operational records and queries.
- Use migrations for every production schema change after schema design is approved.
- Do not encode core business rules only in UI code or ad hoc report queries.

## 3. Canonical write model

The canonical transaction and linked entries form the write model. Daily Ledger rows, totals, narratives, histories, and reports are projections, not alternate transaction records.

Writes follow one consistency boundary:

```text
validated Domain command
  → canonical transaction changes
  → payment and entitlement entries
  → audit event
  → commit together or roll back together
```

Idempotency must prevent duplicate records when a request is retried.

## 4. Read projections

Read projections may optimize branch/day Daily Ledger access, reporting, or exports, but they remain rebuildable from canonical data. A projection must not become an independent edit surface or conceal its source records.

The Narrative Engine receives validated canonical data and source links. It does not read an independently maintained narrative truth.

## 5. Keys and identifiers

- Internal entities use stable, nonmeaningful primary identifiers.
- HN is a durable clinic identifier with a unique prefix-plus-number representation.
- The numeric HN running portion is globally unique across branches.
- Foreign relationships use stable identifiers, not names or display text.
- External or imported identifiers are namespaced and do not replace internal identity.
- Human-visible references may coexist with internal keys but must not weaken uniqueness.

## 6. Foreign-key expectations

- A transaction references one branch and one patient.
- Transaction lines and payment allocations reference their transaction.
- Entitlement entries reference an account, source transaction, and usage transaction as applicable.
- Course, Package, Deposit, and Member accounts reference their owner or beneficiary according to Domain rules.
- Member authorized-user records reference both the Member account and authorized patient.
- Audit events reference the actor and affected records where possible without coupling audit retention to record deletion.
- Monthly HN baselines are unique by month.

Required relationships should be protected by foreign keys unless an approved retention or integration requirement demands a documented alternative.

## 7. Monetary storage

- Store money as integer satang.
- Never use binary floating point for currency.
- Store currency context if future multi-currency support is approved; version 1 assumes clinic currency rules defined by the Domain.
- Derive balances from canonical entries or controlled projections.
- Never ask users to enter a calculated balance-before or balance-after value.
- Reconciliation calculations and stored allocation totals must be exact.

## 8. Dates, time, and timezone

- Store dates and timestamps unambiguously.
- Preserve transaction date separately from audit timestamps when they have different meanings.
- Use the approved clinic timezone for display and business-day rules.
- Store monthly HN baselines by their effective calendar month.
- Thai Buddhist Era formatting is a presentation concern; canonical stored dates remain standard dates.
- The precise clinic timezone and business-day closing boundary require confirmation before schema finalization.

## 9. Transaction consistency

The following changes are atomic:

- canonical transaction posting and its audit event;
- payment allocations and reconciliation state;
- entitlement usage and resulting available remainder;
- HN allocation and patient creation;
- correction or void records and their audit trace.

Concurrency controls must prevent duplicate HNs, overspending a Deposit or Member balance, and consuming more Course or Package quantity than remains.

## 10. Audit, correction, and void strategy

Audit history is append-only. Posted business records are not silently overwritten or physically removed in normal operation.

A correction or void records:

- the original record;
- resulting corrective record or status;
- actor;
- timestamp;
- reason;
- relevant source references.

Current views derive effective state from this history. Retention requirements and exceptional deletion policies require legal and privacy review.

## 11. No duplicated balances

Balances and remaining quantities are derived from authoritative entitlement entries. If a cached balance is introduced for performance, it is a controlled projection protected by consistency checks and rebuildable from entries. It never becomes a separately editable fact.

The same rule applies to Daily Ledger totals, monthly New counts, payment totals, and narrative text.

## 12. Initial conceptual entity list

The initial concepts likely require relational representation:

- `branches`;
- `patients`;
- `hn_registry`;
- `transactions`;
- `transaction_lines`;
- `payment_allocations`;
- `entitlement_accounts`;
- `entitlement_entries`;
- `course_accounts`;
- `package_accounts`;
- `deposit_accounts`;
- `member_accounts`;
- `member_authorized_users`;
- `audit_events`;
- `monthly_hn_baselines`.

This list is provisional. It must be reviewed during the Domain Model phase and must not be treated as final table design. Specialization may use separate tables, shared tables, or another relational pattern only after invariants and query needs are validated.

## 13. Migration discipline

- Generate migrations only after Domain Model and schema review.
- Make each migration focused, ordered, reviewable, and safe for existing data.
- Test forward migration and restore or rollback procedures.
- Backfill derived data from canonical sources using repeatable processes.
- Never edit an already-applied production migration to disguise a later change.
- Validate constraints against representative clinic scenarios and concurrency cases.
- Rehearse backup restoration before production rollout.

No SQL, migration, Supabase file, or database implementation is created by this guide.
