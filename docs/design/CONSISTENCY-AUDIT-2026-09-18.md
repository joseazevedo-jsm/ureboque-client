# Client consistency audit — 18 September 2026

This is a source inspection of the existing client, recorded before the current migration edits. It supplements [the design standard](CLIENT-DESIGN-SYSTEM.md), whose baseline describes an earlier state. Findings here are not claims of device reproduction. The reference PNGs express visual direction; they are not screenshots of this repository's current UI or instructions to reproduce their exact dimensions. Poppins Regular, Medium, SemiBold and Bold are the required text faces.

## What to preserve

The existing theme already supplies the right foundation: navy text, white surfaces, a pale canvas, accessible primary blue, Poppins faces, logical-unit spacing, bounded containers and restrained elevation. `AppText` maps numeric legacy weights to Poppins faces; `AppPressable` supplies shared focus and disabled behavior. Home saved places, active towing and trip details already consume substantial parts of this foundation. Replacing these foundations with another theme would introduce unnecessary divergence.

The references reinforce a map-first home, grouped destinations, clear driver/vehicle/route hierarchy, circular map actions, rounded sheets and sparse use of blue. Their pale driver captions and very bright blue text should not become production contrast targets. Keep existing artwork and functional flow; reference artwork is not automatically a licensed asset.

## Current source evidence

Paths below are relative to the client. Line numbers describe the audit snapshot and may shift during migration.

| Priority | Finding and evidence | Required treatment |
| --- | --- | --- |
| High | `screens/PersonalInfoScreen.js:87,104,121` and `PasswordCreationScreen.js:97,125` explicitly override placeholders with `#B0B0B0`. The shared text-input default already supplies `colors.textMuted`. | Remove the overrides or use the semantic token. Check actual background contrast. |
| High | `components/insurance/components/InsuranceForm.js:135` uses a scaled 40×40 close control. ContactForm, ContactsList, InsuranceList and AccessibilityModal repeat similar controls. | Use the 48-unit shared target and consistent accessible names. Do not assume an icon's visible size is its hit target. |
| High | InsuranceForm's local input uses 16-radius, small type, `borderLight` and shadow; the theme input recipe uses 12-radius, body type and `borderStrong`. Its green save action is a separate local recipe. | Share a labeled field and standard save action; reserve green for success feedback rather than making every save a different action color. Preserve validation and pending behavior. |
| High | `components/common/ScheduledTowDetails.js:182` uses size38/line-height36 and negative tracking. Its calendar tile is 62×68 and handle36×4, while common geometry exists. | Use a named typography role; ensure line-height accommodates Poppins and increased text size. Use shared geometry unless a content constraint is documented. |
| Medium | `screens/RegistrationSuccessScreen.js:221-233` has a green shadow with opacity .4; welcome/personal/password screens contain further bespoke shadows including .3. | Replace decorative glow with shared neutral elevation; preserve meaningful success iconography. |
| Medium | `hooks/useRegistrationFlow.js:169-171` returns literal red/orange/green colors for password strength. | Return semantic palette colors. Keep the textual strength label so color is not the only signal. |
| Medium | `components/login/CountryPickerWithFlag.js:54-57` uses `#f5f5f5` and `#ddd` instead of the shared field recipe. | Align field geometry, surface and boundary states with the adjacent phone field; check dropdown keyboard behavior separately. |
| Medium | `components/modals/SavedPlaces` and `components/savedAddresses` have distinct wrappers, hooks and rows for overlapping saved-location tasks. | Unify presentational header/row/empty-state contracts without merging data or map-drag state machines as a styling change. |
| Medium | Profile and History still combine typeScale sizes with numeric weights; header weights include800. `AppText` currently normalizes these to the700 face. | Prefer explicit typography roles so size, line-height and semantic weight travel together. Existing normalization prevents this from being proof of a fallback-font defect. |
| Medium | Secondary screens use scaled icon sizes22/20/16 and fixed-height controls44/42/40; ChatModal contains several such heights. | Use the 16/20/24 icon vocabulary and48 minimum interactive targets. Review content wrapping rather than doing blind numeric substitutions. |
| Low | `src/styles.js` still defines scaled318×50 inputs,35 circles and fixed dividers. A source search found no consumers of its exported style collections. | Treat as dormant legacy code, not an observed current screen defect. Retire after confirming no external consumers rather than spending migration effort polishing dead styles. |

Colors embedded in the map provider style and visual map geometry are legitimate candidates for documented exceptions. A raw numeric value alone is not proof of a design defect: flex values, opacity, geographic coordinates, animation interpolation and aspect ratios have different semantics.

## Component inventory and migration ownership

| Shared contract | Existing consumers to consolidate | Acceptance example |
| --- | --- | --- |
| Action / icon action | AppButton, AppPressable, ScalePressable; login, forms, towing, drawer controls | One save action supports pending, disabled, focus, long labels and repeated taps without changing footprint unexpectedly. |
| Labeled input / select | PersonalInfo, PasswordCreation, CountryPicker, InsuranceForm, ContactForm, AddressForm, VehicleForm | Persistent label,48 minimum height, visible border/focus, inline error, preserved entered value. |
| Place row / card | cardSpots, placeSavedItem, AddressesList, SavedPlacesModal | Same destination hierarchy; text wraps; edit and selection semantics remain distinguishable. |
| Screen / modal header | Account screens; saved, insurance, contacts and accessibility modals | Safe-area inset plus shared spacing;48 controls; aligned title; no fixed status-bar assumptions. |
| Route / driver / payment summary | driverStatus, serviceDetailModal, ScheduledTowDetails, detailsItem | Same role hierarchy across compact and expanded views; long destinations and amounts remain readable. |
| Navigation / tabs | Drawer, history filters and scheduling choices | Selected state is visible beyond color; focus order and selection semantics match the control type. |
| Feedback states | ErrorBoundary, ConnectionBanner, forms, history, notifications and saved lists | Loading, empty, offline and error have explicit text and relevant recovery. |
| Modal / dropdown | Existing RN modals, bottom sheets and country picker | Keyboard dismissal, focus return and scrolling checked on the supported platform. |
| Table | No primary native table established in this audit | Keep a specification for future use; do not add tables solely to satisfy an inventory. |

## Source before-and-after examples

These are migration examples, not fabricated visual captures or confirmation that the code has shipped. Use the final diff and verification report to determine which items are now implemented.

| Screen | Audit snapshot | Desired result |
| --- | --- | --- |
| Personal information / password | Pale literal placeholders and local elevation compete with shared field styles. | Poppins body text, semantic placeholder, common field border/radius and explicit error/focus states. |
| Insurance / emergency contacts |40 close controls, lightly bordered shadowed fields, local green save button. |48 close target, common labeled fields and standard primary save action; success feedback remains green. |
| Scheduled towing details |38/36 time typography and bespoke tile/handle geometry. | Named Poppins display role, token geometry and wrapping layout within the shared sheet width. |
| Registration success | Green .4 shadow and extra local elevation styles. | Restrained neutral elevation; success communicated by icon, text and semantic color. |
| Saved locations | Two distinct feature implementations represent overlapping information. | Shared presentational rhythm and row semantics with existing data flows preserved. |

For genuine visual comparisons, capture identical content/state and viewport before and after. Label device, OS, viewport, font scale and flow state; never compare a reference PNG against a running screenshot as though both were production captures. Existing screenshots in this directory should only be reused when their provenance and state are known.

## Prioritized migration

1. **Foundation and safety:** retain the current theme; tighten shared field/action/header contracts; verify Poppins loading and fallback behavior. Keep compatibility aliases until consumers are migrated.
2. **Reference journey:** confirm map home, saved destinations, active towing and trip details use the same hierarchy and controls. Verify sheet expansion, destination selection, calls/messages, sharing and cancellation guards.
3. **High-risk residuals:** fix low-contrast placeholders, undersized dismissal controls, custom input/action recipes and oversized scheduled-detail type. Exercise invalid input, duplicate-submit prevention and keyboard visibility.
4. **Secondary consistency:** migrate registration, profile, history, chat, insurance, contacts and accessibility screens to shared header/feedback/field contracts. Replace local shadows and unnecessary scaled control geometry.
5. **Retirement and proof:** remove unused legacy recipes, regenerate token documentation, and collect supported-platform evidence at compact phone, standard phone and wide viewport sizes. Treat tablet/desktop behavior as proposed until validated against platform support.

The images provide only phone layouts. A centered720 content column and560 form/sheet are sensible existing token choices, not reference-derived desktop requirements. Native map support, iPad enablement, sheet snap points and web focus behavior require runtime/product validation. This audit does not silently authorize changing platform support or interaction architecture.

## Custom styling rules

- Use existing semantic tokens and shared components for ordinary text, colors, spacing, controls, radii and elevation.
- Permit map coordinates, native API constraints, safe-area measurements, image aspect ratios and content-driven measurements. Explain the constraint beside the exception.
- Introduce a new semantic token only when the existing role cannot represent the requirement. Include default/focus/error/disabled examples and contrast evidence where relevant.
- A repeated exception becomes a shared token or component. Do not copy the same screen override into a second feature.
- Do not merge feature hooks or change booking/business rules to achieve visual reuse.

## Final review checklist

- [ ] Poppins400/500/600/700 render correctly; no synthetic weight or clipped descenders.
- [ ] Named type roles carry consistent line heights; increased text size remains readable.
- [ ] Ordinary text meets4.5:1 and meaningful control boundaries meet3:1 on actual backgrounds.
- [ ] Interactive targets meet48 minimum; icons use16/20/24 roles.
- [ ] Padding/radius/elevation come from tokens; exceptions document real constraints.
- [ ] Keyboard focus, disabled, pressed, loading and error states are distinguishable and operable.
- [ ] Inputs retain values on failure; repeated submission is prevented; errors are associated with fields.
- [ ] Modal dismissal/back/Escape, focus return and screen-reader order are verified per platform.
- [ ] Long names, addresses, currency amounts, empty lists and offline/stale states are reviewed.
- [ ] Reduced-motion preference disables nonessential motion without concealing progress.
- [ ] Safe areas, compact width, enlarged text and keyboard-open layouts remain usable.
- [ ] Booking, location, account, messaging and cancellation behavior survives the migration.
- [ ] Before/after screenshots identify matching state and viewport; source checks are not labeled device tests.

Unmarked boxes are verification obligations, not reported failures. This document records inspection evidence only; it does not claim complete screen coverage or runtime accessibility certification.
