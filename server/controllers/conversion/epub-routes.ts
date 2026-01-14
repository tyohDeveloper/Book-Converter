import { Router, Request, Response } from "express";
import { asyncHandler } from "../../common/errors/error-middleware";
import { getSessionId, respond } from "../../common/http";
import { respondWithFile, respondWithFiles } from "../../common/response-helpers";
import { validateBody } from "../../common/http";
import { ConvertRequestSchema } from "@shared/contracts/conversion";
import {
  EpubConvertRequestSchema,
  SplitEpubRequestSchema,
  BundleHtmlRequestSchema,
} from "@shared/contracts/epub";
import { convertHtmlToEpub } from "../../services/epub/html-to-epub";
import { convertEpubToHtml } from "../../services/epub/epub-to-html";
import { splitEpubToChapters } from "../../services/epub/split-chapters";
import { bundleHtmlFiles } from "../../services/epub/bundle-html";

export const epubRouter = Router();

epubRouter.post(
  "/tools/convert",
  validateBody(ConvertRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, settings } = req.body;

    const result = await convertHtmlToEpub(sessionId, fileId, settings || {});
    respondWithFile(res, result.file, "epub");
  })
);

epubRouter.post(
  "/tools/convert-epub",
  validateBody(EpubConvertRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, settings } = req.body;

    const result = await convertEpubToHtml(sessionId, fileIds, settings || {});
    respondWithFile(res, result.file, "html");
  })
);

epubRouter.post(
  "/tools/split-epub",
  validateBody(SplitEpubRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, settings } = req.body;

    const result = await splitEpubToChapters(sessionId, fileId, settings || {});

    if (result.files) {
      respondWithFiles(res, result.files, "xhtml", { chapterCount: result.chapterCount });
    } else if (result.file) {
      respondWithFile(res, result.file, "zip", { chapterCount: result.chapterCount });
    } else {
      respond(res, { success: true, chapterCount: result.chapterCount });
    }
  })
);

epubRouter.post(
  "/tools/bundle-html",
  validateBody(BundleHtmlRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, settings } = req.body;

    const result = await bundleHtmlFiles(sessionId, fileIds, settings || {});
    respondWithFile(res, result.file, "html");
  })
);
