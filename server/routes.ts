import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs/promises";

import { filesRouter } from "./controllers/files";
import { progressRouter } from "./controllers/progress-controller";
import { analysisRouter } from "./controllers/analysis-controller";
import { conversionRouter } from "./controllers/conversion";
import { compressionRouter } from "./controllers/compression-controller";
import { debugRouter } from "./controllers/debug-controller";
import { toolsRouter } from "./controllers/tools-controller";
import { stylesRouter } from "./controllers/styles-controller";
import { errorHandler } from "./common/errors/error-middleware";
import { startPeriodicCleanup, cleanupStaleFiles } from "./lib/temp-cleanup/periodic";
import { logger } from "./common/logger";

const log = logger.child({ module: "routes" });

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdir(uploadDir, { recursive: true }).catch(err => log.error("failed to create upload dir", { error: err.message }));

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  cleanupStaleFiles().catch(err => log.error("failed to cleanup stale files", { error: err.message }));
  startPeriodicCleanup(60 * 60 * 1000);

  app.use("/api", filesRouter);
  app.use("/api", progressRouter);
  app.use("/api", analysisRouter);
  app.use("/api", conversionRouter);
  app.use("/api", compressionRouter);
  app.use("/api", debugRouter);
  app.use("/api", toolsRouter);
  app.use("/api", stylesRouter);

  app.use(errorHandler);

  return httpServer;
}
