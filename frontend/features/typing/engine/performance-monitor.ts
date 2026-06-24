class PerformanceMonitor {
  private keyTimes: number[] = [];
  private isRunning = false;
  private lastFrameTime = 0;
  private memoryStart = 0;
  private rafId = 0;

  start() {
    if (typeof window === 'undefined') return;
    this.isRunning = true;
    this.keyTimes = [];
    this.lastFrameTime = performance.now();
    
    const memory = (performance as any).memory;
    if (memory) {
      this.memoryStart = memory.usedJSHeapSize;
    }

    const tick = () => {
      if (!this.isRunning) return;
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;

      // Frame Drop > 16ms
      if (delta > 20) { 
        console.warn(`[Performance Monitor] Frame drop detected: ${delta.toFixed(2)}ms`);
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.isRunning = false;
    if (typeof window !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
  }

  recordKeyProcessing(durationMs: number) {
    this.keyTimes.push(durationMs);
    
    // Warning: Key Processing > 5ms
    if (durationMs > 5) {
      console.warn(`[Performance Monitor] Key processing exceeded 5ms: ${durationMs.toFixed(2)}ms`);
    }
  }

  report() {
    if (typeof window === 'undefined') return null;

    const avgKeyTime = this.keyTimes.length > 0
      ? this.keyTimes.reduce((a, b) => a + b, 0) / this.keyTimes.length
      : 0;
    
    const maxKeyTime = this.keyTimes.length > 0
      ? Math.max(...this.keyTimes)
      : 0;

    let memoryGrowthBytes = 0;
    const memory = (performance as any).memory;
    if (memory) {
      memoryGrowthBytes = Math.max(0, memory.usedJSHeapSize - this.memoryStart);
    }

    const memoryGrowthMb = memoryGrowthBytes / (1024 * 1024);

    // Warning: Memory Growth > 20MB
    if (memoryGrowthMb > 20) {
      console.warn(`[Performance Monitor] Memory growth exceeded 20MB: ${memoryGrowthMb.toFixed(2)}MB`);
    }

    return {
      avgKeyTimeMs: avgKeyTime,
      maxKeyTimeMs: maxKeyTime,
      memoryGrowthMb,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
