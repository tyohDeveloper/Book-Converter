import { Router } from "express";
import { sessionRouter } from "./session-routes";
import { uploadRouter } from "./upload-routes";
import { fileRouter } from "./file-routes";
import { batchRouter } from "./batch-routes";

export const filesRouter = Router();

filesRouter.use(sessionRouter);
filesRouter.use(uploadRouter);
filesRouter.use(fileRouter);
filesRouter.use(batchRouter);
