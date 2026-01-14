import path from "path";

const env = process.env;

export const config = {
  env: env.NODE_ENV || "development",
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",

  server: {
    port: parseInt(env.PORT || "5000", 10),
    host: "0.0.0.0",
  },

  uploads: {
    baseDir: path.join(process.cwd(), "uploads"),
    maxFileSize: Infinity,
    allowedMimeTypes: ["application/pdf", "text/html"],
    tempFilePrefix: "temp-",
    chunkSize: 256 * 1024,
  },

  processing: {
    analyzeSizeLimit: 100 * 1024 * 1024,
    previewLength: 2000,
    maxSampleSize: 100000,
    chapterDetectionEnabled: true,
  },

  epub: {
    defaultTitle: "Generated eBook",
    defaultAuthor: "Unknown",
    defaultCompression: "maximum" as "fast" | "maximum",
  },

  cleanup: {
    intervalMs: 60 * 60 * 1000,
    maxAgeMs: 24 * 60 * 60 * 1000,
  },

  session: {
    defaultId: "default-session",
    headerName: "x-session-id",
  },

  logging: {
    level: env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug"),
    enableColors: env.NODE_ENV !== "production",
  },
} as const;

export type Config = typeof config;

export function getUploadPath(...parts: string[]): string {
  return path.join(config.uploads.baseDir, ...parts);
}

export function getTempFilePath(prefix: string = "temp"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return path.join(config.uploads.baseDir, `${prefix}-${timestamp}-${random}`);
}
