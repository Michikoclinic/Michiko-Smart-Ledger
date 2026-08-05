# Michiko Smart Ledger — Narrative Engine

**Status:** Authoritative narrative specification

## 1. Purpose

The Narrative Engine converts validated canonical transactions and linked sources into Human narrative for the Daily Ledger. It enables reception and accounting staff to understand what happened without navigating unrelated records.

Human narrative is more than friendly terminology: it is a complete natural Thai explanation. Every usage has a story that identifies where the entitlement came from, what was used, what remains, and who was involved.

## 2. Input and output contract

The Engine receives validated Domain data. It returns a structured model containing, where applicable:

- `title`;
- `lines`;
- `labels`;
- `emphasisTokens`;
- `sourceReferences`;
- `warnings`;
- `wordingVersion`.

Canonical facts and source relationships remain the source of truth. Output is deterministic and version-aware. The system must not persist only a manually editable concatenated string as narrative truth.

## 3. Responsibility boundaries

The Narrative Engine:

- applies approved Thai wording;
- assembles stories for Course, Package, Deposit, Member, promotion, payment, and outstanding-balance events;
- exposes direct source references for audit;
- reports warnings when validated input is incomplete for a required story;
- supplies consistent structured meaning to screen, PDF, print, and copyable-summary renderers.

It does not:

- own balances or remaining quantities;
- calculate payment totals independently;
- guess missing facts;
- contain HTML, CSS, PDF, or print layout;
- decide typography, spacing, pagination, or column layout;
- treat user-edited prose as canonical business truth.

Renderers decide visual layout while preserving the Engine's meaning and intentional line structure.

## 4. Wording versioning

Every produced narrative identifies its wording version. A wording revision may improve clarity for future rendering without mutating historical transactions. Audit and historical reproduction must retain enough information to explain which wording rules were applied.

## 5. Source references and warnings

Course, Package, Deposit, and Member usage includes a machine-resolvable direct reference to the source transaction or entitlement entry. The visible wording may remain calm, while authorized audit views can follow that reference.

If required validated facts are absent, the Engine returns a warning instead of inventing a date, value, owner, sequence, or remainder. Confirmation must be blocked when the missing fact violates a Domain invariant.

## 6. Approved Thai examples

### Buying a Course

```text
ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท
```

### Using a Course purchased earlier

```text
ใช้ Dual Yellow ครั้งที่ 2/5
จากคอร์ส 5 ครั้ง ราคา 28,000 บาท
ซื้อวันที่ 15 มิ.ย. 2569
เหลือ 3 ครั้ง
```

### Buying and using a Course on the same day

```text
ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท
ใช้ครั้งที่ 2/5
เหลือ 3 ครั้ง
```

The Domain supplies source purchase, purchase date, total sessions, usage sequence, and remainder. The Engine formats those facts.

### Using a Deposit

```text
ใช้มัดจำ 3,000 บาท
จากมัดจำวันที่ 15 ก.ค. 2569
มัดจำเดิม 5,000 บาท
เหลือ 2,000 บาท
```

### Fully consuming a Deposit

```text
ใช้มัดจำ 5,000 บาท
จากมัดจำวันที่ 15 ก.ค. 2569
ใช้ครบแล้ว
```

### Using a Member

```text
ใช้ Member 8,000 บาท
ยอดก่อนใช้ 50,000 บาท
เหลือ 42,000 บาท
```

### Using a Shared Member

```text
คุณบีใช้ Member 8,000 บาท
จาก Member ของคุณเอ
ยอดก่อนใช้ 50,000 บาท
เหลือ 42,000 บาท
```

## 7. Wording requiring confirmation

The following patterns are illustrative only and require clinic approval before becoming final wording rules.

### Outstanding balance — requires confirmation

```text
ค้างชำระ 3,000 บาท
จากยอดบริการวันนี้
```

Confirmation is required for partial settlement, later settlement, and whether a due date appears.

### Promotion — requires confirmation

```text
ได้รับโปรโมชั่น [ชื่อโปรโมชั่น]
[สิทธิที่ได้รับ]
```

Confirmation is required for stacking, expiry, monetary display, and source campaign wording.

### Gift — requires confirmation

```text
ได้รับของขวัญ [รายการ]
จาก [แหล่งที่มา]
```

Confirmation is required for eligibility, quantity, source, and whether gifts create an entitlement account.

## 8. Narrative quality rules

- Prefer complete Thai explanations over technical codes.
- Preserve intentional line breaks and reading order.
- Do not omit source facts merely to make a row shorter.
- Use Buddhist Era display dates only after the clinic convention is approved; canonical dates remain unambiguous.
- Keep product language consistent: Human narrative, Every usage has a story, Narrative Engine, Member, Shared Member, Course, Package, and Deposit.
