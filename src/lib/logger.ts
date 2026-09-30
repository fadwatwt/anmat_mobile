// Centralized logger: verbose in dev, silent (or crash-report only) in production.
// Never log tokens, passwords, or full Authorization headers.
type LogArgs = unknown[];

function sanitize(args: LogArgs): LogArgs {
  return args.map((a) => {
    if (typeof a === 'string' && /Bearer\s+[A-Za-z0-9\-._~+/=]+/.test(a)) {
      return a.replace(/Bearer\s+[A-Za-z0-9\-._~+/=]+/, 'Bearer [REDACTED]');
    }
    return a;
  });
}

export const logger = {
  debug(...args: LogArgs) {
    if (__DEV__) console.log('[DEBUG]', ...sanitize(args));
  },
  info(...args: LogArgs) {
    if (__DEV__) console.log('[INFO]', ...sanitize(args));
  },
  warn(...args: LogArgs) {
    console.warn('[WARN]', ...sanitize(args));
  },
  error(...args: LogArgs) {
    console.error('[ERROR]', ...sanitize(args));
  },
};
