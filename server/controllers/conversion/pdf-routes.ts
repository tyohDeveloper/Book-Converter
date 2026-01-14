import { Router, Request, Response } from "express";
import { asyncHandler } from "../../common/errors/error-middleware";
import { getSessionId } from "../../common/http";
import { respondWithFile } from "../../common/response-helpers";
import { validateBody } from "../../common/http";
import { CombineRequestSchema } from "@shared/contracts/conversion";
import { combinePdfFiles } from "../../services/combine-service";

export const pdfRouter = Router();

pdfRouter.post(
  "/tools/combine",
  validateBody(CombineRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, outputName = "combined.pdf" } = req.body;

    const result = await combinePdfFiles(sessionId, fileIds, outputName);
    respondWithFile(res, result.file, "combined");
  })
);
