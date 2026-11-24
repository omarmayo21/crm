# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript) + Supabase (PostgreSQL database + Row Level Security + Email/Password Auth) + `libphonenumber-js` for international E.164 phone parsing/validation + Installable PWA (Web App Manifest, Service Worker, 192/512/maskable icons, PWABuilder-ready).

## Users

Real estate sales agents working primarily on mobile devices while making outbound and inbound phone calls across multiple markets (Egypt `+20` default, UAE `+971`, Saudi Arabia `+966`, UK `+44`, US `+1`, Europe, etc.). They need sub-10-second call logging, cross-format duplicate phone detection, resilient call-log draft retention on poor connections, and an installable mobile PWA.

## Product Purpose

A practical, mobile-first real estate sales CRM backed by Supabase Postgres and Auth that logs every phone number called in normalized E.164 format, records call outcomes and notes on a per-lead timeline, prevents duplicate leads across national/international number formats, and surfaces today's and overdue follow-ups by priority.

## Positioning

A phone-first, sub-10-second real estate call-logging CRM with `libphonenumber-js` E.164 duplicate detection across primary and secondary numbers, poor-connection call-draft protection with one-tap retry, per-lead currency and country filtering, and PWABuilder-ready standalone installation.

## Operating Context

- Used continuously on mobile devices (and desktop) during live calling sessions, often on variable cellular connections.
- Multi-country support with configurable Default Country (default: Egypt `EG`, `+20`) and automatic default currency mapping (`EGP`, `USD`, `AED`, `SAR`, `GBP`, `EUR`).
- Numbers typed without a country code use the active Default Country; numbers starting with `+` or `00` are parsed as international and normalized to E.164 (`+201012345678`).
- Displayed in readable international format with a country flag badge; `tel:` links use E.164 and `wa.me` links use digits only (no `+`).
- English UI structured behind a centralized dictionary (`lib/i18n.ts`) with `dir` (`ltr`/`rtl`) support so Arabic (RTL) can be added seamlessly.

## Capabilities and Constraints

- **Data Layer & Security (Supabase):**
  - Primary data lives exclusively in Supabase Postgres (`leads`, `calls`, `notes`, `sources` tables) with Row Level Security (RLS) isolating each agent's records (`auth.uid() = user_id`), designed to scale to multi-agent teams.
  - Database-level unique constraint on `(user_id, phone)` plus repository-level cross-check across `phone` and `secondary_phone` in E.164 format.
  - Indexes on `phone`, `secondary_phone`, `status`, and `next_follow_up_at`.
  - Connects via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (never hardcoded, never uses `service_role`).
  - No fake leads inserted into the production database automatically; optional demo data is provided as a standalone SQL seed/cleanup script (`supabase/seed_demo.sql`).
- **Core Features (Phase 1):**
  - **Authentication:** Supabase Email + Password sign-in / sign-up with clean session handling.
  - **Leads (Add / Edit / Quick Status):** Name, primary phone (E.164 validation + duplicate warning across primary & secondary numbers), optional secondary phone, lead source (`Facebook`, `Ads`, `Referral`, `Cold Call`, `Website`, plus user-created sources in `sources`), request type (`Buy`, `Rent`, `Invest`), property type (`Apartment`, `Villa`, `Commercial`, `Land`, `Townhouse`, `Penthouse`), area/project with autocomplete seeded with common areas (`New Cairo`, `Sheikh Zayed`, `New Capital`, `6th of October`, `Alexandria`, `North Coast`, `Maadi`, `Dubai Marina`, `Downtown Dubai`, `Riyadh`), per-lead currency (`EGP`, `USD`, `AED`, `SAR`, `GBP`, `EUR`) + budget, optional country field, and 9 quick-change statuses (`New`, `No Answer`, `Interested`, `Needs Follow-up`, `Viewing Scheduled`, `Negotiation`, `Closed/Sold`, `Not Interested`, `Wrong Number`).
  - **Call Log & General Notes:** Newest-first call timeline recording automatic date/time, outcome (`Answered`, `No Answer`, `Busy`, `Switched Off`, `Rejected`), feedback/notes, and next follow-up date/time via a sub-10-second form; general lead notes stored in the `notes` table outside the call log.
  - **Resilient Poor-Connection Handling:** Loading and error states across all operations; if saving a call log fails due to network drop, the unsaved call draft is preserved in a recovery queue with a prominent warning banner and one-tap `Retry Save` button so no call log is ever lost.
  - **Today's Follow-ups:** Dedicated view for leads with follow-up due today or overdue, overdue items highlighted in red, sorted by priority.
  - **Search & Filters:** Search by name or phone (matching partial digits or formatted input); filter by status, source, area, property type, country, and last call date.
  - **PWA:** Installable `manifest.webmanifest`, service worker (`public/sw.js`), `192x192`, `512x512`, and `maskable-512x512` PNG icons, `display: standalone`, passing PWABuilder checks for APK packaging.

## Evidence on Hand

Greenfield application. Production database starts clean with zero fake leads. An optional standalone SQL seed script (`supabase/seed_demo.sql`) is provided separately.

## Product Principles

1. **Zero Lost Call Logs:** Unsaved call drafts survive network failures and offer instant retry until committed to Supabase.
2. **E.164 Phone Integrity:** Every phone number (`01012345678`, `+201012345678`, `00201012345678`) normalizes to a single canonical E.164 string and is checked against both primary and secondary numbers.
3. **Sub-10-Second Mobile Loop:** Calling, messaging on WhatsApp with an editable template, changing status, and logging a call outcome require minimal taps on mobile.
4. **Zero Forgotten Follow-ups:** Overdue and today's follow-ups surface immediately in red priority order.
