# Michiko Smart Ledger — Project Foundation

**Version:** 1.0  
**Status:** Primary authoritative charter  
**Theme:** Michiko Blossom  
**Date:** 1 August 2026

## 1. Project identity

Michiko Smart Ledger is a Digital Daily Ledger for an aesthetic clinic. It preserves the readability, workflow, and storytelling character of the handwritten book used by reception while adding automation, consistency, and auditability.

It is not accounting software, bookkeeping software, an ERP, a general ledger, an inventory system, or a tax platform.

## 2. Mission

Replace the handwritten daily book without losing the feeling of writing in a beautiful ledger. Reception should experience a calm, readable operational record—not a dense accounting interface or dashboard.

## 3. Product boundaries

The product records clinic transactions within a branch, explains them through natural Thai wording, reconciles payment methods, and traces entitlement usage to its source. Daily Ledger views, exports, patient history, management views, and analytics are derived from the same canonical transactions.

The product must not identify patients by name, maintain independent report facts, expose technical consumption labels, or ask users to enter information it can derive.

## 4. Core philosophy

The Daily Ledger is the product's organizing experience. Its implementation prioritizes readability, Human narrative, payment reconciliation, branch separation, source traceability, and comfortable reception use. Supporting capabilities exist to create, review, audit, and understand the Daily Ledger.

## 5. Non-negotiable principles

1. **One transaction is the source of truth.** Reports and ledger views are projections from canonical transactions, never separate write models.
2. **The ledger is the product.** The Daily Ledger is the main user experience, not a secondary report. A technically correct system with a difficult-to-read ledger is incorrect.
3. **Branch first.** Every transaction belongs to exactly one branch, and normal operational ledgers and totals remain separate by branch.
4. **HN first.** HN is the permanent patient identity. Names and nicknames are display information only.
5. **Human narrative.** The system writes complete, natural Thai explanations that reception and accounting staff can understand without opening unrelated records.
6. **Every usage has a story.** Course, Package, Deposit, and Member usage identifies its source, original facts, amount used, remainder, people involved, and audit reference.
7. **Readable before measurable.** Details must make sense to people before they serve analytics. Payment columns reconcile the story but do not replace it.
8. **The system calculates what it knows.** Users never type derived balances, sequences, source references, remaining quantities, or New status.
9. **Blank means no value.** Unused payment cells remain blank and never display `0` or `-`.
10. **Audit without clutter.** The system preserves actor, action, time, and reason without making the Daily Ledger bureaucratic.

## 6. High-level architecture

Michiko Smart Ledger uses a modular monolith with a relational database.

```text
Browser / iPad
      │
      ▼
Web application
  ├─ Presentation
  ├─ Application
  ├─ Domain
  └─ Infrastructure
      │
      ▼
Relational database
  ├─ source-of-truth records
  ├─ immutable audit events
  └─ derived/read projections
```

## 7. Domain ownership

The Domain layer owns invariants, calculations, entitlement rules, HN rules, branch rules, new-patient rules, and narrative composition rules. The Application layer orchestrates use cases and transactions but does not recreate Domain rules. Presentation code, repositories, database adapters, and export templates do not own core business rules. There is no separate duplicated “business rules” technical layer.

## 8. Document authority

This charter is the primary authority for product identity, principles, architecture shape, and rule ownership. The other documents in this set provide authoritative detail within their named topics:

- [Business Rules](02_BUSINESS_RULES.md)
- [Domain Model](03_DOMAIN_MODEL.md)
- [Narrative Engine](04_NARRATIVE_ENGINE.md)
- [Database Guide](05_DATABASE_GUIDE.md)
- [Design System](06_DESIGN_SYSTEM.md)
- [Development Roadmap](07_DEVELOPMENT_ROADMAP.md)

If documents conflict, work stops until the conflict is resolved. Amendments must be deliberate, reviewed by the relevant clinic and engineering stakeholders, and applied to every affected document before implementation proceeds.
