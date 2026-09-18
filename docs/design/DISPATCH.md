# Ureboque client — Dispatch

SUPERSEDED: the user rejected this direction as resembling v0.1. Use UREV-BASE.md and the user's images in C:/Users/josea/Downloads/urev as the current design authority. Do not implement the Dispatch tokens.

Selected direction: 03, approved by the user. This document and dispatch-tokens.json define the design before app implementation. The generated preview is illustrative; these tokens are authoritative.

## Brief

Assumed primary user: a stranded driver under pressure. Core job: request a tow and understand its arrival. Emotional target: calm, capable, direct. Mobile first, with a dark visual direction. Preserve the existing Portuguese product language; locale terminology needs a consistent editorial pass.

## Point of view

A personal dispatch instrument: clear location, clear next action, honest service status. Large timing numerals and restrained technical borders establish identity. Maps provide orientation; opaque sheets make instructions readable. No ornamental gradients, glowing panels, or color used only for decoration.

## System

Use dispatch-tokens.json for all design values. IBM Plex Sans supports instructions and headings; IBM Plex Mono is reserved for ETA, prices and identifiers. Use sentence case. Essential instructions start at 16 logical pixels; 12 is only for supplementary captions. Honor OS text scaling and safe-area insets. Spacing units are logical pixels, with responsive layout rather than shrinking touch targets.

Background is the app canvas; surface distinguishes panels. Cyan marks primary actions, focus and the active route. Mint means confirmed; salmon means failure; amber means delayed or stale information. Each state includes text and an icon. Control borders define interactive boundaries; low-contrast dividers only separate already-understandable content. Pickup and destination use distinct shapes and labels, not additional hues. Elevation defines stacking; opaque surfaces and borders provide separation without relying on shadow.

Primary controls are 56 high with 2-radius corners. Cards use radius 8 and sheets 12. All targets are at least 44 by 44. Keyboard focus uses a 2px cyan ring with separation from the element. Sheets must expand and scroll when text grows. Restore focus after modal dismissal; label map controls and expose pickup/destination information outside the map. Reduced motion removes transitions; announce asynchronous status changes without repeated announcements.

## Information architecture and flow

Keep the existing drawer destinations. Primary surface: current request and map. Secondary destinations: history, profile, notifications, settings, promotions/referrals and support. Do not introduce competing navigation while a request is active.

Flow: confirm pickup → destination → vehicle details → review price/payment → explicit request confirmation → matching → assigned/arrival → tow in progress → completion/receipt. Map selection and typed addresses remain alternative input paths. Preserve existing service state and payment behavior.

## Key screens

1. Request: restrained map, visible pickup address with Edit action, destination entry, one Continue button. Saved places are subordinate to the main task.
2. Review: pickup and destination, vehicle details, backend-supplied price/payment, explicit Pedir reboque action. No submission before the review step.
3. Matching: A procurar reboque, progress indicator, confirmed request details, existing cancel behavior. Never imply a provider is assigned yet.
4. Assigned: provider identity, estimate only when available, last-update status, supported contact actions, route and expandable request details. The mockup's 12 min is sample data, not a promised SLA.
5. Completion/history: service outcome and receipt details supplied by the backend. Promotions do not interrupt completion.

## Edge states alongside the happy path

- Empty history: Ainda não pediu um reboque. Action: Pedir reboque. No fake trip cards.
- Loading: A obter localização… with stable layout and an Introduzir endereço alternative. Matching uses a separate explicit status.
- Error/offline: Sem ligação. Preserve the current request and entered data; Tentar novamente refreshes/reconciles state rather than blindly creating a second request. Mark retained tracking data as stale.
- No providers: Não encontramos um reboque disponível. Keep entered details and offer a deliberate retry; never show an invented arrival time.
- Long content: wrap complete addresses in review/details; allow sheet expansion and scrolling; keep primary action reachable without covering content. Do not truncate critical pickup information.
- Location denied: Introduza o local de recolha with manual address action and a secondary permission/settings action. Do not trap the user in a repeated permission prompt.
- Unknown ETA: show A atualizar previsão rather than zero or a fabricated countdown.

## Implementation and validation

Adapt the shared theme and components against these tokens; do not perform a blind color replacement because existing surface colors are also used as button foregrounds. Replace light glass backgrounds with opaque Dispatch surfaces. Load both font families before applying the theme. Map SDK styling must retain legible streets and labels.

Check WCAG AA text contrast, 3:1 interactive boundaries, VoiceOver/TalkBack reading order, keyboard navigation, 200% text scaling, 44px targets, safe areas, keyboard-open sheets and reduced motion on the implemented app. The generated image cannot certify accessibility or exact font rendering. Test offline recovery and ensure retries cannot duplicate a request.
