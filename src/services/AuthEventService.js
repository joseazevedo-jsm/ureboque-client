class AuthEventService {
  constructor() {
    this.listeners = [];
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
}

export default new AuthEventService();
