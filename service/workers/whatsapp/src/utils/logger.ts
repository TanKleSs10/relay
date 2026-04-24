export type Logger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: unknown) => void;
};

const LOG_TIMEZONE = "America/Mexico_City";
const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: LOG_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;
  return {
    info: (message) => console.log(`${prefix}[${formatTimestamp()}] ${message}`),
    warn: (message) => console.warn(`${prefix}[${formatTimestamp()}] ${message}`),
    error: (message, error) => {
      console.error(`${prefix}[${formatTimestamp()}] ${message}`);
      if (error) {
        console.error(error);
      }
    },
  };
}

function formatTimestamp(date = new Date()): string {
  const parts = TIMESTAMP_FORMATTER.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.day}-${values.month}-${values.year} ${values.hour}:${values.minute}`;
}
