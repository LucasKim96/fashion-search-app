export const logger = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") console.info(...args);
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};
