# Ureboque — refine the user's existing design

## Authority

The user rejected Dispatch as outdated and supplied C:/Users/josea/Downloads/urev. Its seven JPEGs are the visual baseline. Inspected all seven and opened com.ureboque.client on the connected Huawei EML-L29 (Android 29). The live home screen already uses the reference's map, floating controls, light sheet, illustrated destination cards and search pill. The phone shows Spain location data; reference screenshots show Angola. Never hardcode the illustrative location or price into production.

## Keep

- Light map with floating circular menu, notifications and recenter controls.
- Navy Poppins typography, blue actions, soft white sheets and rounded surfaces.
- Existing illustrated home/work/garage assets and vehicle markers.
- Rebocar para, horizontally scrolling saved destinations and the search pill.
- Driver portrait and call/message actions, pickup/destination timeline, expandable trip details.
- Angola context and Kz formatting in reference previews; production uses existing backend/localization data.

## Refine

Home: retain the map-led composition and saved-place cards. Improve card text hierarchy, use short secondary labels, show a portion of the next card as a scroll cue, and keep the search control anchored above the safe area. Avoid duplicating addresses and secondary instructions.

Active trip: use the collapsed sheet for status, vehicle identity and driver/contact controls. Reveal full route and secondary actions on expansion. Keep cancel visually subordinate to assistance and details; use red for the destructive action and its confirmation.

Details: use readable driver information, consistent vehicle/plate presentation, a simple route timeline, and one payment/amount summary. Wrap essential addresses. Do not use heavy separators between every row.

## Proposed token contract

One font family: existing Poppins. Body 16/24, secondary 14/20, label 14/20 medium, title 22/30 semibold. OS font scaling enabled. Use existing font asset names when implementing.

Colors: navy #173F6B primary text, #526579 secondary text, #F5F8FB canvas, #FFFFFF cards, #0089FF brand/markers, #0066CC primary button background with white text and text links, #DCEEFF selected surface, #718398 input boundary, #D9E3ED decorative separator, #B42318 errors/destructive text, #FFF0EE error surface, #23704B confirmed status. Bright brand blue is preserved; darker action blue supports text contrast. All states include words/icons.

Spacing: 4, 8, 12, 16, 20, 24, 32. Radius: cards 20, sheet 28, search pill 28, regular buttons 16; round icon controls remain circular. Control height 56; minimum hit area 44 by 44 logical pixels. Shadows only separate floating controls/cards from their background; no blue glow. Safe-area insets are measured, not hardcoded. Check actual translucent surface contrast over the map on each platform.

## Edge states

Empty saved places: keep illustrated Casa/Trabalho setup prompts and Adicionar action. Empty history: explanatory sentence and request action. Loading location: A obter localização… with typed-address alternative. Offline: inline error with Tentar novamente; preserve input and active service, mark tracking stale. Permission denied: manual address entry plus secondary settings action. Long addresses: expand/wrap details and grow the sheet; never shrink essential text or overlap actions. No providers: honest availability message without an invented ETA.

## Validation and scope

This pass provides the revised design baseline and an image-generated refinement preview. No app runtime code is changed. The phone inspection verified the home screen only; active-trip preview uses supplied references, not an initiated real towing request. Before implementation, use these tokens to update shared components and validate each affected screen on the phone with large text, keyboard navigation, readable contrast, touch-target checks and recovery states.
