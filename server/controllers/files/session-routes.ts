import { Router, Request, Response } from "express";
import { asyncHandler } from "../../common/errors/error-middleware";
import { respond } from "../../common/http";
import { fileManager } from "../../lib/file-manager/file-manager";

export const sessionRouter = Router();

sessionRouter.post(
  "/session/create",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = await fileManager.createSession();
    respond(res, { sessionId });
  })
);
