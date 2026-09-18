// One-shot codemod: normalize icon glyphs to the 16/20/24/32 token vocabulary
// and bump decorative icon chips to the 48 control geometry.
// Entries are exact substring replacements, applied in order, once each.
const fs = require('fs');
const path = require('path');
const clientRoot = path.join(__dirname, '..');

const edits = [
  // [file, find, replace]
  ['src/components/accessibility/AccessibilityModal.js', 'size={scale(22)}', 'size={sizes.icon}'],
  ['src/components/cards/driverItem.js', 'add-call" size={scale(15)}', 'add-call" size={sizes.iconSmall}'],
  ['src/components/cards/driverItem.js', 'message" size={scale(15)}', 'message" size={sizes.iconSmall}'],
  ['src/components/cards/placeItem.js', 'name={iconUrl} size={scale(25)}', 'name={iconUrl} size={sizes.iconLarge}'],
  ['src/components/cards/placeItem.js', 'name="location-on" size={scale(25)}', 'name="location-on" size={sizes.iconLarge}'],
  ['src/components/cards/serviceHistoryItem.js', 'size={scale(12)}', 'size={sizes.iconSmall}'],
  ['src/components/map/paymentOptions.js', 'schedule" size={scale(15)}', 'schedule" size={sizes.iconSmall}'],
  ['src/components/modals/Chat/ChatModal.js', 'arrow-back" size={scale(22)}', 'arrow-back" size={sizes.iconLarge}'],
  ['src/components/modals/Chat/ChatModal.js', 'phone" size={scale(22)}', 'phone" size={sizes.iconLarge}'],
  ['src/components/modals/Confirmation/ConfirmationModal.js', 'check" size={scale(36)}', 'check" size={sizes.iconXL}'],
  ['src/components/modals/Confirmation/ConfirmationModal.js', 'size={scale(36)}', 'size={sizes.iconXL}'],
  ['src/components/modals/Destination/components/FlatListHeader.js', 'my-location" size={scale(25)}', 'my-location" size={sizes.iconLarge}'],
  ['src/components/modals/Destination/components/FlatListHeader.js', 'location-on" size={scale(25)}', 'location-on" size={sizes.iconLarge}'],
  ['src/components/modals/SavedPlaces/AddressModal.js', 'search" size={scale(25)}', 'search" size={sizes.iconLarge}'],
  ['src/components/modals/SavedPlaces/AddressModal.js', 'size={scale(30)}', 'size={sizes.iconLarge}'],
  ['src/components/savedAddresses/components/LocationSearch.js', 'search" size={scale(22)}', 'search" size={sizes.icon}'],
  ['src/components/savedAddresses/components/LocationSearch.js', 'navigation" size={scale(26)}', 'navigation" size={sizes.iconLarge}'],
  ['src/components/savedAddresses/components/LocationSearch.js', 'map" size={scale(26)}', 'map" size={sizes.iconLarge}'],
  ['src/components/views/placeSearch.js', 'search" size={scale(18)}', 'search" size={sizes.icon}'],
  ['src/components/views/userCarInfo.js', 'directions-car" size={scale(22)}', 'directions-car" size={sizes.iconLarge}'],
  ['src/components/views/userCarInfo.js', 'size={scale(18)}', 'size={sizes.icon}'],
  ['src/screens/ComplaintsScreen.js', 'size={scale(21)}', 'size={sizes.icon}'],
  ['src/screens/ComplaintsScreen.js', 'support-agent" size={scale(28)}', 'support-agent" size={sizes.iconLarge}'],
  ['src/screens/HistoryScreen.js', 'error-outline" size={scale(60)}', 'error-outline" size={sizes.illustration}'],
  ['src/screens/InviteScreen.js', 'person-add" size={scale(22)}', 'person-add" size={sizes.icon}'],
  ['src/screens/InviteScreen.js', 'monetization-on" size={scale(22)}', 'monetization-on" size={sizes.icon}'],
  ['src/screens/InviteScreen.js', 'error-outline" size={scale(18)}', 'error-outline" size={sizes.iconSmall}'],
  ['src/screens/InviteScreen.js', '"content-copy"\n                    size={scale(18)}', '"content-copy"\n                    size={sizes.icon}'],
  ['src/screens/LoginScreen.js', 'size={scale(22)}', 'size={sizes.iconLarge}'],
  ['src/screens/MapScreen.js', 'my-location" size={scale(14)}', 'my-location" size={sizes.iconSmall}'],
  ['src/screens/MapScreen.js', 'event" size={scale(18)}', 'event" size={sizes.icon}'],
  ['src/screens/MapScreen.js', 'chevron-right" size={scale(22)}', 'chevron-right" size={sizes.icon}'],
  ['src/screens/MapScreen.js', 'search" size={scale(18)}', 'search" size={sizes.icon}'],
  ['src/screens/MapScreen.js', 'check" size={scale(18)}', 'check" size={sizes.icon}'],
  ['src/screens/NotificationsScreen.js', 'check" size={scale(14)}', 'check" size={sizes.iconSmall}'],
  ['src/screens/NotificationsScreen.js', '{cfg.icon} size={scale(22)}', '{cfg.icon} size={sizes.icon}'],
  ['src/screens/ProfileScreen.js', '{item.icon} size={scale(22)}', '{item.icon} size={sizes.icon}'],
  ['src/screens/PromotionScreen.js', '{b.icon} size={scale(22)}', '{b.icon} size={sizes.icon}'],
  ['src/screens/PromotionScreen.js', 'error" size={scale(14)}', 'error" size={sizes.iconSmall}'],
  ['src/screens/PromotionScreen.js', 'check-circle" size={scale(14)}', 'check-circle" size={sizes.iconSmall}'],
  ['src/screens/RegistrationSuccessScreen.js', 'check" size={scale(40)}', 'check" size={sizes.iconXL}'],
  ['src/screens/SettingsScreen.js', 'chevron-right" size={scale(18)}', 'chevron-right" size={sizes.icon}'],
  // Decorative icon chips -> 48-unit geometry
  ['src/components/vehicles/components/VehiclesList.js', 'width: scale(40),\n    height: scale(40)', 'width: sizes.control,\n    height: sizes.control'],
  ['src/components/vehicles/components/VehiclesList.js', 'directions-car" size={scale(48)}', 'directions-car" size={sizes.illustration}'],
  ['src/components/notifications/NotificationsModal.js', 'width: scale(38),\n    height: scale(38)', 'width: sizes.control,\n    height: sizes.control'],
  ['src/components/notifications/NotificationsModal.js', 'notifications-none" size={scale(52)}', 'notifications-none" size={sizes.illustration}'],
  ['src/components/notifications/NotificationsModal.js', 'size={scale(20)} color={item.isRead ?', 'size={sizes.icon} color={item.isRead ?'],
  ['src/components/notifications/NotificationsModal.js', 'delete-outline" size={scale(20)}', 'delete-outline" size={sizes.icon}'],
  ['src/screens/InviteScreen.js', 'width: scale(44),\n    height: scale(44)', 'width: sizes.control,\n    height: sizes.control'],
  ['src/screens/NotificationsScreen.js', 'width: scale(44),\n    height: scale(44)', 'width: sizes.control,\n    height: sizes.control'],
  ['src/screens/NotificationsScreen.js', 'notifications-none" size={scale(80)}', 'notifications-none" size={sizes.illustration}'],
  ['src/components/views/userCarInfo.js', 'width: scale(44),\n    height: scale(44)', 'width: sizes.control,\n    height: sizes.control'],
  // Duplicate role line-heights left next to identical raw values
  ['src/screens/InviteScreen.js', '    lineHeight: 20,\n  },\n  section:', '  },\n  section:'],
  ['src/screens/LoginScreen.js', 'fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,\n    paddingHorizontal: spacing.sm,\n    textAlign: "center",\n    lineHeight: 20,\n  },', 'fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,\n    paddingHorizontal: spacing.sm,\n    textAlign: "center",\n  },'],
];

let ok = 0;
const failed = [];
for (const [file, find, replace] of edits) {
  const target = path.join(clientRoot, file);
  let src = fs.readFileSync(target, 'utf8');
  if (!src.includes(find)) { failed.push(`${file}: pattern not found -> ${find.slice(0, 60)}`); continue; }
  src = src.replace(find, replace);
  // Guarantee the theme import covers sizes.
  if (/\bsizes\./.test(src)) {
    src = src.replace(/import\s*\{([^}]*)\}\s*from\s*(['"])[^'"]*theme\2;?/, (m, names) => {
      const list = names.split(',').map((s) => s.trim()).filter(Boolean);
      if (!list.includes('sizes')) list.push('sizes');
      return m.replace(`{${names}}`, `{ ${list.join(', ')} }`);
    });
  }
  fs.writeFileSync(target, src);
  ok++;
}
console.log(`applied ${ok}/${edits.length} edits`);
if (failed.length) console.log('FAILED:\n' + failed.join('\n'));
