import { Router, Request, Response } from "express";
import fs from "fs/promises";
import { z } from "zod";
import { asyncHandler } from "../../common/errors/error-middleware";
import { getSessionId, respond, validateBody } from "../../common/http";
import { respondWithFile, respondWithFiles } from "../../common/response-helpers";
import { ConvertToHtmlRequestSchema } from "@shared/contracts/conversion";
import { SplitHtmlRequestSchema } from "@shared/contracts/epub";
import {
  HtmlToPdfRequestSchema,
  HtmlFormatRequestSchema,
  CleanHtmlRequestSchema,
} from "@shared/contracts/html";
import { convertPdfsToHtml } from "../../services/html-service/converter";
import { convertHtmlsToPdf } from "../../services/html-service/to-pdf";
import { getHtmlElements, formatHtmlElements } from "../../services/html-service/format-elements";
import { getCssStyles } from "../../services/html-service/get-css-styles";
import { updateCssStyles } from "../../services/html-service/update-css-styles";
import { getMultiCssStyles } from "../../services/html-service/get-multi-css-styles";
import { updateMultiCssStyles } from "../../services/html-service/update-multi-css-styles";
import { simplifyInlineStyles, removeCssClass, removeCssClasses } from "../../services/html-service/simplify-inline-styles";
import { addCssRule } from "../../services/html-service/add-css-rule";
import { replaceCssClass } from "../../services/html-service/replace-css-class";
import { removeCssClassMulti } from "../../services/html-service/remove-css-class-multi";
import { replaceCssClassMulti } from "../../services/html-service/replace-css-class-multi";
import { splitHtmlToChapters } from "../../services/html-split-service";
import { cleanHtml } from "../../services/html-service/clean-html";
import { listSystemFonts } from "../../lib/pdf-fonts/list-system-fonts";
import { fileManager } from "../../lib/file-manager/file-manager";
import { mergeStylesheets } from "../../lib/css/merge-stylesheets";
import { extractInstructions } from "../../lib/css/extract-instructions";
import { applyInstructions } from "../../lib/css/apply-instructions";
import { parseStylesheet } from "../../lib/css/parse-stylesheet";
import { isCssFile } from "../../lib/file-manager/is-css-file";

export const htmlRouter = Router();

htmlRouter.post(
  "/tools/convert-html",
  validateBody(ConvertToHtmlRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, settings } = req.body;

    // PDF→HTML preserves PDF structure - no auto-generated TOC
    const result = await convertPdfsToHtml(sessionId, fileIds, { 
      ...(settings ?? {}), 
      includeTableOfContents: false 
    });
    respondWithFiles(res, result.files, "xhtml");
  })
);

htmlRouter.post(
  "/tools/split-html",
  validateBody(SplitHtmlRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, settings } = req.body;

    const result = await splitHtmlToChapters(sessionId, fileId, settings || {});

    if (result.files) {
      respondWithFiles(res, result.files, "xhtml", { chapterCount: result.chapterCount });
    } else if (result.file) {
      respondWithFile(res, result.file, "zip", { chapterCount: result.chapterCount });
    } else {
      respond(res, { success: true, chapterCount: result.chapterCount });
    }
  })
);

htmlRouter.post(
  "/tools/html-to-pdf",
  validateBody(HtmlToPdfRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, fileIds, settings } = req.body;

    const ids = fileIds || (fileId ? [fileId] : []);
    const result = await convertHtmlsToPdf(sessionId, ids, settings || {});
    
    if (result.files && result.files.length > 1) {
      respondWithFiles(res, result.files, "pdf");
    } else if (result.file) {
      respondWithFile(res, result.file, "pdf");
    } else if (result.files && result.files.length === 1) {
      respondWithFile(res, result.files[0], "pdf");
    } else {
      respond(res, { success: false, error: "No files produced" });
    }
  })
);

const HtmlPreviewRequestSchema = z.object({
  fileId: z.string(),
});

htmlRouter.post(
  "/tools/html-elements",
  validateBody(HtmlPreviewRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.body;

    const result = await getHtmlElements(sessionId, fileId);
    respond(res, { success: true, elements: result.elements });
  })
);

htmlRouter.post(
  "/tools/html-format",
  validateBody(HtmlFormatRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, operations } = req.body;

    const result = await formatHtmlElements(sessionId, fileId, operations);
    respondWithFile(res, result.file, "html");
  })
);

const HtmlCssRequestSchema = z.object({
  fileId: z.string(),
});

const UpdateCssRequestSchema = z.object({
  fileId: z.string(),
  styles: z.string(),
});

htmlRouter.post(
  "/tools/html-css",
  validateBody(HtmlCssRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.body;

    const result = await getCssStyles(sessionId, fileId);
    respond(res, { success: true, styles: result.styles, parsed: result.parsed, inlineStyles: result.inlineStyles, selectorUsage: result.selectorUsage });
  })
);

htmlRouter.post(
  "/tools/html-css/update",
  validateBody(UpdateCssRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, styles } = req.body;

    const result = await updateCssStyles(sessionId, fileId, styles);
    respondWithFile(res, result.file, "html");
  })
);

htmlRouter.get(
  "/tools/system-fonts",
  asyncHandler(async (_req: Request, res: Response) => {
    const fonts = await listSystemFonts();
    respond(res, { success: true, fonts });
  })
);

const SimplifyInlineRequestSchema = z.object({
  fileId: z.string(),
});

htmlRouter.post(
  "/tools/html-css/simplify",
  validateBody(SimplifyInlineRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.body;

    const result = await simplifyInlineStyles(sessionId, fileId);
    respondWithFile(res, result.file, "html", {
      classesCreated: result.classesCreated,
      elementsUpdated: result.elementsUpdated,
    });
  })
);

const RemoveClassRequestSchema = z.object({
  fileId: z.string(),
  className: z.string(),
});

htmlRouter.post(
  "/tools/html-css/remove-class",
  validateBody(RemoveClassRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, className } = req.body;

    const result = await removeCssClass(sessionId, fileId, className);
    respondWithFile(res, result.file, "html", {
      elementsUpdated: result.elementsUpdated,
    });
  })
);

const RemoveClassesRequestSchema = z.object({
  fileId: z.string(),
  classNames: z.array(z.string()).min(1),
});

htmlRouter.post(
  "/tools/html-css/remove-classes",
  validateBody(RemoveClassesRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, classNames } = req.body;

    const result = await removeCssClasses(sessionId, fileId, classNames);
    respondWithFile(res, result.file, "html", {
      classesRemoved: result.classesRemoved,
      elementsUpdated: result.elementsUpdated,
    });
  })
);

const RemoveClassMultiRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1),
  className: z.string(),
});

htmlRouter.post(
  "/tools/html-css-multi/remove-class",
  validateBody(RemoveClassMultiRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, className } = req.body;

    const result = await removeCssClassMulti(sessionId, fileIds, className);
    respondWithFiles(res, result.files, "html", {
      totalElementsUpdated: result.totalElementsUpdated,
    });
  })
);

const ReplaceClassMultiRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1),
  sourceClass: z.string(),
  targetClass: z.string(),
});

htmlRouter.post(
  "/tools/html-css-multi/replace-class",
  validateBody(ReplaceClassMultiRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, sourceClass, targetClass } = req.body;

    const result = await replaceCssClassMulti(sessionId, fileIds, sourceClass, targetClass);
    respondWithFiles(res, result.files, "html", {
      totalElementsUpdated: result.totalElementsUpdated,
    });
  })
);

htmlRouter.post(
  "/tools/html-clean",
  validateBody(CleanHtmlRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, settings } = req.body;

    const result = await cleanHtml(sessionId, fileId, settings || {});
    respondWithFile(res, result.file, "html", { stats: result.stats });
  })
);

const DownloadCssRequestSchema = z.object({
  fileId: z.string(),
  filename: z.string().optional(),
});

htmlRouter.post(
  "/tools/css/download",
  validateBody(DownloadCssRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, filename = "stylesheet.css" } = req.body;

    const result = await getCssStyles(sessionId, fileId);
    const cssContent = result.styles;

    res.setHeader("Content-Type", "text/css");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(cssContent);
  })
);

const MergeCssRequestSchema = z.object({
  fileId: z.string(),
  cssFileId: z.string(),
});

htmlRouter.post(
  "/tools/css/merge",
  validateBody(MergeCssRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, cssFileId } = req.body;

    const result = await getCssStyles(sessionId, fileId);
    const baseCss = result.styles;

    const cssFile = await fileManager.getFile(sessionId, cssFileId);
    if (!cssFile) {
      throw new Error("CSS file not found");
    }

    const tempPath = await fileManager.downloadToTempFile(sessionId, cssFileId);
    const newCss = await fs.readFile(tempPath, "utf8");
    await fs.unlink(tempPath).catch(() => {});

    const mergedCss = mergeStylesheets(baseCss, newCss, { priority: 'last' });

    const htmlTempPath = await fileManager.downloadToTempFile(sessionId, fileId);
    const htmlContent = await fs.readFile(htmlTempPath, "utf8");
    await fs.unlink(htmlTempPath).catch(() => {});

    const instructions = extractInstructions(htmlContent);
    const processedCss = applyInstructions(mergedCss, instructions);

    respond(res, { success: true, styles: processedCss });
  })
);

htmlRouter.get(
  "/files/:fileId/content",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId } = req.params;

    const file = await fileManager.getFile(sessionId, fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const tempPath = await fileManager.downloadToTempFile(sessionId, fileId);
    const content = await fs.readFile(tempPath, "utf8");
    await fs.unlink(tempPath).catch(() => {});

    respond(res, { success: true, content });
  })
);

const MultiCssRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1),
});

const UpdateMultiCssRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1),
  styles: z.string(),
});

htmlRouter.post(
  "/tools/html-css-multi",
  validateBody(MultiCssRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds } = req.body;

    const result = await getMultiCssStyles(sessionId, fileIds);
    respond(res, { success: true, ...result });
  })
);

htmlRouter.post(
  "/tools/html-css-multi/update",
  validateBody(UpdateMultiCssRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, styles } = req.body;

    const result = await updateMultiCssStyles(sessionId, fileIds, styles);
    respondWithFiles(res, result.files, "html");
  })
);

const AddRuleRequestSchema = z.object({
  fileId: z.string(),
  selector: z.string().min(1),
});

htmlRouter.post(
  "/tools/html-css/add-rule",
  validateBody(AddRuleRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, selector } = req.body;

    const result = await addCssRule(sessionId, fileId, selector);
    respondWithFile(res, result.file, "html", { selector: result.selector });
  })
);

const ReplaceClassRequestSchema = z.object({
  fileId: z.string(),
  sourceClass: z.string().min(1),
  targetClass: z.string().min(1),
});

htmlRouter.post(
  "/tools/html-css/replace-class",
  validateBody(ReplaceClassRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileId, sourceClass, targetClass } = req.body;

    const result = await replaceCssClass(sessionId, fileId, sourceClass, targetClass);
    respondWithFile(res, result.file, "html", { elementsUpdated: result.elementsUpdated });
  })
);

const CssFileRequestSchema = z.object({
  fileIds: z.array(z.string()).length(1),
});

htmlRouter.post(
  "/tools/css-file",
  validateBody(CssFileRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds } = req.body;

    const files = await fileManager.getFilesByIds(sessionId, fileIds);
    const cssFile = files.find(f => isCssFile(f.originalName));
    
    if (!cssFile) {
      throw new Error("No CSS file found");
    }

    const tempPath = await fileManager.downloadToTempFile(sessionId, cssFile.id);
    let styles: string;
    try {
      styles = await fs.readFile(tempPath, "utf-8");
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }

    const parsed = parseStylesheet(styles);
    
    respond(res, { 
      success: true, 
      styles,
      parsed,
      files: [{ id: cssFile.id, name: cssFile.originalName, size: cssFile.size }],
      inlineStyles: [],
      selectorUsage: [],
    });
  })
);

const UpdateCssFileRequestSchema = z.object({
  fileIds: z.array(z.string()).length(1),
  styles: z.string(),
});

htmlRouter.post(
  "/tools/css-file/update",
  validateBody(UpdateCssFileRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds, styles } = req.body;

    const files = await fileManager.getFilesByIds(sessionId, fileIds);
    const cssFile = files.find(f => isCssFile(f.originalName));
    
    if (!cssFile) {
      throw new Error("No CSS file found");
    }

    const updated = await fileManager.updateFileContent(sessionId, cssFile.id, styles);
    respondWithFiles(res, [updated], "css");
  })
);

