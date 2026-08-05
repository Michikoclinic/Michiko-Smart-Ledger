# Michiko Smart Ledger — Business Rules

**Status:** Authoritative clinic rules

This document defines clinic-specific operational behavior. Conceptual ownership belongs to the Domain layer; database and UI structures do not redefine these rules.

## 1. Branch rules

- Every canonical transaction belongs to exactly one branch.
- Paholyothin 21 and EmSphere have separate Daily Ledgers and separate totals.
- Operational ledger rows and totals are never mixed across branches.
- Normal users work inside one active branch context.
- A known active branch is not selected repeatedly during routine work.
- Combined reporting may be added later for authorized management only and must be an explicit mode.
- A posted transaction's branch is not silently changed.

## 2. HN rules

HN format is `Prefix + Global Running Number`.

Examples: `M1234`, `EM1235`, `M1236`, `EM1237`.

- `M` means the HN was opened at Paholyothin 21.
- `EM` means the HN was opened at EmSphere.
- The numeric sequence is global across both branches and never repeats.
- Separate running sequences by branch are forbidden.
- HN allocation is automatic and concurrency-safe.
- HN is mandatory for every confirmed Daily Ledger entry.
- Names may vary or be receipt nicknames, but HN remains the identity key.
- A patient name is never used as an identity key.

## 3. New-patient rules

At the beginning of each calendar month, record the previous month's final global running number as the monthly baseline.

If the previous month's final number is `1235`, then `EM1236`, `M1237`, and `EM1238` are New for that month.

- Compare only the parsed numeric portion of HN with the monthly baseline.
- Never compare the complete HN as plain text.
- The prefix records the registration branch but does not alter the global New calculation.
- Users never manually mark a patient as New.
- Historical status uses the baseline for the transaction month.
- The same HN is counted once in monthly New totals, regardless of transaction count or branch visits.

## 4. Transaction rules

- A canonical transaction is the only write source for Daily Ledger rows, reports, exports, and totals.
- A transaction belongs to one branch and one patient HN.
- Drafts may be edited; posted history is not silently overwritten.
- Payment allocations and entitlement entries must remain linked to their source transaction.
- Derived facts are calculated from canonical facts rather than re-entered by users.
- Duplicate submissions must be prevented through idempotent processing.

## 5. Payment rules

- Supported Daily Ledger payment categories are Cash, SCB, LP, Credit Card, Member, Deposit, and Outstanding.
- Each payment method appears in a separate reconciliation column.
- Allocations must reconcile with the payable amount for the transaction type.
- Missing allocations render as blank cells, never `0` or `-`.
- Money is exact and stored conceptually as integer satang, never floating point.
- Thai display formatting uses grouping separators and no unnecessary decimals.

## 6. Daily Ledger rules

The Daily Ledger resembles the clinic's handwritten ledger and remains the primary product experience.

Visible output rules:

- Visible time is not required; timestamps may remain stored for audit.
- HN is mandatory for every confirmed entry.
- Patient may show the real name or nickname printed on the payment receipt.
- HN remains the identity key.
- Details are the main explanatory area and use natural Thai.
- Payment methods use separate columns.
- Empty payment cells remain blank; zero and dash placeholders are forbidden.
- Details explain purchases, usage, deposits, Member activity, outstanding balances, gifts, and promotions.
- Each branch has separate Daily Ledger rows and totals.
- Normal operational views never combine branch totals.

Recommended information is HN, Patient, Details, Cash, SCB, LP, Credit Card, Member, Deposit, Outstanding, and Remarks. This is a presentation recommendation, not a database schema.

## 7. Course rules

Approved purchase and use wording:

```text
ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท
ใช้ครั้งที่ 2/5
เหลือ 3 ครั้ง
```

Approved wording for an earlier purchase:

```text
ใช้ Dual Yellow ครั้งที่ 2/5
จากคอร์ส 5 ครั้ง ราคา 28,000 บาท
ซื้อวันที่ 15 มิ.ย. 2569
เหลือ 3 ครั้ง
```

The system derives the source purchase, purchase date, total sessions, usage sequence, and remaining sessions. Users do not type these references.

## 8. Package rules

- Package usage follows the same source-reference principle as Course usage.
- Every use identifies the source Package, original quantity or entitlement, usage sequence when applicable, remaining quantity, and source purchase date.
- Package usage is represented by domain facts and relationships, not free text.
- Users do not enter derived source or remainder information.

## 9. Deposit rules

Approved partial-use wording:

```text
ใช้มัดจำ 3,000 บาท
จากมัดจำวันที่ 15 ก.ค. 2569
มัดจำเดิม 5,000 บาท
เหลือ 2,000 บาท
```

Approved complete-use wording:

```text
ใช้มัดจำ 5,000 บาท
จากมัดจำวันที่ 15 ก.ค. 2569
ใช้ครบแล้ว
```

- The original Deposit date is retrieved automatically.
- Usage always references the selected source Deposit.
- If several Deposits exist, source selection is explicit and auditable.
- Users do not type the source date.
- Remaining Deposit value is calculated atomically with usage.

## 10. Member rules

Every Member use identifies the Member account, owner, actual service recipient, amount used, balance before, balance after, and source relationship.

Approved simple wording:

```text
ใช้ Member 8,000 บาท
ยอดก่อนใช้ 50,000 บาท
เหลือ 42,000 บาท
```

Member balances are owned by the entitlement domain, not the Narrative Engine or renderer.

## 11. Shared Member rules

A Member has exactly one owner and may be shared with authorized patients. The domain distinguishes Member owner, authorized user, actual service recipient, payer when relevant, and Member account used as the balance source.

Approved wording:

```text
คุณบีใช้ Member 8,000 บาท
จาก Member ของคุณเอ
ยอดก่อนใช้ 50,000 บาท
เหลือ 42,000 บาท
```

- Shared Member is modeled as domain relationships, never solely as notes or free text.
- One patient may be authorized for more than one Member account.
- If exactly one authorized account is available, the system may suggest it.
- If several accounts are available, the user selects the source before confirmation.
- Past choices may inform a suggestion but must never silently lock selection.

## 12. Correction and void rules

- Posted business history is never erased or silently replaced.
- A correction or void retains the original transaction, actor, timestamp, reason, and trace to the resulting state.
- Authorization for backdating, correction, and voiding must be explicit.
- Current views are derived from the complete history.

## 13. Audit rules

- Audit events are append-only.
- Sign-in, create, post, correct, void, export, and privileged configuration actions are auditable.
- Every usage provides a direct reference to its source for audit.
- Exports containing patient data require authorization and an audit record.
- Audit detail remains available without crowding the normal Daily Ledger view.

## 14. Rules requiring confirmation

The following are unresolved and must be approved before their related implementation begins:

- whether HNs may be merged or corrected, and by whom;
- clinic timezone and business-day closing boundary;
- Course and Package expiry, transfer, refund, and cancellation behavior;
- Member and Deposit eligibility, stacking, refund, and expiration behavior;
- treatment of card surcharges or other fees;
- permissions for backdating, correction, voiding, export, and cross-branch access;
- legal retention and patient privacy requirements;
- final Thai wording and Buddhist Era date conventions;
- final wording for outstanding balances, promotions, and gifts.
