# Michiko Smart Ledger — Design System

**Official visual identity:** Michiko Blossom

## 1. Product feeling

Michiko Blossom is soft, premium, calm, friendly, minimal, Apple-inspired, appropriate for a modern aesthetic clinic, and comfortable on iPad.

Avoid corporate ERP appearance, dense dashboards, dark heavy colors, strong red/blue/green surfaces, unnecessary decoration, and excessive icons.

## 2. Experience principles

- **Ledger first:** the Daily Ledger is the primary workspace, not a dashboard.
- **Calm hierarchy:** generous whitespace, quiet borders, neutral surfaces, and restrained color establish reading order.
- **Narrative details:** the Details column is visually dominant and preserves intentional line breaks.
- **Fast reception use:** large touch targets, predictable input flow, minimal required input, and clear feedback support repetitive work.
- **Progressive disclosure:** show source story, provenance, and audit detail when useful without crowding the Daily Ledger.
- **Accessible by default:** support keyboard use, visible focus, semantic structure, sufficient contrast, and meaning beyond color.

## 3. Color system

### Foundation tokens

| Token | Value | Use |
|---|---|---|
| `color-bg` | `#FCFBF8` | Warm page background |
| `color-surface` | `#FFFFFF` | Main working surface |
| `color-surface-secondary` | `#F6F7F9` | Quiet grouped surface |
| `color-border` | `#E8E8EC` | Dividers and outlines |
| `color-text` | `#2E3138` | Primary text |
| `color-text-secondary` | `#707682` | Supporting text |
| `color-pink` | `#EFCFD6` | Signature soft accent |
| `color-mint` | `#D8EEE5` | Gentle positive/category accent |
| `color-lavender` | `#DDD8F3` | Secondary category accent |
| `color-blue` | `#D8E8F6` | Informational background accent |
| `color-peach` | `#F7E2D4` | Warm category accent |
| `color-cream` | `#FFF1D9` | Warm highlight surface |
| `color-yellow` | `#F7EDB5` | Attention background |

### Color usage

- Most of the interface remains neutral white or warm off-white.
- Pastels indicate selection, category, or gentle status and are not general body-text colors.
- Do not assign business meaning to color alone.
- Semantic foreground/background pairs must meet WCAG AA contrast.
- Define dedicated success, warning, danger, info, focus, and interactive colors during implementation rather than treating decorative pastels as automatically accessible.
- Strong red is reserved for genuinely destructive or critical states and used sparingly.

## 4. Typography

Use a Thai-capable system-first sans-serif stack:

```css
font-family: "Noto Sans Thai", "Thonburi", "Leelawadee UI", system-ui,
  -apple-system, "Segoe UI", sans-serif;
```

Noto Sans Thai may become the controlled web font after licensing, privacy, and performance review. Use tabular numerals in monetary columns, preserve Thai narrative line breaks, and never depend on uppercase for hierarchy.

| Token | Size / line height | Weight | Use |
|---|---:|---:|---|
| `display` | 32 / 42 px | 600 | Rare page identity |
| `title` | 24 / 34 px | 600 | Page title |
| `section` | 18 / 28 px | 600 | Section heading |
| `body` | 16 / 26 px | 400 | Default UI and narrative |
| `body-strong` | 16 / 26 px | 600 | Important story line |
| `small` | 14 / 22 px | 400 | Supporting metadata |
| `label` | 13 / 20 px | 600 | Controls and column labels |

Operational content is never smaller than 13px.

## 5. Spacing, radius, and shadows

Use a 4px spacing grid:

| Token | Value |
|---|---:|
| `space-0` | 0 |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

| Token | Value |
|---|---|
| `radius-sm` | 8px |
| `radius-md` | 12px |
| `radius-lg` | 16px |
| `radius-xl` | 24px |
| `shadow-sm` | `0 1px 2px rgb(46 49 56 / 0.05)` |
| `shadow-md` | `0 8px 24px rgb(46 49 56 / 0.08)` |

## 6. Daily Ledger

- Resemble a refined paper ledger rather than a dashboard table.
- Keep the Details column visually dominant.
- Preserve separate Cash, SCB, LP, Credit Card, Member, Deposit, and Outstanding columns.
- Keep cells blank when no payment allocation exists.
- Do not show a visible time column.
- Use minimal chrome, restrained headers, comfortable rows, and soft horizontal separation.
- On narrow screens, allow payment columns to scroll horizontally.
- Keep HN, Patient, and Details visible as much as possible.
- Do not compress Human narrative into codes to gain density.

## 7. Tables

- Use quiet headers and subtle separators rather than heavy grids.
- Align money consistently and use tabular numerals.
- Support multiline Details without truncating the story by default.
- Provide visible row focus and selection that does not rely on color alone.
- Empty states explain what will appear without inserting placeholder ledger rows.

## 8. Inputs

- Default frequently used inputs to approximately 48px height.
- Use persistent, human labels; placeholders do not replace labels.
- Show calculated values as read-only context rather than editable inputs.
- Keep validation messages next to the relevant control and describe how to recover.
- Use patient lookup centered on HN, with name or nickname as supporting text.

## 9. Buttons

- Distinguish one primary action from secondary and quiet actions.
- Use concise Thai action labels appropriate to reception.
- Destructive actions state their consequence, require confirmation, and request a reason where Domain rules require it.
- Disabled buttons expose a reason in nearby text when the next action is not obvious.
- Avoid icon-only controls for important actions.

## 10. Status badges

- Use badges for concise status such as New, Draft, Posted, Corrected, or Voided.
- Pair color with text and, where useful, shape or icon.
- Keep pastel fills quiet and foreground contrast accessible.
- Do not use badges as a substitute for a full warning or narrative explanation.

## 11. Focus and accessibility

- Interactive elements have a clearly visible focus indicator.
- All routine workflows are keyboard operable.
- Touch targets are at least 44×44px; frequently used reception controls should be 48px high.
- Reading and focus order follow visual order.
- Labels and errors are programmatically associated with controls.
- Text and essential icons meet contrast requirements.
- Motion respects reduced-motion preferences.
- Screen-reader names describe actions and values without exposing internal codes.

## 12. Print-safe behavior

- Printed Daily Ledgers preserve HN, Patient, Details, payment columns, branch, and date context.
- White backgrounds and dark text remain legible without color printing.
- Pastel meaning is supplemented by text.
- Page breaks avoid separating a patient's narrative lines where practical.
- Repeated page headers identify branch and ledger date.
- Print, PDF, screen, and copyable summaries render the same structured Narrative Engine meaning.

No UI code or component implementation is defined by this document.
