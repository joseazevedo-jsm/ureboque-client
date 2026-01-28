class AuthEventService {
  constructor() {
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emitInvalidToken() {
    this.listeners.forEach(callback => callback());
  }
}

export default new AuthEventService();
