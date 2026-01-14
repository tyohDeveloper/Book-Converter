import { Router, Request, Response } from "express";
import { asyncHandler } from "../../common/errors/error-middleware";
import { getSessionId } from "../../common/http";
import { respondWithFile, respondWithFiles } from "../../common/response-helpers";
import { validateBody } from "../../common/http";
import { DocxConvertRequestSchema, HtmlToDocxRequestSchema } from "@shared/contracts/docx";
import { convertDocxToHtml, convertDocxToEpub, convertDocxToPdf } from "../../services/docx/to-formats";
import { convertHtmlToDocx } from "../../services/docx/from-html";

export const docxRouter = Router();

docxRouter.post(
  "/tools/convert-docx",
  validateBody(DocxConvertRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, outputFormat, settings } = req.body;

    let result;
    switch (outputFormat) {
      case "html":
        result = await convertDocxToHtml(sessionId, fileIds, settings);
        break;
      case "epub":
        result = await convertDocxToEpub(sessionId, fileIds, settings);
        break;
      case "pdf":
        result = await convertDocxToPdf(sessionId, fileIds, settings);
        break;
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    respondWithFile(res, result.file, outputFormat);
  })
);

docxRouter.post(
  "/tools/convert-html-to-docx",
  validateBody(HtmlToDocxRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, settings } = req.body;

    const result = await convertHtmlToDocx(sessionId, fileIds, settings || {});

    if ('files' in result) {
      respondWithFiles(res, result.files, "docx");
    } else {
      respondWithFile(res, result.file, "docx");
    }
  })
);
