---
name: "Master Lead Coupon · Real Estate Sales Call CRM"
description: "Jet-age perforated ticket wallet and carbon-copy dispatch dossier for sub-10-second real estate call logging, duplicate phone verification, and overdue follow-up dispatch."
colors:
  carrier-navy: "#0f2541"
  carrier-navy-deep: "#0d1b3d"
  jet-red: "#c61920"
  jet-red-dark: "#9b2429"
  carbon-purple: "#382866"
  carbon-tissue: "#dcd3ec"
  carbon-tissue-light: "#eae4f4"
  carbon-rule: "#291e3b"
  verified-emerald: "#4d7c65"
  mint-accent: "#72a692"
  coupon-white: "#ffffff"
  stock-white: "#f6f6f1"
  cell-cream: "#f2f2ea"
  ink-black: "#0b0b0c"
typography:
  display:
    fontFamily: "'Barlow Condensed', sans-serif"
    fontSize: "clamp(2.25rem, 8.55cqw, 4.1rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.01em"
  headline:
    fontFamily: "'Barlow Condensed', sans-serif"
    fontSize: "clamp(1.35rem, 5.55cqw, 2.5rem)"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "0.01em"
  title:
    fontFamily: "'Barlow Condensed', sans-serif"
    fontSize: "clamp(1.1rem, 3.7cqw, 1.45rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.05em"
  body:
    fontFamily: "'IBM Plex Mono', monospace"
    fontSize: "0.9rem"
    fontWeight: 500
    lineHeight: 1.32
    letterSpacing: "0.005em"
  label:
    fontFamily: "'Barlow Condensed', sans-serif"
    fontSize: "0.85rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  pill-sm: "4px"
  coupon-sm: "6px"
  coupon-md: "8px"
  sheet-lg: "10px"
  pill-full: "999px"
  cqw-xs: "0.75cqw"
  cqw-sm: "0.85cqw"
  cqw-md: "0.9cqw"
  cqw-lg: "1.1cqw"
  cqw-xl: "1.2cqw"
  cqw-2xl: "1.4cqw"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "24px"
components:
  button-ticket-call:
    backgroundColor: "{colors.carrier-navy}"
    textColor: "{colors.coupon-white}"
    typography: "{typography.headline}"
    rounded: "{rounded.coupon-sm}"
    padding: "10px 12px"
  button-ticket-whatsapp:
    backgroundColor: "{colors.carbon-purple}"
    textColor: "{colors.coupon-white}"
    typography: "{typography.headline}"
    rounded: "{rounded.coupon-sm}"
    padding: "10px 12px"
  button-ticket-log:
    backgroundColor: "{colors.jet-red}"
    textColor: "{colors.coupon-white}"
    typography: "{typography.headline}"
    rounded: "{rounded.coupon-sm}"
    padding: "10px 12px"
  button-stamp-submit:
    backgroundColor: "{colors.jet-red}"
    textColor: "{colors.coupon-white}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  button-stamp-submit-hover:
    backgroundColor: "{colors.jet-red-dark}"
  chip-status:
    backgroundColor: "{colors.coupon-white}"
    textColor: "{colors.ink-black}"
    typography: "{typography.label}"
    rounded: "{rounded.pill-sm}"
    padding: "4px 8px"
  chip-status-active:
    backgroundColor: "{colors.jet-red}"
    textColor: "{colors.coupon-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill-sm}"
    padding: "4px 8px"
  input-coupon:
    backgroundColor: "{colors.coupon-white}"
    textColor: "{colors.ink-black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  card-master-coupon:
    backgroundColor: "{colors.coupon-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.sheet-lg}"
    padding: "16px"
  card-carbon-voucher:
    backgroundColor: "{colors.carbon-tissue-light}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: Master Lead Coupon · Real Estate Sales Call CRM

## Overview

**Creative North Star: "The Jet-Age Coupon Dossier"**

Every real estate lead is treated as a perforated Master Lead Coupon inside a 1960s airline ticket wallet and telephone dispatch dossier. Rather than burying outbound sales calls, duplicate-phone checks, and follow-up schedules behind generic SaaS cards or modal dialogs, the system stamps every interaction directly onto numbered flight-leg stubs (`CALL LEG #04`, `#03`, `#02`), hairline-ruled specification cells, and carbon-copy lavender accounting vouchers.

Built for high-velocity mobile and desk calling sessions, the visual language pairs high-impact condensed grotesque headers (`Barlow Condensed`) with strict tabular monospace telemetry (`IBM Plex Mono`) for phone numbers, budgets, and timestamps. Tactile paper engineering—scalloped side perforations, chamfered folder tab caps, security dot-matrix halftone headers, and diagonal void-red hatching strips—turns urgency and data integrity into immediate physical cues.

**Key Characteristics:**
- **Perforated Ticket Mechanics:** Scalloped radial punch-outs along coupon edges, dotted tear-off barcode stubs, and octagonal chamfered corners (`clip-path: polygon(...)`) replace soft modern containers.
- **Tri-Ink Ephemera Palette:** Deep Carrier Navy (`#0f2541`), urgent Void/Jet Red (`#c61920`), and Carbon-Copy Purple (`#382866`) printed against warm archival paper stocks (`#f6f6f1`, `#f2f2ea`, `#eae4f4`).
- **Two-Voice Typographic Authority:** All-caps `Barlow Condensed` (600–800 weight) for rapid visual scanning paired with `IBM Plex Mono` (`tabular-nums`) for phone normalization, budgets, and timestamped call legs.
- **Zero-Modal Inline Operations Deck:** Every action—switching overdue leads, filtering the directory, checking duplicate phone numbers, editing WhatsApp templates, and logging a call in under 10 seconds—lives inline on the dossier surface.

## Colors

The palette emulates multi-part airline passenger coupons, rotary-stamped ink impressions, and lavender carbon-copy tissue sheets against warm unbleached card stock.

### Primary
- **Carrier Navy** (`#0f2541`): Primary structural authority ink used for the Master Lead Coupon header bar, `CALL TEL:` perforated action ticket, dispatch wallet headers, priority queue rank stubs, and custom scrollbars.
- **Carrier Navy Deep** (`#0d1b3d`): Deepened ink tone used for high-contrast lead titles and dense structural borders.
- **Jet Red** (`#c61920`): High-urgency dispatch ink reserved for the top full-bleed overdue alert strip, active lead status stamps, `+ LOG CALL (<10S)` perforated trigger, overdue queue priority stubs, and primary stamp submit buttons.
- **Jet Red Dark** (`#9b2429`): Structural bottom border and active press tone for Jet Red alert bars and buttons.

### Secondary
- **Carbon Purple** (`#382866`): Secondary transactional ink used for the `WHATSAPP (EDIT MSG)` perforated ticket, Carbon-Copy Voucher header and tabs, selected call-outcome stamps, and secondary status tags.
- **Carbon Tissue** (`#dcd3ec`): Mid-tone lavender carbon paper fill used on the barcode voucher footer strip.
- **Carbon Tissue Light** (`#eae4f4`): Pale lavender carbon-copy voucher background surface for the inline sub-10-second call logger and WhatsApp template editor.
- **Carbon Rule** (`#291e3b`): Deep violet-charcoal ink used for 1px hairline specification grid borders, call-leg header rules, and form field strokes.

### Tertiary
- **Verified Emerald** (`#4d7c65`): Rotary validation stamp ink used exclusively for the angled `VERIFIED · NO DUPLICATE` phone integrity badge and confirmation notices.
- **Mint Accent** (`#72a692`): High-visibility secondary subtitle tint (`(EDIT MSG)`) inside the dark Carbon Purple WhatsApp action coupon.

### Neutral
- **Coupon White** (`#ffffff`): Crisp bleached top-sheet paper stock for the Master Lead Coupon backing card, numbered Call Leg barcode cards, and form inputs.
- **Stock White** (`#f6f6f1`): Warm archival wallet canvas backing the entire viewport and punching through scalloped ticket edge cutouts.
- **Cell Cream** (`#f2f2ea`): Tinted newsprint/manila cell fill for the 2×3 hairline-ruled specification grid (`SOURCE`, `REQ`, `TYPE`, `AREA`, `BUDGET`, `ADDED`) and queue action docks.
- **Ink Black** (`#0b0b0c`): Dense letterpress carbon black used for primary monospace phone numerals, call log prose, and barcode bars.

### Named Rules
**The Tri-Ink Separation Rule.** Carrier Navy (`#0f2541`), Carbon Purple (`#382866`), and Jet Red (`#c61920`) each own a distinct operational channel: Navy governs telephony and directory structure, Purple governs carbon-copy voucher capture and WhatsApp messaging, and Red governs overdue urgency, active status stamps, and call-leg submission. Never swap their channels.

**The Carbon Paper Contrast Rule.** Text inside tinted paper zones (`#f2f2ea`, `#eae4f4`, `#dcd3ec`) must use deep letterpress ink (`#0b0b0c` or `#291e3b`)—never mid-gray—preserving at least 10:1 contrast for field readability under bright ambient light.

## Typography

**Display & Label Font:** `Barlow Condensed` (self-hosted WOFF2 weights 500, 600, 700, 800; fallback `sans-serif`)
**Body & Telemetry Font:** `IBM Plex Mono` (self-hosted WOFF2 weights 400, 500, 600, 700; fallback `monospace`)

**Character:** Compressed, mechanical, and authoritative. `Barlow Condensed` delivers maximum uppercase character density inside narrow ticket cells and mobile viewports, while `IBM Plex Mono` ensures every digit of a `+1` or `+44` phone number, dollar/pound budget, and call-leg timestamp aligns with mechanical precision.

### Hierarchy
- **Display** (800 weight, `clamp(2.25rem, 8.55cqw, 4.1rem)`, line-height `0.9`, letter-spacing `0.01em`, uppercase): Lead Name heading (`MARCUS VANCE`) dominating the upper-left Master Lead Coupon.
- **Headline** (700 weight, `clamp(1.35rem, 5.55cqw, 2.5rem)`, line-height `0.96`, letter-spacing `0.01em`, uppercase): Primary perforated ticket action triggers (`CALL TEL:`, `WHATSAPP`, `+ LOG CALL`).
- **Title** (700 weight, `clamp(1.1rem, 3.7cqw, 1.45rem)`, line-height `1.05`, letter-spacing `0.05em`, uppercase): Coupon header bar (`MASTER LEAD COUPON · REAL ESTATE CRM`), timeline section heading, and dispatch panel headers.
- **Body** (500–700 weight, `0.9rem` / `2.95cqw`, line-height `1.32`, letter-spacing `0.005em`): `IBM Plex Mono` used for general notes, call-leg header/feedback lines, and form inputs. Phone numbers escalate to `4.1cqw` at 700 weight with `-0.025em` tracking and `font-variant-numeric: tabular-nums`.
- **Label** (600–700 weight, `0.75rem–1.05rem` / `2.65cqw`, line-height `1.0`, letter-spacing `0.03em–0.05em`, uppercase): Field captions (`LEAD NAME`, `PRIMARY PHONE`, `SOURCE:`, `AREA:`), chamfered tab caps, and 9-status selector pills.

### Named Rules
**The All-Caps Structural Label Rule.** Every ticket field caption, status pill, chamfered tab cap, and action trigger is set in uppercase `Barlow Condensed` with positive tracking (`0.025em–0.06em`). Free-text call feedback and general notes remain natural sentence case in `IBM Plex Mono` so human observations separate immediately from pre-printed form structure.

**The Tabular Telemetry Rule.** All phone numbers, call-leg numbers (`#04`), timestamps (`23 NOV 14:20`), priority queue ranks (`01`), and currency budgets must render with `font-variant-numeric: tabular-nums` in `IBM Plex Mono` or `Barlow Condensed` so vertical columns scan without jitter.

## Layout

The application uses a dual-stage architecture designed for thumb-first mobile ergonomics (`390×844`) that expands seamlessly to a `1360px` desktop operations deck:

1. **Primary Master Lead Coupon Frame (`.comp-frame`):**
   - Uses a locked aspect-ratio container (`aspect-ratio: 768 / 1376`, `container-type: inline-size`) where typography and rules scale fluidly via container query width units (`cqw`).
   - **Upper Master Lead Coupon Sheet (`top: 7.0%`, `height: 39.8%`):** Houses the chamfered Carrier Navy header bar, Lead Name display title, angled `VERIFIED · NO DUPLICATE` rotary stamp, dual monospace phone columns, 2×3 hairline-ruled specification grid (`33.4% 32.1% 34.5%`), and 9-status quick selector ribbon.
   - **Perforated Action Ticket Row (`top: 47.0%`, `height: 9.5%`):** Three equal-width (`31%`) thumb-First perforated action coupons (`CALL TEL:`, `WHATSAPP (EDIT MSG)`, `+ LOG CALL (<10S)`) spanning across the center fold.
   - **Recessed Lower Ticket Wallet Dock (`top: 56.8%`, `height: 43.0%`):** Houses the bordered `GENERAL NOTES` box and the `CALL LOG & FEEDBACK TIMELINE` stacked with newest-first barcode call-leg stubs (`14.2%` barcode stub column + `85.8%` monospace telemetry column).
2. **Inline Dispatch Wallet & Carbon-Copy Operations Deck (`.inline-dispatch-deck`):**
   - Centered container (`max-width: 1360px`, `padding: 24px 16px 56px`, `gap: 20px`).
   - Responsive split dossier grid (`.dispatch-split-grid`): single-column stack below `980px`, expanding at `@media (min-width: 980px)` to an asymmetric two-column layout (`grid-template-columns: 1.15fr 0.85fr`, `gap: 22px`).
   - Left column (`1.15fr`) holds the **Dispatch Wallet** (Today's Follow-ups priority queue, 5-dimension search/filter directory, and live duplicate-guarded lead creator). Right column (`0.85fr`) holds the **Carbon-Copy Voucher** (sub-10-second call logger, editable `wa.me` template launcher, and general notes editor).

## Elevation & Depth

This world rejects floating SaaS drop shadows and glassmorphism in favor of **flat archival paper layering and recessed docket borders**. Sheets sit tightly against the `#f6f6f1` wallet stage with crisp 1px structural rules (`#291e3b` or `#0f2541`) and whisper-light contact shadows that merely separate overlapping paper stock.

### Shadow Vocabulary
- **Master Coupon Sheet Contact** (`0 0.25cqw 0.8cqw rgba(15, 37, 65, 0.08)`): Subtle navy-tinted paper contact shadow under the primary white coupon card.
- **Call Leg Stub Contact** (`0 0.2cqw 0.5cqw rgba(15, 37, 65, 0.05)`): Minimal elevation under individual barcode call-leg cards inside the lower wallet pocket.
- **Dispatch Panel Elevation** (`0 6px 18px rgba(15, 37, 65, 0.07)`): Grounded structural contact shadow under the inline Dispatch Wallet and Carbon-Copy Voucher (`0 6px 18px rgba(56, 40, 102, 0.1)`).

### Named Rules
**The Paper-On-Paper Rule.** Depth is communicated through paper stock contrast (`#ffffff` coupon on `#f6f6f1` wallet canvas, `#f2f2ea` spec cells inside `#291e3b` rules, `#eae4f4` carbon tissue inside `#382866` borders) and physical edge perforations—never via blurred neon glows or heavy floating card shadows.

## Shapes

Form language is governed by die-cut ticket manufacturing, rotary ink stamps, and hairline accounting rules:

- **Chamfered Folder & Stamp Corners:** Top-chamfered tab polygons (`clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%, 0 10px)`) on header bars and folder tabs; 8-point octagonal chamfers (`6px` or `10px` corner cuts) on call-outcome stamp buttons and primary submit triggers.
- **Scalloped Ticket Perforations:** Repeating `radial-gradient(circle at 0 Y%, var(--stock-white) 0.7cqw, transparent 0.75cqw)` cutouts along left and right edges of the coupon header bar, the three primary action tickets, and the carbon-copy voucher.
- **Tear-Off Barcode Stubs:** Left-hand call-leg stubs (`14.2%` width) separated by a `0.42cqw dotted #c8c7cb` vertical perforation line with semicircular top and bottom notch pseudo-elements (`border-radius: 50%`) and CSS `repeating-linear-gradient` barcode bars.
- **Hairline Ruled Cells:** Zero-radius (`0px`) interior cells divided by `1px` to `0.3cqw` solid `#291e3b` carbon rules for the 2×3 specification grid, general notes header divider, and form inputs.
- **Rotary Stamp Tilt:** The `VERIFIED · NO DUPLICATE` badge is rotated `transform: rotate(-5.2deg)` with a double inset border (`box-shadow: inset 0 0 0 0.15cqw #ffffff, inset 0 0 0 0.3cqw #668f7a`) to replicate a physical hand-stamped impression.

## Components

### Buttons
The system provides three distinct button archetypes tailored to speed and hierarchy:
- **Perforated Action Tickets (`.ticket-action-btn`):** Large thumb-first cards (`border-radius: 0.9cqw`, `padding: 0.6cqw`) with 5 scalloped circular punch-outs on left and right edges. Two stacked uppercase `Barlow Condensed` lines (`5.55cqw` primary verb + `4.55cqw` protocol sub-label). Variants: `CALL TEL:` (`#0f2541` navy), `WHATSAPP (EDIT MSG)` (`#382866` purple with `#72a692` mint subtitle), and `+ LOG CALL (<10S)` (`#c61920` red with `#9b2429` border).
- **Octagonal Primary Stamp Submit (`.primary-stamp-submit`):** Full-width (`100%`), `14px` padding, `#c61920` Jet Red fill, `#ffffff` text in `1.35rem` `Barlow Condensed` (700 weight, `0.06em` letter-spacing), clipped with `10px` octagonal chamfers on all four corners.
- **Outcome Stamp Buttons (`.outcome-stamp-btn`):** 5-across grid buttons (`padding: 12px 8px`, `1px solid #291e3b`, `#ffffff` background, `6px` octagonal corner chamfers). Selected positive outcomes (`ANSWERED`, `BUSY`) invert to `#382866` Carbon Purple; negative/alert outcomes (`NO ANSWER`, `REJECTED`, `SWITCHED OFF`) invert to `#c61920` Jet Red.

### Chips & Status Pills
- **9-Status Quick Selector Pills (`.status-pill`):** Compact rectangular badges (`height: 4.35cqw`, `border: 0.3cqw solid #261838`, `border-radius: 0.85cqw`, `#ffffff` fill, `2.95cqw` `Barlow Condensed` 700 weight). The active status (`INTERESTED`, etc.) switches immediately on tap to `#c61920` Jet Red fill with `#9b2429` border and `#ffffff` text.
- **1-Tap Telemetry Preset Chips (`.quick-chip-btn`):** Monospace (`IBM Plex Mono`, `0.78rem`, 600 weight) rectangular chips (`padding: 6px 10px`, `1px solid #0f2541`, `#ffffff` fill) for appending call feedback phrases or selecting follow-up time presets (`+2 HRS`, `TOMORROW 10:00`, `IN 3 DAYS`, `NEXT WEEK`). Active chip inverts to `#0f2541` fill with `#ffffff` text.

### Cards / Containers
- **Master Lead Coupon Sheet & Spec Grid (`.master-coupon-sheet`, `.r-spec-grid-top`):** White coupon backing (`border-radius: 1.4cqw`) housing a 2×3 grid of `#f2f2ea` cream cells framed by `0.28cqw solid #291e3b` rules.
- **Call Leg Barcode Stub Cards (`.call-leg-card`):** Rounded white ticket stubs (`border-radius: 1.1cqw`, `border: 0.18cqw solid #deded8`, `grid-template-columns: 14.2% 85.8%`) with a vertical CSS barcode on the left, dotted tear line with semicircular edge notches, and 3-line monospace call telemetry on the right.
- **Carbon-Copy Lavender Voucher (`.carbon-copy-voucher`):** Framed in `1px solid #382866` with `#eae4f4` lavender tissue background, side punch-out notches, dashed white header separator, and a `#dcd3ec` horizontal barcode footer strip.
- **Priority Queue Coupon Item (`.queue-coupon-item`):** 4-column ticket row (`grid-template-columns: 56px 1fr auto 14px`, `1px solid #291e3b`). Features a `56px` numbered priority rank stub (`#0f2541` for due today, `#c61920` for overdue), lead summary body, stacked `TEL:` / `WA.ME` / `LOG` mini triggers, and a `14px` diagonal `-45deg` Void Red hatching strip along the right edge.

### Inputs / Fields
- **Coupon Inputs & Selects (`.coupon-input`, `.coupon-select`, `.coupon-textarea`):** Square-cornered (`0px` radius), `10px 12px` padding, `1px solid #291e3b` border, `#ffffff` fill, set in `IBM Plex Mono` (`0.9rem`, 600 weight) with `#c61920` caret color and `2px solid #c61920` `:focus-visible` outline (`outline-offset: 2px`).
- **Live Duplicate Guard Banner (`.duplicate-warning-banner`):** Instant inline alert (`1px solid #c61920`, `#fde8e9` fill, `#7f1216` monospace text) triggered whenever an entered primary or secondary phone matches an existing lead, complete with a 1-tap `LOAD EXISTING LEAD` recovery button.

### Navigation & Index Tabs
- **Top Overdue Alert Strip (`.r-overdue-alert-bar`):** Full-bleed Jet Red bar (`#c61920` with `#9b2429` bottom border) displaying live overdue and due-today counts; tapping scrolls smoothly to the Priority Follow-ups queue.
- **Chamfered Folder Tab Bars (`.wallet-tab-bar`, `.carbon-voucher-tabs`):** 3-column tab strips set inside `#0f2541` Navy or `#382866` Carbon Purple headers. Inactive tabs use translucent white (`rgba(255, 255, 255, 0.14)`) with `8px–10px` top corner chamfers; the active tab locks visually into the paper stock below (`#f6f6f1` or `#eae4f4`).

## Do's and Don'ts

### Do:
- **Do** use self-hosted `Barlow Condensed` (600–800 weight, uppercase) for all structural ticket labels, headers, status stamps, and action triggers, and `IBM Plex Mono` (`tabular-nums`) for all phone numbers, timestamps, and call-leg records.
- **Do** preserve the 4 native ephemera devices across new views: Chamfered Index Tab Caps, Void Red Diagonal Hatching Strips (`-45deg`), Carbon-Copy Lavender Voucher Stock (`#eae4f4` / `#dcd3ec`), and Security Dot-Matrix Halftone Headers (`radial-gradient` `6px × 6px`).
- **Do** keep all call logging, WhatsApp message editing, directory filtering, and duplicate-phone checking inline on the dossier canvas so agents complete call workflows in under 10 seconds without modal interruption.
- **Do** normalize and cross-check every phone input against both primary and secondary numbers in real time, surfacing either the angled `VERIFIED · NO DUPLICATE` emerald stamp or the inline `DUPLICATE WARNING` recovery banner.

### Don't:
- **Don't** introduce modal dialogs, popovers, or slide-over drawers that obscure the active Master Lead Coupon during live calls.
- **Don't** use generic SaaS rounded cards (`border-radius: 16px`), soft blurred drop shadows, glassmorphism, or decorative sparklines/progress rings.
- **Don't** set phone numbers, dates, or budgets in proportional sans-serif numerals without `tabular-nums`, or allow mid-gray low-contrast text on cream (`#f2f2ea`) or lavender (`#eae4f4`) paper surfaces.
- **Don't** use thick colored `border-left` accent stripes on cards; signify overdue status with the numbered priority stub (`#c61920`) and the `14px` right-hand Void Red diagonal hatching strip.
