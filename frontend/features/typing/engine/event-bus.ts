type Listener = (data: any) => void;

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  emit(event: string, data?: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in event bus listener for ${event}:`, err);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
export default eventBus;
