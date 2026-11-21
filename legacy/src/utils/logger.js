/**
 * Logger simples
 */

export const logger = {
  debug: (msg, meta) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${msg}`, meta || '');
    }
  },
  info: (msg, meta) => {
    console.log(`[INFO] ${msg}`, meta || '');
  },
  warn: (msg, meta) => {
    console.warn(`[WARN] ${msg}`, meta || '');
  },
  error: (msg, meta) => {
    console.error(`[ERROR] ${msg}`, meta || '');
  },
};
