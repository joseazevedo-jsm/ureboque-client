import { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomSheetFooter } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale } from 'react-native-size-matters';
import { colors, spacing } from '../../theme';

// Measured on the test device (1080x2244 @480dpi, EMUI): the three-button bar
// surface is 128px = 43dp. Some EMUI builds report a zero bottom inset while
// that bar still covers an edge-to-edge view, so a zero on Android falls back
// to that height. A non-zero inset is the real bar and is used as is: flooring
// it at 43dp lifted every sheet ~20dp on gesture-navigation phones (whose bar
// is shorter) and exposed the actions meant to stay below the fold.
export const ANDROID_NAV_BAR_MIN = 43;

// One source of truth for the nav-bar allowance. Every sheet height and every
// piece of chrome that has to clear the bar goes through this, so the inset is
// applied exactly once instead of the three different ways it used to be.
export const useNavBarPad = () => {
  const { bottom } = useSafeAreaInsets();
  return Platform.OS === 'android' && bottom === 0 ? ANDROID_NAV_BAR_MIN : bottom;
};

/**
 * Covers the nav-bar strip at the bottom of a sheet with the sheet's own
 * surface. Every snap point carries the nav-bar allowance, so at rest the
 * content just below the fold would otherwise show through that strip: on
 * gesture-navigation phones the bar is transparent and the first action under
 * the divider peeked out (and faintly behind EMUI's translucent buttons too).
 * Pass it as a sheet's footerComponent.
 */
export const NavBarShield = (props) => {
  const height = useNavBarPad();
  return (
    <BottomSheetFooter {...props}>
      <View style={[styles.navBarShield, { height }]} />
    </BottomSheetFooter>
  );
};

// Gorhom draws the handle above the content and a snap point is the height of
// the whole sheet, so every measured content height has to carry the handle.
export const SHEET_HANDLE_HEIGHT = spacing.sm * 2 + scale(5);

/**
 * Derives a sheet's snap points from what its content actually measures rather
 * than from hand-tuned percentages.
 *
 *   rest     = everything down to the fold (the divider)
 *   expanded = the full content, and not a pixel more
 *
 * So the action buttons below the divider are exactly what a drag up reveals,
 * and the expanded sheet ends where the content ends — no dead space — on any
 * screen size or font scale. `fallback` is used until the first layout lands.
 *
 * Heights exclude the nav-bar allowance: FlowBottomSheet adds that once, for
 * measured and hand-tuned sheets alike.
 */
export const useMeasuredSheet = (fallback) => {
  const { height: viewportHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const [contentHeight, setContentHeight] = useState(0);
  const [foldOffset, setFoldOffset] = useState(0);

  // Sub-pixel layout jitter would otherwise re-initialise the sheet on every
  // re-render, which is what made these sheets fail to open mid-trip before.
  const onContentLayout = useCallback((event) => {
    const next = Math.ceil(event.nativeEvent.layout.height);
    setContentHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  }, []);

  const onFoldLayout = useCallback((event) => {
    const next = Math.ceil(event.nativeEvent.layout.y);
    setFoldOffset((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  }, []);

  const snapPoints = useMemo(() => {
    if (!contentHeight) return fallback;
    const maxHeight = viewportHeight - topInset - spacing.lg;
    const expanded = Math.min(SHEET_HANDLE_HEIGHT + contentHeight, maxHeight);
    if (!foldOffset) return [expanded];
    const rest = Math.min(SHEET_HANDLE_HEIGHT + foldOffset, expanded);
    // A fold that sits within a hair of the full height is not worth a second
    // stop — it would read as a sheet that barely moves when dragged.
    return expanded - rest < spacing.jumbo ? [expanded] : [rest, expanded];
  }, [contentHeight, foldOffset, viewportHeight, topInset, fallback]);

  return { snapPoints, onContentLayout, onFoldLayout };
};

/**
 * The divider a sheet rests on. Doubles as the measurement marker: its offset
 * inside the content is what `useMeasuredSheet` turns into the resting snap
 * point, so the line the user sees is exactly where the sheet stops.
 */
export const SheetFold = ({ onLayout }) => (
  <View onLayout={onLayout} style={styles.fold} />
);

const styles = StyleSheet.create({
  navBarShield: {
    backgroundColor: colors.surface,
  },
  fold: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
});
