import { createRef } from 'react';

export const navigationRef = createRef();

let pendingNavigation = null;

export function navigate(name, params) {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(name, params);
  } else {
    pendingNavigation = { name, params };
  }
}

export function flushPendingNavigation() {
  if (!pendingNavigation || !navigationRef.current?.isReady()) return;
  const { name, params } = pendingNavigation;
  pendingNavigation = null;
  navigationRef.current.navigate(name, params);
}
