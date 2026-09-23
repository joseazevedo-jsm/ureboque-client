class AuthEventService {
  constructor() {
    this.listeners = [];
    this.deferredLogoutListeners = [];
    // Trip liveness lives here (a plain module, not a context) because the
    // trip-state provider sits *below* AuthContext in the tree — contexts
    // cannot look "down" — while the session guard that needs the answer
    // lives in AuthContext.
    this.tripActive = false;
    this.deferredBearer = null;
  }

  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // rejectedBearer identifies which token the server rejected (the exact
  // "Bearer <token>" header sent by the failed request), so subscribers can
  // tell a stale/delayed rejection from a previous session apart from one
  // that actually applies to the currently active session.
  emitInvalidToken(rejectedBearer) {
    this.listeners.slice().forEach(callback => {
      try {
        callback(rejectedBearer);
      } catch (error) {
        // One subscriber must not prevent other auth consumers from logging out.
        console.error('AuthEventService listener failed', error);
      }
    });
  }

  // --- Deferred logout while a trip is active ------------------------------
  // Logging out mid-trip unmounts the map and throws an assist request's UI
  // away. When the token dies during an active trip we keep the (dead) token
  // until the trip ends; every API call will keep 401ing, but the trip state
  // the user is looking at survives.
  setTripActive(active) {
    this.tripActive = !!active;
    if (!this.tripActive && this.deferredBearer) {
      const bearer = this.deferredBearer;
      this.deferredBearer = null;
      this.deferredLogoutListeners.slice().forEach(callback => {
        try {
          callback(bearer);
        } catch (error) {
          console.error('AuthEventService deferred-logout listener failed', error);
        }
      });
    }
  }

  isTripActive() {
    return this.tripActive;
  }

  deferLogout(rejectedBearer) {
    this.deferredBearer = rejectedBearer || null;
  }

  hasDeferredLogout() {
    return !!this.deferredBearer;
  }

  clearDeferredLogout() {
    this.deferredBearer = null;
  }

  subscribeDeferredLogout(callback) {
    if (typeof callback !== 'function') return () => {};
    this.deferredLogoutListeners.push(callback);
    return () => {
      this.deferredLogoutListeners = this.deferredLogoutListeners.filter(l => l !== callback);
    };
  }
}

export default new AuthEventService();
