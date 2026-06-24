import { checkDurationSLA } from './alerts';
import { logger } from './logger';

export async function traceSpan<T>(
  name: string,
  type: 'API' | 'DB' | 'Redis' | 'Job',
  attributes: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Structured trace log
    logger.info(`[TRACE] ${type} ${name} completed`, {
      traceName: name,
      traceType: type,
      durationMs: duration,
      ...attributes,
    });
    
    // Check SLA breach
    if (type !== 'Job') {
      await checkDurationSLA(type, duration, { name, ...attributes });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`[TRACE ERROR] ${type} ${name} failed after ${duration.toFixed(2)}ms`, {
      traceName: name,
      traceType: type,
      durationMs: duration,
      error: error instanceof Error ? error.message : String(error),
      ...attributes,
    });
    throw error;
  }
}
