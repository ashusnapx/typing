import { AntiCheatTelemetry, TimingSignal } from './types';

export class AntiCheatCollector {
  private pasteAttempts = 0;
  private copyAttempts = 0;
  private contextMenuOpens = 0;
  private blurEvents = 0;
  private focusEvents = 0;
  private timingSignals: TimingSignal[] = [];

  private keyDepressionTimes: Map<string, number> = new Map();
  private lastKeyReleaseTime = 0;

  init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('copy', this.handleCopy);
    window.addEventListener('paste', this.handlePaste);
    window.addEventListener('contextmenu', this.handleContextMenu);
  }

  destroy() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('copy', this.handleCopy);
    window.removeEventListener('paste', this.handlePaste);
    window.removeEventListener('contextmenu', this.handleContextMenu);
  }

  reset() {
    this.pasteAttempts = 0;
    this.copyAttempts = 0;
    this.contextMenuOpens = 0;
    this.blurEvents = 0;
    this.focusEvents = 0;
    this.timingSignals = [];
    this.keyDepressionTimes.clear();
    this.lastKeyReleaseTime = 0;
  }

  private handleBlur = () => {
    this.blurEvents++;
  };

  private handleFocus = () => {
    this.focusEvents++;
  };

  private handleCopy = () => {
    this.copyAttempts++;
  };

  private handlePaste = () => {
    this.pasteAttempts++;
  };

  private handleContextMenu = () => {
    this.contextMenuOpens++;
  };

  recordKeyDown(key: string) {
    const now = Date.now();
    this.keyDepressionTimes.set(key, now);
  }

  recordKeyUp(key: string) {
    const now = Date.now();
    const pressTime = this.keyDepressionTimes.get(key);
    
    if (pressTime) {
      const holdDuration = now - pressTime;
      const interKeyDelay = this.lastKeyReleaseTime > 0 ? pressTime - this.lastKeyReleaseTime : 0;
      
      this.lastKeyReleaseTime = now;
      this.keyDepressionTimes.delete(key);

      this.timingSignals.push({
        key,
        holdDuration,
        interKeyDelay,
      });

      if (this.timingSignals.length > 500) {
        this.timingSignals.shift();
      }
    }
  }

  getTelemetry(): AntiCheatTelemetry {
    return {
      paste_attempts: this.pasteAttempts,
      copy_attempts: this.copyAttempts,
      context_menu_opens: this.contextMenuOpens,
      blur_events: this.blurEvents,
      focus_events: this.focusEvents,
      timing_signals: [...this.timingSignals],
    };
  }
}
