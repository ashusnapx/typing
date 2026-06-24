import { logger } from './logger';

export const sentry = {
  captureException: (error: any, meta?: any) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`[Sentry Exception] ${errorMsg}`, {
      error: errorMsg,
      stack: errorStack,
      ...meta,
    });
  },
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' | 'fatal' = 'info', meta?: any) => {
    if (level === 'error' || level === 'fatal') {
      logger.error(`[Sentry Message] ${message}`, meta);
    } else if (level === 'warning') {
      logger.warn(`[Sentry Message] ${message}`, meta);
    } else {
      logger.info(`[Sentry Message] ${message}`, meta);
    }
  },
};

export default sentry;
