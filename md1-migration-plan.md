# MD1 Migration Plan
> Generated from codebase audit. Phase 0 output — awaiting approval before any code changes.

---

## List A — Element Plus Components to Theme via CSS Variables

These stay as Element Plus components. Styling happens exclusively through
`element-plus-md1-overrides.scss` (Phase 1). No structural changes to call sites.

| Component | Files | MD1 treatment |
|---|---|---|
| `el-button` | AppHeader, TicketAttachments, ChangePassword, CreateTicket, KB, Login, TicketDetail, Tickets, UserMgmt | Raised (z2 shadow), 2px radius, uppercase Roboto 500, MD1 ripple via directive |
| `el-input` | ChangePassword, CreateTicket, KB, Login, TicketDetail, Tickets, UserMgmt | Underline-only (transparent bg, bottom border), floating label style |
| `el-select` | CreateTicket, KB, Reports, TicketDetail, Tickets, UserMgmt | Underline-only, same as input |
| `el-form` / `el-form-item` | ChangePassword, CreateTicket, KB, Login, UserMgmt | Label color → `--md1-text-secondary`, spacing → 8dp grid |
| `el-table` / `el-table-column` | Dashboard, Reports, Tickets, UserMgmt | Header 12px/500/uppercase, row height 48dp, divider `rgba(0,0,0,0.12)` |
| `el-dialog` | KB, Tickets, UserMgmt | z24 shadow, 0 radius on mobile / 2px on desktop, MD1 enter animation |
| `el-dropdown` / `el-dropdown-menu` | AppHeader, PortalLayout | z8 shadow, 2px radius, 48dp row height |
| `el-checkbox` | Login, TicketDetail | Primary color tick, `rgba(0,0,0,0.54)` border off-state |
| `el-radio` / `el-radio-group` | Tickets | Primary color fill |
| `el-switch` | UserMgmt | Primary color track + thumb |
| `el-pagination` | Tickets | Flat text buttons, primary color active page |
| `el-popconfirm` | TicketAttachments, KB, TicketDetail, UserMgmt | z8 shadow, flat action buttons |
| `el-alert` | TicketAttachments, ChangePassword, CreateTicket, KB, Login, UserMgmt | Left-border style, semantic colors |
| `el-tag` | UserMgmt | Chip style, 32dp height, 2px radius |
| `el-skeleton` | TicketDetail | Grey-200/300 shimmer |
| `el-progress` | Reports | Primary color bar, 4dp height |
| `el-empty` | KB, Reports | Secondary text color |
| `el-result` | TicketDetail | Semantic icon colors |

---

## List B — Surfaces to Replace with Custom MDL Components

These are high-impact structural surfaces where Element Plus doesn't exist or
produces the wrong skeleton. Replace with custom Vue 3 SFCs in `src/components/md1/`.
**One component per review cycle before continuing.**

### B1 — `Md1AppBar.vue` (replaces `AppHeader.vue`)
- **What it is:** The navy top bar with logo, page title, New Ticket CTA, user dropdown.
- **Why replace:** AppHeader is already a fully custom component — not an El-Plus wrapper.
  Rebuild it to exactly match MDL `layout/_layout.scss` app bar: z4 shadow, 56dp mobile /
  64dp desktop height, 0 border-radius, title in Roboto Title scale (20px/500),
  correct keyline spacing (16dp mobile, 40dp desktop indent).
- **Prop parity:** keep `pageTitle` computed, user chip, New Ticket slot.

### B2 — `Md1NavDrawer.vue` (replaces `AppSidebar.vue`)
- **What it is:** The collapsible left sidebar (57px collapsed → 240px hover).
- **Why replace:** AppSidebar is fully custom. Rebuild to MDL drawer spec:
  grey-50 background, z16 shadow when open, 240dp width, nav item 48dp height,
  active item left-border accent + grey-300 background, ripple on each item.
- **Prop parity:** keep role-filtered nav items array, active route detection.

### B3 — `Md1StatCard.vue` (replaces inline stat cards in `DashboardView.vue`)
- **What it is:** The 5 KPI cards (Open, In Progress, On Hold, Overdue, Resolved Today).
- **Why replace:** These are inline `<div>` blocks with bespoke styles — no El-Plus.
  Rebuild as a proper MDL card: white surface, z2 shadow, 2px radius, 16dp padding,
  correct type scale for number (Display 1 34px/400) and label (Caption 12px/400).
- **Prop parity:** `label`, `value`, `color` (left-border accent), `@click`.

### B4 — `Md1Card.vue` (general card shell used across the app)
- **What it is:** The white card container used for chart cards, detail sidebar panels,
  article cards, etc.
- **Why replace:** Multiple components roll their own card div with slightly inconsistent
  shadows and radii. One token-driven wrapper fixes all of them.
- **Props:** `elevation` (2 | 3 | 4 | 6 | 8, maps to shadow token), `padding` (boolean).

---

## List C — Leave Alone

| Surface | Reason |
|---|---|
| **KbEditor.vue** + **ResizableImageView.vue** | Tiptap/ProseMirror — per hard rules, no changes to editor DOM or ProseMirror config |
| **ApexCharts** blocks in DashboardView, ReportsView | Phase 3 color-token update only — no structural changes |
| **PortalKnowledgeBaseView** A4 paper viewer | Recently rebuilt; only color tokens updated in Phase 1 |
| **Backend** (Express, Prisma, routes) | Visual layer only |
| **Pinia stores, Vue Router, API client** | Visual layer only |

---

## Phase Sequence (after approval)

```
Phase 0  ← YOU ARE HERE (tokens + plan, no code)
Phase 1  → element-plus-md1-overrides.scss + v-md1-ripple directive
Phase 2a → Md1AppBar.vue  (review)
Phase 2b → Md1NavDrawer.vue  (review)
Phase 2c → Md1StatCard.vue  (review)
Phase 2d → Md1Card.vue  (review)
Phase 3  → ApexCharts color-token sync
```

---

## Color Palette Proposal — Confirm Before Phase 1

| Role | MDL ramp | Brand override | Hex |
|---|---|---|---|
| Primary | Blue | Custom (darker than Blue 900 #0D47A1) | `#002d72` |
| Primary dark | — | Custom | `#001d4a` |
| Accent | Deep Orange | Custom (≈ between A200 #FF6E40 and A400 #FF3D00) | `#fd6300` |
| Accent dark | — | Custom | `#cc5000` |
| Success | Green | Green 500 | `#4CAF50` |
| Warning | Amber | Amber 700 | `#FFA000` |
| Error | Red | Red A700 | `#D50000` |
| Info | Blue Grey | Blue Grey 600 | `#546E7A` |

**Question for you:** The brand navy `#002d72` and orange `#fd6300` are both outside
MDL's standard palette ramps. I've mapped them onto the Blue and Deep Orange ramps
structurally (using those ramps for light/tint variants) but the 500-level brand colors
are custom. Do you want to:
- **A)** Keep brand colors as-is (recommended — they're already established)
- **B)** Snap to the nearest MDL palette stop (Blue 900 `#0D47A1` + Deep Orange A400 `#FF3D00`)
