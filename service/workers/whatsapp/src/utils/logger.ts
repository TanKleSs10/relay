export type Logger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: unknown) => void;
};

export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;
  return {
    info: (message) => console.log(`${prefix} ${message}`),
    warn: (message) => console.warn(`${prefix} ${message}`),
    error: (message, error) => {
      console.error(`${prefix} ${message}`);
      if (error) {
        console.error(error);
      }
    },
  };
}
