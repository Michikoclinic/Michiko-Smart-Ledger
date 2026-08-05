# Michiko Smart Ledger — Conceptual Domain Model

**Status:** Authoritative conceptual model; not a database schema

This document defines business concepts, ownership, invariants, and relationships. It intentionally avoids final fields, SQL, framework classes, and migrations.

## Domain boundaries

| Module | Responsibility | Must not do |
|---|---|---|
| Identity & Access | Users, roles, sessions, and branch permissions | Infer patient, Member, or entitlement ownership |
| Branches | Branch identity, active context, and configuration | Combine operational branches implicitly |
| Patients | Stable HN identity and mutable profile information | Use names as identity |
| HN Registry | Global running number, branch prefix, and monthly baseline | Allocate independent branch sequences |
| Transactions | Canonical patient event and lifecycle | Duplicate facts for a report |
| Payments | Typed allocations and reconciliation | Own transaction totals independently |
| Entitlements | Common source and usage behavior | Accept typed source stories or manual remainders |
| Courses | Course purchase, session entitlement, and use | Compose renderer-specific text |
| Packages | Package purchase, quantity entitlement, and use | Reduce usage to free text |
| Deposits | Deposit value, source, use, and remainder | Allow untraceable source selection |
| Member Accounts | Member owner, monetary entitlement, entries, and balance | Treat service recipient as implicit owner |
| Member Authorized Users | Explicit authorization between patients and Member accounts | Store Shared Member only as notes |
| Narrative Engine | Structured, approved Human narrative from validated facts | Own balances, payment totals, or visual layout |
| Daily Ledger | Branch/date projection of canonical transactions and narratives | Become a write source |
| Audit | Append-only action and correction trace | Silently rewrite history |
| Reporting | Read-only derived management and operational views | Maintain independent business records |

## Module definitions

### Identity & Access

- **Purpose:** determine who is acting and which branch-scoped capabilities they may use.
- **Key concepts:** user, role, session, permission, active branch.
- **Invariants:** authorization is enforced server-side; cross-branch and management actions require explicit permission.
- **Relationships:** users act on transactions and audit events within permitted branches.
- **Responsibilities:** authenticate actors, provide active branch context, authorize use cases.
- **Prohibited:** deciding entitlement ownership or encoding clinic calculations.

### Branches

- **Purpose:** isolate operational work by clinic location.
- **Key concepts:** Paholyothin 21, EmSphere, active branch, registration prefix.
- **Invariants:** every canonical transaction has one branch; operational totals stay separate.
- **Relationships:** branches have transactions and users with access; HN prefixes record registration branch.
- **Responsibilities:** branch identity and configuration.
- **Prohibited:** silent aggregation or changing a posted transaction's branch.

### Patients

- **Purpose:** represent the person receiving clinic services.
- **Key concepts:** HN, display name, real name, nickname.
- **Invariants:** HN is identity; names may change and are never keys.
- **Relationships:** patients have transactions and may own or be authorized to use Member accounts.
- **Responsibilities:** patient identity and mutable display profile.
- **Prohibited:** matching identity solely by name.

### HN Registry

- **Purpose:** allocate and interpret HNs safely.
- **Key concepts:** prefix, global running number, monthly baseline.
- **Invariants:** one global nonrepeating numeric sequence; `M` identifies Paholyothin 21 and `EM` identifies EmSphere; New calculations use only the numeric portion.
- **Relationships:** the registry creates patient HNs and supplies monthly baselines.
- **Responsibilities:** concurrency-safe allocation and baseline history.
- **Prohibited:** branch-specific numeric sequences, lexical HN comparison, or manual New flags.

### Transactions

- **Purpose:** provide the single canonical account of a clinic event.
- **Key concepts:** transaction, line item, lifecycle, source reference.
- **Invariants:** one branch, one patient HN, traceable actor, and no silent posted-history overwrite.
- **Relationships:** transactions contain lines and payments and may create or use entitlements.
- **Responsibilities:** validate lifecycle and retain canonical facts.
- **Prohibited:** storing report-specific copies as separate truth.

### Payments

- **Purpose:** represent and reconcile how a transaction is settled.
- **Key concepts:** Cash, SCB, LP, Credit Card, Member, Deposit, Outstanding.
- **Invariants:** exact integer-satang values and reconciliation with the payable amount.
- **Relationships:** allocations belong to a canonical transaction; Member and Deposit allocations reference entitlement sources.
- **Responsibilities:** typed allocations and reconciliation rules.
- **Prohibited:** independent transaction totals or placeholder zero allocations.

### Entitlements

- **Purpose:** define common behavior for value or quantity acquired and later used.
- **Key concepts:** account, source entry, usage entry, available remainder.
- **Invariants:** every use has an eligible source; use and remainder update atomically.
- **Relationships:** transactions create and consume entitlement entries.
- **Responsibilities:** source eligibility, balance or quantity calculations, and audit links.
- **Prohibited:** manual derived balances or opaque usage notes.

### Courses

- **Purpose:** track purchased treatment sessions and each use.
- **Key concepts:** Course account, total sessions, use sequence, remaining sessions, purchase source.
- **Invariants:** sequence and remainder derive from entries; purchase date is retrieved from the source.
- **Relationships:** a Course belongs to a patient entitlement and links purchase and usage transactions.
- **Responsibilities:** Course eligibility and session calculation.
- **Prohibited:** asking users to type session sequence, remainder, or source date.

### Packages

- **Purpose:** track Package quantities or entitlements and their use.
- **Key concepts:** Package account, original entitlement, usage sequence where relevant, remainder.
- **Invariants:** every use references its purchase and derived remainder.
- **Relationships:** Package entries connect source and usage transactions.
- **Responsibilities:** Package-specific eligibility and quantity rules.
- **Prohibited:** free-text-only usage or untraceable source selection.

### Deposits

- **Purpose:** track deposited monetary value and later application.
- **Key concepts:** Deposit account, original amount, source date, usage, remainder.
- **Invariants:** every use names one explicit source; source date is automatic; remainder is calculated.
- **Relationships:** a Deposit is created by one transaction and may be consumed by later transactions.
- **Responsibilities:** source selection, eligibility, and exact balance entries.
- **Prohibited:** typed source dates or guessed source selection.

### Member Accounts

- **Purpose:** track Member monetary value and its single owner.
- **Key concepts:** owner, balance source, entries, balance before and after.
- **Invariants:** exactly one owner; every use identifies the account and actual recipient.
- **Relationships:** accounts belong to an owner and may authorize multiple other patients.
- **Responsibilities:** Member entries, balance calculation, and source account identity.
- **Prohibited:** conflating owner, recipient, payer, and authorized user.

### Member Authorized Users

- **Purpose:** model Shared Member permission explicitly.
- **Key concepts:** Member account, authorized patient, authorization status.
- **Invariants:** authorization is a relationship, not a note; a patient may be authorized for multiple accounts.
- **Relationships:** joins an authorized patient to a Member account whose owner may be different.
- **Responsibilities:** determine eligible Member sources and support source suggestions.
- **Prohibited:** silently locking a suggested account or implying authorization from past use alone.

### Narrative Engine

- **Purpose:** turn validated facts into structured natural Thai meaning.
- **Key concepts:** narrative model, wording version, source reference, warning.
- **Invariants:** deterministic output; no missing-fact guesses; same meaning across renderers.
- **Relationships:** consumes transactions and linked sources; supplies Daily Ledger and export renderers.
- **Responsibilities:** approved wording and story composition.
- **Prohibited:** balance ownership, independent payment calculation, or HTML/PDF layout.

### Daily Ledger

- **Purpose:** provide the primary branch/day operational experience.
- **Key concepts:** ledger row, Details, separate payment columns, branch totals.
- **Invariants:** confirmed entries require HN; empty payment values remain blank; branches remain separate.
- **Relationships:** projects canonical transactions and Narrative Engine output.
- **Responsibilities:** readable selection and ordering of derived information.
- **Prohibited:** creating or editing separate business truth.

### Audit

- **Purpose:** preserve who did what, when, and why.
- **Key concepts:** actor, action, timestamp, reason, source link.
- **Invariants:** append-only events and traceable corrections or voids.
- **Relationships:** events reference users and affected domain records.
- **Responsibilities:** durable history and authorized inspection.
- **Prohibited:** silent deletion or mutation of prior events.

### Reporting

- **Purpose:** provide derived operational and management understanding.
- **Key concepts:** projection, branch scope, combined management view.
- **Invariants:** all facts derive from canonical transactions; cross-branch views are explicit and authorized.
- **Relationships:** reads transactions, audit state, and ledger projections.
- **Responsibilities:** totals, summaries, exports, and analytics.
- **Prohibited:** independent writes or implicit branch mixing.

## Canonical transaction concept

A canonical transaction conceptually contains:

- stable ID;
- branch ID;
- patient HN;
- patient display-name snapshot;
- transaction date;
- transaction type;
- lifecycle status (`draft`, `posted`, `corrected`, or `voided`);
- details or line items;
- payment allocations;
- entitlement references;
- creator;
- timestamps;
- correction or void trace.

This list defines meaning, not final database fields.

Money is integer satang and never floating point. Canonical facts are stored; derived balances, sequences, and remainders are calculated and never manually entered. Posted history is corrected or voided through traceable records, not silently overwritten.

## Shared Member relationships

The conceptual relationship is:

```text
Patient (owner) ──owns──> Member Account
Member Account ──authorizes──> Patient (authorized user)
Canonical Transaction ──uses balance from──> Member Account
Canonical Transaction ──serves──> Patient (actual recipient)
Canonical Transaction ──may identify──> Patient or party (payer)
```

Owner, authorized user, actual recipient, payer, and balance source are separate roles even when one person fills several of them.
