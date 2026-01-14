import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../common/errors/error-middleware";
import { ValidationError } from "../common/errors/specific-errors";
import { getSessionId, respond } from "../common/http";
import { fileManager } from "../lib/file-manager/file-manager";
import type { ManagedFile } from "../lib/file-manager/types";
import type { ParsedStylesheet } from "@shared/contracts/css-editor";
import type { VisualStyles } from "../lib/css/visual-styles/types";
import { parseStylesheet } from "../lib/css/parse-stylesheet";
import { stylesheetToCss } from "../lib/css/stylesheet-to-css";
import { declarationsToVisualStyles } from "../lib/css/visual-styles/declarations-to-visual-styles";
import { visualStylesToDeclarations } from "../lib/css/visual-styles/visual-styles-to-declarations";
import { getSelectors } from "../lib/css/get-selectors";
import { getRuleDeclarations } from "../lib/css/get-rule-declarations";
import { extractOutline } from "../services/html-outline-service";

export const toolsRouter = Router();

type ToolSection = "html" | "pdf" | "epub" | "docx";

interface FileCounts {
  total: number;
  pdf: number;
  docx: number;
  epub: number;
  html: number;
  css: number;
}

interface ToolMetadata {
  id: string;
  path: string;
  iconName: string;
  title: string;
  description: string;
  section: ToolSection;
  requiresSingleFile?: boolean;
}

interface ToolDefinition extends ToolMetadata {
  getEnabled: (counts: FileCounts) => boolean;
  getSelectedCount: (counts: FileCounts) => number;
}

interface ToolAvailability extends ToolMetadata {
  enabled: boolean;
  selectedCount: number;
  link: string;
  selectionMessage: string | null;
}

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const EPUB_MIME = "application/epub+zip";
const HTML_MIMES = ["text/html", "application/xhtml+xml"];
const CSS_MIME = "text/css";

function isPdfFile(file: ManagedFile): boolean {
  return file.mimeType === PDF_MIME;
}

function isDocxFile(file: ManagedFile): boolean {
  return file.mimeType === DOCX_MIME;
}

function isEpubFile(file: ManagedFile): boolean {
  return file.mimeType === EPUB_MIME;
}

function isHtmlFile(file: ManagedFile): boolean {
  return HTML_MIMES.includes(file.mimeType);
}

function isCssFile(file: ManagedFile): boolean {
  return file.mimeType === CSS_MIME || file.originalName.toLowerCase().endsWith('.css');
}

const isNotOnlyDocx = (c: FileCounts) => c.total === 0 || c.docx < c.total;

const sectionTitles: Record<ToolSection, string> = {
  html: "HTML Tools",
  pdf: "PDF Tools",
  epub: "EPUB Tools",
  docx: "DOCX Tools",
};

const toolDefinitions: ToolDefinition[] = [
  {
    id: "paste-html",
    path: "/tools/paste-html",
    iconName: "ClipboardPaste",
    title: "Paste HTML",
    description: "Create HTML files from clipboard content",
    section: "html",
    getEnabled: () => true,
    getSelectedCount: () => 0,
  },
  {
    id: "format-html",
    path: "/tools/format-html",
    iconName: "Type",
    title: "Edit Elements",
    description: "Change tags, split, merge, or insert elements",
    section: "html",
    requiresSingleFile: true,
    getEnabled: (c) => c.html === 1 && c.pdf === 0 && c.docx === 0 && c.epub === 0,
    getSelectedCount: (c) => c.html,
  },
  {
    id: "edit-styles",
    path: "/tools/edit-styles",
    iconName: "Palette",
    title: "Edit Styles",
    description: "Edit fonts, colors, spacing (CSS)",
    section: "html",
    getEnabled: (c) => (c.html >= 1 || c.css === 1) && c.pdf === 0 && c.docx === 0 && c.epub === 0 && !(c.html > 0 && c.css > 0),
    getSelectedCount: (c) => c.html + c.css,
  },
  {
    id: "view-raw",
    path: "/tools/view-raw",
    iconName: "FileCode",
    title: "View & Edit Raw",
    description: "View and edit HTML file as raw text",
    section: "html",
    requiresSingleFile: true,
    getEnabled: (c) => c.html === 1 && c.pdf === 0 && c.docx === 0 && c.epub === 0,
    getSelectedCount: (c) => c.html,
  },
  {
    id: "bundle-html",
    path: "/tools/bundle-html",
    iconName: "Merge",
    title: "Bundle HTML",
    description: "Combine multiple HTML files into one",
    section: "html",
    getEnabled: (c) => c.html >= 2 && c.pdf === 0 && c.docx === 0 && c.epub === 0,
    getSelectedCount: (c) => c.html,
  },
  {
    id: "split-html",
    path: "/tools/split-html",
    iconName: "Scissors",
    title: "Split HTML",
    description: "Extract chapters or sections as individual files",
    section: "html",
    requiresSingleFile: true,
    getEnabled: (c) => c.html === 1 && c.pdf === 0 && c.docx === 0 && c.epub === 0,
    getSelectedCount: (c) => c.html,
  },
  {
    id: "clean-html",
    path: "/tools/clean-html",
    iconName: "Eraser",
    title: "Clean HTML",
    description: "Remove empty spans, whitespace styles, stray br tags",
    section: "html",
    requiresSingleFile: true,
    getEnabled: (c) => c.html === 1 && c.pdf === 0 && c.docx === 0 && c.epub === 0,
    getSelectedCount: (c) => c.html,
  },
  {
    id: "convert-html",
    path: "/tools/convert-html",
    iconName: "Code2",
    title: "Convert PDF to HTML",
    description: "Generate styled HTML document from PDFs",
    section: "pdf",
    getEnabled: (c) => c.pdf > 0 && isNotOnlyDocx(c),
    getSelectedCount: (c) => c.pdf,
  },
  {
    id: "convert-html-to-pdf",
    path: "/tools/convert-html-to-pdf",
    iconName: "FileOutput",
    title: "Convert HTML to PDF",
    description: "Create PDF documents from HTML files",
    section: "html",
    getEnabled: (c) => c.html >= 1 && c.pdf === 0 && c.docx === 0 && c.epub === 0,
    getSelectedCount: (c) => c.html,
  },
  {
    id: "structure",
    path: "/tools/structure",
    iconName: "Layers",
    title: "Analyze Structure",
    description: "View PDF metadata, fonts, images, and page info",
    section: "pdf",
    getEnabled: (c) => c.pdf > 0 && isNotOnlyDocx(c),
    getSelectedCount: (c) => c.pdf,
  },
  {
    id: "compress",
    path: "/tools/compress",
    iconName: "Shrink",
    title: "Compress PDF",
    description: "Reduce file size using Ghostscript optimization",
    section: "pdf",
    requiresSingleFile: true,
    getEnabled: (c) => c.pdf === 1 && c.docx === 0,
    getSelectedCount: (c) => c.pdf,
  },
  {
    id: "combine",
    path: "/tools/combine",
    iconName: "Combine",
    title: "Combine PDFs",
    description: "Merge multiple PDFs into one document",
    section: "pdf",
    getEnabled: (c) => c.pdf >= 2 && c.docx === 0,
    getSelectedCount: (c) => c.pdf,
  },
  {
    id: "debug",
    path: "/tools/debug",
    iconName: "Bug",
    title: "PDF Debugger",
    description: "View raw PDF structure, elements, and text content",
    section: "pdf",
    requiresSingleFile: true,
    getEnabled: (c) => c.pdf === 1 && c.docx === 0,
    getSelectedCount: (c) => c.pdf,
  },
  {
    id: "convert",
    path: "/tools/convert",
    iconName: "BookOpen",
    title: "Convert HTML to EPUB",
    description: "Create an eBook from HTML files",
    section: "epub",
    getEnabled: (c) => c.total > 0 && isNotOnlyDocx(c),
    getSelectedCount: (c) => c.total,
  },
  {
    id: "convert-epub",
    path: "/tools/convert-epub",
    iconName: "FileText",
    title: "EPUB to HTML",
    description: "Extract content from EPUB files as HTML",
    section: "epub",
    getEnabled: (c) => c.epub >= 1 && c.pdf === 0 && c.docx === 0,
    getSelectedCount: (c) => c.epub,
  },
  {
    id: "split-epub",
    path: "/tools/split-epub",
    iconName: "Scissors",
    title: "Split EPUB",
    description: "Extract chapters as individual HTML files",
    section: "epub",
    requiresSingleFile: true,
    getEnabled: (c) => c.epub === 1 && c.pdf === 0 && c.docx === 0,
    getSelectedCount: (c) => c.epub,
  },
  {
    id: "convert-docx",
    path: "/tools/convert-docx",
    iconName: "FileType",
    title: "Convert DOCX",
    description: "Convert Word documents to HTML, EPUB, or PDF",
    section: "docx",
    getEnabled: (c) => c.docx >= 1 && c.pdf === 0 && c.epub === 0,
    getSelectedCount: (c) => c.docx,
  },
  {
    id: "convert-html-to-docx",
    path: "/tools/convert-html-to-docx",
    iconName: "FileOutput",
    title: "Convert HTML to DOCX",
    description: "Create a Word document from HTML files",
    section: "docx",
    getEnabled: (c) => c.html >= 1 && c.pdf === 0 && c.docx === 0 && c.epub === 0,
    getSelectedCount: (c) => c.html,
  },
];

toolsRouter.post(
  "/css/parse",
  asyncHandler(async (req: Request, res: Response) => {
    const { css } = req.body;
    if (typeof css !== "string") {
      throw new ValidationError("css must be a string");
    }
    const parsed = parseStylesheet(css);
    respond(res, { parsed });
  })
);

toolsRouter.post(
  "/css/build",
  asyncHandler(async (req: Request, res: Response) => {
    const { parsed } = req.body;
    if (!parsed || typeof parsed !== "object") {
      throw new ValidationError("parsed must be a ParsedStylesheet object");
    }
    if (!Array.isArray(parsed.imports)) {
      throw new ValidationError("parsed.imports must be an array");
    }
    if (!Array.isArray(parsed.rules)) {
      throw new ValidationError("parsed.rules must be an array");
    }
    for (const rule of parsed.rules) {
      if (typeof rule.selector !== "string") {
        throw new ValidationError("Each rule must have a selector string");
      }
      if (rule.declarations && typeof rule.declarations !== "object") {
        throw new ValidationError("Rule declarations must be an object");
      }
    }
    const css = stylesheetToCss(parsed as ParsedStylesheet);
    respond(res, { css });
  })
);

toolsRouter.post(
  "/css/visual-to-declarations",
  asyncHandler(async (req: Request, res: Response) => {
    const { styles } = req.body;
    if (!styles || typeof styles !== "object") {
      throw new ValidationError("styles must be a VisualStyles object");
    }
    if (!styles.typography || typeof styles.typography !== "object") {
      throw new ValidationError("styles.typography must be an object");
    }
    if (!styles.colors || typeof styles.colors !== "object") {
      throw new ValidationError("styles.colors must be an object");
    }
    if (!styles.spacing || typeof styles.spacing !== "object") {
      throw new ValidationError("styles.spacing must be an object");
    }
    if (!styles.text || typeof styles.text !== "object") {
      throw new ValidationError("styles.text must be an object");
    }
    const declarations = visualStylesToDeclarations(styles as VisualStyles);
    respond(res, { declarations });
  })
);

toolsRouter.post(
  "/css/declarations-to-visual",
  asyncHandler(async (req: Request, res: Response) => {
    const { declarations } = req.body;
    if (!declarations || typeof declarations !== "object") {
      throw new ValidationError("declarations must be an object");
    }
    const styles = declarationsToVisualStyles(declarations as Record<string, string>);
    respond(res, { styles });
  })
);

toolsRouter.post(
  "/css/selectors",
  asyncHandler(async (req: Request, res: Response) => {
    const { parsed } = req.body;
    if (!parsed || typeof parsed !== "object") {
      throw new ValidationError("parsed must be a ParsedStylesheet object");
    }
    if (!Array.isArray(parsed.rules)) {
      throw new ValidationError("parsed.rules must be an array");
    }
    const selectors = getSelectors(parsed as ParsedStylesheet);
    respond(res, { selectors });
  })
);

toolsRouter.post(
  "/css/rule-declarations",
  asyncHandler(async (req: Request, res: Response) => {
    const { parsed, selector } = req.body;
    if (!parsed || typeof parsed !== "object") {
      throw new ValidationError("parsed must be a ParsedStylesheet object");
    }
    if (!Array.isArray(parsed.rules)) {
      throw new ValidationError("parsed.rules must be an array");
    }
    if (typeof selector !== "string") {
      throw new ValidationError("selector must be a string");
    }
    const declarations = getRuleDeclarations(parsed as ParsedStylesheet, selector);
    respond(res, { declarations });
  })
);

toolsRouter.post(
  "/html/outline",
  asyncHandler(async (req: Request, res: Response) => {
    const { html, fileId } = req.body;
    
    let content: string;
    
    if (typeof html === "string") {
      content = html;
    } else if (typeof fileId === "string") {
      const sessionId = getSessionId(req);
      const file = await fileManager.getFile(sessionId, fileId);
      if (!file) {
        throw new ValidationError("File not found");
      }
      
      const isHtml = file.mimeType === "text/html" || file.mimeType === "application/xhtml+xml";
      if (!isHtml) {
        throw new ValidationError("File must be an HTML or XHTML file");
      }
      
      const fs = await import("fs/promises");
      const tempPath = await fileManager.downloadToTempFile(sessionId, fileId);
      try {
        content = await fs.readFile(tempPath, "utf-8");
      } finally {
        await fs.unlink(tempPath).catch(() => {});
      }
    } else {
      throw new ValidationError("Either 'html' (string) or 'fileId' (string) must be provided");
    }
    
    const outline = extractOutline(content);
    respond(res, { outline });
  })
);

toolsRouter.post(
  "/tools/available",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const { fileIds } = req.body;

    if (fileIds !== undefined && !Array.isArray(fileIds)) {
      throw new ValidationError("fileIds must be an array");
    }
    
    const fileIdArray: string[] = Array.isArray(fileIds) ? fileIds : [];
    
    let counts: FileCounts;
    
    if (fileIdArray.length === 0) {
      counts = { total: 0, pdf: 0, docx: 0, epub: 0, html: 0, css: 0 };
    } else {
      const files: ManagedFile[] = await fileManager.getFilesByIds(sessionId, fileIdArray);
      
      if (files.length !== fileIdArray.length) {
        const foundIds = new Set(files.map(f => f.id));
        const missingIds = fileIdArray.filter(id => !foundIds.has(id));
        throw new ValidationError(`Some requested files were not found: ${missingIds.join(", ")}`);
      }
      
      counts = {
        total: files.length,
        pdf: files.filter(isPdfFile).length,
        docx: files.filter(isDocxFile).length,
        epub: files.filter(isEpubFile).length,
        html: files.filter(isHtmlFile).length,
        css: files.filter(isCssFile).length,
      };
    }

    function buildToolLink(basePath: string, requiresSingleFile?: boolean): string {
      if (fileIdArray.length === 0) return basePath;
      if (requiresSingleFile && fileIdArray.length === 1) {
        return `${basePath}?file=${fileIdArray[0]}`;
      }
      return `${basePath}?files=${fileIdArray.join(',')}`;
    }

    function getSelectionMessage(selectedCount: number, requiresSingleFile?: boolean): string | null {
      if (requiresSingleFile) {
        if (selectedCount === 1) return "1 file selected";
        if (selectedCount > 1) return "Select only 1 file";
        return null;
      }
      if (selectedCount > 0) {
        return `${selectedCount} file${selectedCount !== 1 ? 's' : ''} selected`;
      }
      return null;
    }

    const tools: ToolAvailability[] = toolDefinitions.map(tool => {
      const enabled = tool.getEnabled(counts);
      const selectedCount = tool.getSelectedCount(counts);
      return {
        id: tool.id,
        path: tool.path,
        iconName: tool.iconName,
        title: tool.title,
        description: tool.description,
        section: tool.section,
        requiresSingleFile: tool.requiresSingleFile,
        enabled,
        selectedCount,
        link: enabled ? buildToolLink(tool.path, tool.requiresSingleFile) : '#',
        selectionMessage: getSelectionMessage(selectedCount, tool.requiresSingleFile),
      };
    });

    respond(res, { tools, counts, sectionTitles });
  })
);
