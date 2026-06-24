import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  [key: string]: any;
}

export const logStorage = new AsyncLocalStorage<LogContext>();

export function getLogContext(): LogContext {
  return logStorage.getStore() || {};
}

function formatLog(level: string, message: string, meta?: any) {
  const context = getLogContext();
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...meta,
  };
  return JSON.stringify(logObj);
}

export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(formatLog('INFO', msg, meta));
  },
  warn: (msg: string, meta?: any) => {
    console.warn(formatLog('WARN', msg, meta));
  },
  error: (msg: string, meta?: any) => {
    console.error(formatLog('ERROR', msg, meta));
  },
};

export default logger;
