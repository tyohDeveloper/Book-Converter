import { config } from "./config";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const RESET = "\x1b[0m";

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = LOG_LEVELS[config.logging.level as LogLevel] ?? LOG_LEVELS.info;
  return LOG_LEVELS[level] >= configuredLevel;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatContext(context: LogContext): string {
  const entries = Object.entries(context);
  if (entries.length === 0) return "";
  return " " + entries.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ");
}

function formatMessage(level: LogLevel, message: string, context: LogContext): string {
  const timestamp = formatTimestamp();
  const levelStr = level.toUpperCase().padEnd(5);
  const contextStr = formatContext(context);

  if (config.logging.enableColors) {
    return `${COLORS[level]}${timestamp} [${levelStr}]${RESET} ${message}${contextStr}`;
  }
  return `${timestamp} [${levelStr}] ${message}${contextStr}`;
}

function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!shouldLog(level)) return;
  const formatted = formatMessage(level, message, context);
  
  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),

  child: (defaultContext: LogContext) => ({
    debug: (message: string, context?: LogContext) =>
      log("debug", message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log("info", message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      log("warn", message, { ...defaultContext, ...context }),
    error: (message: string, context?: LogContext) =>
      log("error", message, { ...defaultContext, ...context }),
  }),
};

export type Logger = typeof logger;
export type ChildLogger = ReturnType<typeof logger.child>;
