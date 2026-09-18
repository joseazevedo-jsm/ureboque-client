# Ureboque client design standard

Scope: the React Native client in `ureboque-client`. The supplied home, saved-place, towing and travel-detail images are visual references, not product requirements. Preserve booking, payment, contact, location, cancellation and account behavior. Poppins is the required family. This document records the initial source audit and the target standard; a specification is not evidence that every screen has been migrated or tested.

Implementation entry point: `src/design-system/index.js`. It exports the token layer plus the shared `AppText`, `AppTextInput`, `AppPressable`, `AppButton`, `AppIconButton`, `AppField`, and `AppHeader` primitives. Feature code should consume that public API; a screen-local component is not part of the system merely because it uses matching colors.

Current adoption: `AppHeader` is used by 27 client modules, including saved places, saved-address create/edit/search, account lists and forms, registration, History, Profile, Settings, Notifications, Accessibility, legal documents, trip details, and booking modals. `AppIconButton` provides the same 48-unit geometry and accessibility contract for standalone icon actions. `AppButton` and `AppField` cover the common action and labeled-form patterns; specialized search, password, map, and picker controls retain their behavior while consuming the same tokens.

Current implementation evidence: [18 September review](review-2026-09-18/REVIEW.md), including actual before/after captures, implemented changes and remaining release checks.

## Visual direction

Use navy text, white surfaces and a cool, pale canvas. Reserve saturated blue for the primary action and location emphasis. The references suggest softly rounded grouped content, readable route information, restrained elevation and generous separation between tasks. Translate their hierarchy rather than tracing their dimensions. Avoid their low-contrast gray captions, bright-blue small text and excessive card shadows. Maps and existing illustrations carry the visual character; do not add decorative gradients or glow.

## Source audit: baseline before this migration

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Typography has no common family or line-height contract | Original `src/theme/index.js` provides scaled font sizes and numeric weights, no font families or line heights | Poppins weight and multiline rhythm depend on individual implementation |
| Screen-width scaling controls basic reading size | Theme uses `scale()` for every font size and spacing step; Login also has unscaled 16/18/20 sizes | The same role changes proportions differently across screens and devices |
| Similar roles use nearby sizes | `driverStatus.js` uses 12.5 and 15; Profile uses 13/14/15/16/18 | Hierarchy is noisy and difficult to maintain |
| Colors bypass the palette | Login uses `#999` placeholders and `#707070` icons; initial primary is `#0089FF` | Labels, controls and action contrast vary |
| Radius vocabulary is inconsistent | Theme contains 8/12/14/16/20/50, SavedPlaces uses 25, Profile uses 46 | Related controls have different silhouettes |
| Small targets vary by feature | SavedPlaces and AddressesList close controls are 40; Profile avatar edit is 36 | Touch accuracy and keyboard affordance require remediation |
| Elevation is both shared and local | DriverStatus has its own black shadow (y3, opacity .07, radius6, elevation4); theme also has colored glow presets | Peer components look like different products |
| Saved-place behavior has two visual implementations | `components/modals/SavedPlaces` and `components/savedAddresses` | Headers, rows, edit state and empty state can drift |
| Some dimensions assume a narrow phone | MapScreen contains scaled widths 310/318/330; CardSpots is 155×100 | Long labels, large text and wider layouts need intentional behavior |
| Press behavior is disconnected from semantics | Initial ScalePressable only destructures a small prop set and does not forward accessibility props | Callers cannot reliably supply role, state or focus behavior |
| Exceptions lack explicit rationale | Trip details has a monospace receipt label | Font exceptions need a product reason; Poppins should cover ordinary identifiers |

This is a code audit, not a claim that every finding was reproduced on a device. Authentication, network state and native map availability affect runtime coverage. Existing map sheet snap-point behavior must be preserved when changing spacing.

## Tokens and units

Values below are logical React Native units (CSS pixels on web), not screen-width-scaled values. Native text scaling remains enabled. Import tokens from `src/theme`; never multiply base reading sizes by viewport width.

| Token role | Exact standard |
| --- | --- |
| Primary action | `#006DDB` |
| Bright map/accent blue | `#008CFF`; do not use for small text on white |
| Primary text | `#123B66` |
| Canvas / surface | `#F5F8FC` / `#FFFFFF` |
| Spacing | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 |
| Radius | 0 none, 8 small, 12 input/button, 16 card, 24 sheet, 9999 circle/pill; legacy lg/xl both resolve to 16 |
| Border | 1 regular; 2 active/focus |
| Touch target | Minimum 48×48; primary action minimum height 56 |
| Icons | 16 supporting, 20 inline, 24 action |
| Text family | Poppins Regular 400, Medium 500, SemiBold 600, Bold 700; legacy light/extrabold resolve to 400/700 |
| Secondary / muted / disabled text | `#526579` / `#607185` / `#718096` |
| Primary pressed / tint / focus | `#0056AD` / `#E8F3FF` / `#0056AD` |
| Success / tint | `#237A47` / `#EAF6EE` |
| Error / tint / error border | `#C62828` / `#FFF1F1` / `#C62828` |
| Warning / tint | `#8A5700` / `#FFF6DF` |
| Border / subtle border / input border | `#D8E2ED` / `#E5ECF3` / `#7A8DA3` |
| Disabled surface | `#E5ECF3` |
| Overlay / glass | `rgba(18,59,102,0.40)` / `rgba(255,255,255,0.98)` |
| h1 / h2 / h3 | 28/36, 24/32, 20/28 size/line-height; SemiBold |
| Body / small body / caption | 16/24, 14/20, 12/16; Regular |
| Label / section title | 14/20 SemiBold; section title uses secondary text |
| Type scale reserve | 32 hero is a first-class role (`typography.hero`, 32/40); do not invent a hero line-height locally—define a role before use. The legacy `typeScale` alias and the consumerless `src/styles.js` were retired; reading text consumes `typography` roles and line heights |
| Small shadow | Navy, x0/y2, radius8, opacity .06, Android elevation1 |
| Medium shadow | Navy, x0/y4, radius12, opacity .08, Android elevation3 |
| Large shadow | Navy, x0/y8, radius24, opacity .12, Android elevation6 |
| Web shadows | `0px 2px 8px rgba(18,59,102,0.06)`; `0px 4px 12px rgba(18,59,102,0.08)`; `0px 8px 24px rgba(18,59,102,0.12)` |
| Motion duration | 120 fast / 200 normal / 280 slow milliseconds |
| Stagger | 35 list / 35 form / 20 fast milliseconds |
| Spring | Press damping24/stiffness400; release24/300; enter28/180 |
| Interaction opacity | .72 pressed; .5 disabled token |
| Layout | Content max720; form max560; sheet max560; tablet768; desktop1200; page margin24; compact margin16 |
| Product geometry | Illustration64; avatar72; place card width176/min-height112; sheet handle40×4 |

The machine-readable [client-tokens.json](client-tokens.json) contains the complete platform-resolved snapshot, including compatibility aliases and component recipes. Regenerate it whenever the source theme changes.

The final checked-in theme is authoritative for semantic colors, exact type roles, shadows, motion and container token names. Keep any subsequent changes to these values synchronized with this specification. A token alias maintained for legacy compatibility is not permission to introduce another visual size.

Calculated sRGB contrast on white: primary `#006DDB` is 4.99:1; navy `#123B66` is 11.39:1; bright accent `#008CFF` is 3.39:1 and is unsuitable for ordinary small text. The prior primary `#0089FF` was 3.49:1 and the Login placeholder `#999999` was 2.85:1. These are numerical color-pair checks, not a complete accessibility audit; opacity, compositing and actual backgrounds must also be checked in the rendered interface.

## Component contract and inventory

All interactive components require default, pressed, focused and disabled states. Disabled controls expose their state, cannot submit, and do not rely solely on opacity. Pending actions keep the same footprint, announce progress, prevent duplicate submission and restore focus after completion.

| Component | Standard | Existing implementations to unify |
| --- | --- | --- |
| Buttons | 56 primary/standard secondary minimum height; compact controls at least48; 12 radius; semibold label; 20 icon; 8 icon gap; fill only the primary action; destructive tint with explicit label | Login/Profile actions, driverStatus actions, form submit/save/delete controls |
| Icon buttons | 48 target, 24 glyph, circular shape; accessible label independent of glyph | Map controls, modal close/edit, avatar edit, call/message |
| Inputs / selects | 48 minimum height; 12 radius; 16 horizontal inset; persistent label; helper/error below; focus uses 2 border and error uses semantic color plus text | Login, AddressForm, VehicleForm, InsuranceForm, ContactForm, LocationSearch, CountryPicker |
| Cards / rows | 16 radius; 16 internal inset; 12 content gap; optional subtle elevation only when separation is needed; flexible text area | CardSpots, PlaceSavedItem, AddressesList, history and account rows |
| Navigation | 48 actions; consistent title role; safe-area inset; visible current item; label and icon aligned | Screen headers, sideMenuDrawer, map menu controls |
| Modals / sheets | 24 top radius; 24 content inset (16 compact); 48 dismiss control; independently scrollable body; keyboard-safe form content; focus returns to opener | SavedPlaces, serviceDetailModal, vehicle/insurance/contact/account modals |
| Tabs | 48 minimum target; selected state has text plus underline or filled surface; keyboard navigation on web | Existing tab views and any future segmented navigation |
| Alerts | Semantic tint, status icon and complete sentence; 12 radius; 16 padding; actionable recovery when available | ConnectionBanner, stale-driver notice, AlertModal, form errors |
| Dropdowns | Same field geometry; selected state marked; list scrolls within available viewport; dismiss via Escape/back | Country picker and element-dropdown uses |
| Empty states | Short heading, useful explanation, one relevant action; same content margins as loaded state | Saved places, contacts, notifications, insurance, vehicles, history |
| Loading | Stable component dimensions; label for longer waits; skeleton matches real content grouping; reduced motion supported | Login submit, driver search, lists, async save actions |
| Error | Inline field errors preserve input; screen failures explain retry; status not communicated by red alone | ErrorBoundary, API failures and validation |
| Tables | Specification only: no primary native table found in audited scope. Use 48 minimum rows, aligned numeric columns, 16 cell inset and accessible headers; narrow screens use labeled records or explicit horizontal scroll | Future web/administrative client views; do not add a table merely for visual parity |

Shared styles are an intermediate step. Prefer shared components with semantic variants over copying a style object into another screen. Reuse the same route summary, driver identity, payment summary and saved-place row where they represent the same information. Do not merge hooks/data flows merely because two rows look alike.

## Layout and responsive rules

Use 4-unit rhythm: 8 within tightly coupled icon/label groups, 12 between row elements, 16 inside ordinary cards, 24 between groups, 32 between page sections. Use 24 page margins (16 compact) and runtime safe-area insets. Lists and modal bodies scroll; footer actions remain reachable when the keyboard or larger text reduces available space.

Wider-screen behavior requires product validation because the references are phone-only: below768 use one column; at768+ center a content column no wider than720, with forms and sheets no wider than560; desktop breakpoint1200 does not enlarge reading sizes. Use available width and flexible columns, never proportional font scaling. Preserve the mobile bottom-sheet interaction until a wider-screen map panel has been verified with the map library. These are migration targets, not a claim that native map screens support web today. The current iOS app configuration has `supportsTablet: false`; tablet-specific behavior requires enabling and validating that platform. Native maps are not supported by the current web implementation.

Use `minHeight` for controls and content-based card height. Allow translated labels and addresses to wrap. A control may grow vertically; do not shrink text to fit. Truncate only secondary preview text when the full text remains available in the next view. Avoid clipping driver names, prices, route destinations and destructive action labels.

## Before / after examples

These are factual source baselines paired with migration targets, not fabricated screenshots. Device captures should be recorded only after the app is rendered successfully.

| Screen | Before | Target after migration |
| --- | --- | --- |
| Home / map | 155×100 scaled saved-place cards; 48/50 control variants; multiple custom shadow blocks and fixed field widths | Tokenized176 width/112 minimum height saved-place cards; one48 circular control; common shadow; available-width destination field; Poppins roles shared with saved places |
| Saved places | 25 scaled sheet corners, 40 close action, title18/800, subtitle13 with 2-unit gap | 24 sheet radius, 48 close control, semibold title role, small-body subtitle and 4-unit gap; common row shared across entry points |
| Active towing | Stale notice12.5; action15/600; local black shadow; action height implicit in padding | Small-body notice, shared semibold button role, 56 primary/48 secondary minimum, common border/radius, explicit destructive action |
| Trip details | Many standalone 12/14/16/18 styles and a monospace receipt label | Named Poppins heading/body/caption roles, aligned section labels, shared route/payment rows; wrapping content and predictable dividers |
| Login / profile | Mixed raw/scaled sizes; hard-coded placeholders; Profile edit action36 | Common inputs and labels, semantic placeholder, 48 edit target, named control heights and focus/error states |

Example replacement pattern (apply through the shared component rather than repeating this code):

```js
// Baseline: driver-status notice
{ fontSize: scale(12.5), fontWeight: '600', marginLeft: spacing.sm }

// Target: named reading role plus semantic weight
{ ...typography.bodySmall, fontFamily: fonts.semiBold, marginLeft: spacing.sm }
```

Confirm exact export names against the checked-in theme when migrating; the purpose is to share role, metrics and weight together rather than retaining a local font-size override.

## Migration plan and acceptance gates

1. Establish foundation: named palette, Poppins faces, unscaled spacing/type metrics, border/radius/elevation and interaction tokens. Keep aliases where removing them would break legacy callers. Validate all imports and font loading before replacing screens.
2. Migrate the reference journey: home/saved places, booking, active towing, trip details. Replace repeated actions and rows with shared primitives. Verify calls, messaging, sharing, route display, detail opening and cancellation eligibility are unchanged.
3. Migrate account/authentication and forms: login, registration, profile, settings, saved addresses, vehicles, insurance and contacts. Exercise keyboard, validation, long labels and pending states.
4. Migrate secondary screens: history, notifications, promotions, invitations, complaints, legal documents and chat. Standardize empty/loading/error states alongside the populated state.
5. Retire compatibility styles only when searches show no consumers. Record visual evidence for the smallest supported phone, a common phone, a tablet and a wide viewport where the platform is supported. Approve rollout after the checklist below, not merely after the token file compiles.

Initial source audit is complete. The shared theme is implemented and its platform-resolved values are included in `client-tokens.json`. Implementation and verification status for screens must be taken from the actual changed files and verification report; this plan does not mark untouched legacy screens as complete. The baseline physical Android capture at `before/home.png` exposes a missing home sheet in the original running state; do not treat the supplied mockups as screenshots of the existing app, or claim a functioning sheet based on static style changes.

## Custom styling policy

Custom geometry is allowed for map coordinates, route lines, illustration aspect ratios, image cropping, safe-area insets and measurements imposed by a native API. Document the constraint beside the value. A feature-specific status may use a new semantic token if existing roles cannot express it; include contrast and state examples in review. No custom values for ordinary padding, type size, button height, border radius, shadow or color when a token already applies. Repeated exceptions become a shared component or token, not additional screen overrides.

## Decisions requiring product or runtime evidence

- References do not establish tablet/desktop information architecture. The proposed breakpoints and panel widths need viewport review.
- Existing illustrations should remain unless licensed replacements are supplied; reference artwork is not automatically a production asset.
- Native map and keyboard behavior require device/emulator verification. Static checks cannot establish drag, modal focus, screen-reader order or text clipping.
- Compact versus expanded towing sheets are real interaction states, not two different design systems; keep existing state logic and validate revised content height.

## Final consistency checklist

- [ ] All displayed text uses the intended Poppins face; no synthetic bold, clipped descenders or unexpected fallback.
- [ ] Reading roles have shared sizes and line heights; larger system text still wraps and scrolls.
- [ ] Shared palette covers text, icons, dividers, pressed/focus/disabled/error states; body contrast is at least 4.5:1 and essential control boundaries at least 3:1.
- [ ] Layout uses named spacing, radius and elevation; exceptions have a concrete reason.
- [ ] Buttons/inputs/icon controls meet minimum targets; repeated roles share dimensions and states.
- [ ] Forms have persistent labels, meaningful errors, keyboard-safe scrolling and preserved data after failure.
- [ ] Modal dismissal, focus return, keyboard navigation and screen-reader order work on each supported platform.
- [ ] Busy, empty, offline, stale-location, error and long-content cases are reviewed, not only ideal populated screens.
- [ ] Map panels, cards and lists remain usable across supported viewport widths; no fixed-width overflow.
- [ ] Reduced motion removes nonessential transforms; interactions remain understandable without animation or color alone.
- [ ] Functional booking/account flows still work and destructive actions retain existing guards.
- [ ] Before/after captures identify device, viewport and state; checks distinguish observed behavior from untested expectations.
