import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import puppeteer from "puppeteer";
import { fileManager } from "../../lib/file-manager/file-manager";
import type { ManagedFile } from "../../lib/file-manager/types";
import { sanitizeFilename } from "../../lib/file-manager/sanitize";
import { isHtmlFile } from "../../lib/file-manager/is-html-file";
import { isCssFile } from "../../lib/file-manager/is-css-file";
import { ConversionError } from "../../common/errors/specific-errors";
import { logger } from "../../common/logger";
import { config } from "../../common/config";
import { buildPrintCss } from "../../lib/pdf/build-print-css";
import type { HtmlToPdfSettings } from "@shared/contracts/html";
import { defaultPdfDesignRules, type PdfDesignRules } from "@shared/contracts/pdf-design-rules";

const log = logger.child({ service: "html-to-pdf" });

function mergeDesignRulesWithDefaults(rules?: PdfDesignRules): PdfDesignRules {
  if (!rules) return defaultPdfDesignRules;
  
  return {
    ...defaultPdfDesignRules,
    ...rules,
    pageNumbers: {
      ...defaultPdfDesignRules.pageNumbers,
      ...rules.pageNumbers,
    },
    typography: {
      ...defaultPdfDesignRules.typography,
      ...rules.typography,
    },
    pageBreaks: {
      ...defaultPdfDesignRules.pageBreaks,
      ...rules.pageBreaks,
    },
  };
}

function findChromiumPath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    try {
      return execSync("which chromium-browser", { encoding: "utf8" }).trim();
    } catch {
      throw new ConversionError("Chromium not found. Please install chromium.");
    }
  }
}

export interface HtmlToPdfResult {
  file?: ManagedFile;
  files?: ManagedFile[];
}

async function injectStylesIntoHtml(
  htmlContent: string,
  designRulesCss: string,
  stylesheetCss?: string
): Promise<string> {
  let injectedCss = "";
  
  if (stylesheetCss) {
    injectedCss += `<style type="text/css">\n${stylesheetCss}\n</style>\n`;
  }
  
  if (designRulesCss) {
    injectedCss += `<style type="text/css">\n${designRulesCss}\n</style>\n`;
  }

  if (!injectedCss) return htmlContent;

  if (htmlContent.includes("</head>")) {
    return htmlContent.replace("</head>", `${injectedCss}</head>`);
  } else if (htmlContent.includes("<body")) {
    return htmlContent.replace(/<body/i, `${injectedCss}<body`);
  } else {
    return injectedCss + htmlContent;
  }
}

async function convertSingleHtmlToPdf(
  sessionId: string,
  fileId: string,
  settings: HtmlToPdfSettings,
  browser: Awaited<ReturnType<typeof puppeteer.launch>>,
  stylesheetCss: string | undefined,
  designRulesCss: string,
  tempFilePaths: string[]
): Promise<ManagedFile> {
  const file = await fileManager.getFile(sessionId, fileId);
  if (!file) {
    throw new ConversionError("File not found");
  }

  if (!isHtmlFile(file.originalName)) {
    throw new ConversionError(`File must be an HTML file: ${file.originalName}`);
  }

  const fileTitle = file.originalName.replace(/\.(html?|xhtml)$/i, "");
  log.info("Converting HTML to PDF", { fileName: file.originalName });

  const tempFilePath = await fileManager.downloadToTempFile(sessionId, fileId);
  tempFilePaths.push(tempFilePath);

  let htmlContent = await fs.readFile(tempFilePath, "utf-8");
  htmlContent = await injectStylesIntoHtml(htmlContent, designRulesCss, stylesheetCss);

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfOptions: Parameters<typeof page.pdf>[0] = {
    format: settings.paperSize === "a4" ? "A4" : "Letter",
    landscape: settings.landscape || false,
    printBackground: true,
    displayHeaderFooter: settings.designRules?.pageNumbers?.enabled || false,
    margin: {
      top: settings.margin?.top || "1in",
      right: settings.margin?.right || "1in",
      bottom: settings.margin?.bottom || "1in",
      left: settings.margin?.left || "1in",
    },
  };

  if (settings.designRules?.pageNumbers?.enabled) {
    const pn = settings.designRules.pageNumbers;
    const formatMap: Record<string, string> = {
      "numeric": "<span class='pageNumber'></span>",
      "roman-lower": "<span class='pageNumber'></span>",
      "roman-upper": "<span class='pageNumber'></span>",
      "alpha-lower": "<span class='pageNumber'></span>",
      "alpha-upper": "<span class='pageNumber'></span>",
    };
    const pageNumberHtml = `${pn.prefix || ""}${formatMap[pn.format || "numeric"]}${pn.suffix || ""}`;
    const style = `font-size: ${pn.fontSize || "10pt"}; width: 100%; text-align: center;`;
    
    if (pn.position?.startsWith("bottom")) {
      pdfOptions.footerTemplate = `<div style="${style}">${pageNumberHtml}</div>`;
      pdfOptions.headerTemplate = "<div></div>";
    } else {
      pdfOptions.headerTemplate = `<div style="${style}">${pageNumberHtml}</div>`;
      pdfOptions.footerTemplate = "<div></div>";
    }
  }

  const pdfBuffer = await page.pdf(pdfOptions);
  await page.close();

  const pdfTempPath = path.join(config.uploads.baseDir, `html-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  await fs.writeFile(pdfTempPath, pdfBuffer);
  tempFilePaths.push(pdfTempPath);

  const pdfFileName = `${sanitizeFilename(settings.title || fileTitle)}.pdf`;
  const outputFile = await fileManager.addOutputFile(sessionId, pdfFileName, pdfTempPath, "pdf");

  log.info("PDF saved from HTML", { fileName: pdfFileName, fileId: outputFile.id });
  return outputFile;
}

export async function convertHtmlToPdf(
  sessionId: string,
  fileId: string,
  settings: HtmlToPdfSettings = {}
): Promise<HtmlToPdfResult> {
  return convertHtmlsToPdf(sessionId, [fileId], settings);
}

export async function convertHtmlsToPdf(
  sessionId: string,
  fileIds: string[],
  settings: HtmlToPdfSettings = {}
): Promise<HtmlToPdfResult> {
  const tempFilePaths: string[] = [];
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    if (fileIds.length === 0) {
      throw new ConversionError("No files provided");
    }

    const chromiumPath = findChromiumPath();
    log.info("Using Chromium at", { path: chromiumPath, fileCount: fileIds.length });
    
    browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    const designRules = mergeDesignRulesWithDefaults(settings.designRules);
    const designRulesCss = buildPrintCss(designRules);

    let stylesheetCss: string | undefined;
    if (designRules.stylesheetFileId) {
      const stylesheetFile = await fileManager.getFile(sessionId, designRules.stylesheetFileId);
      if (stylesheetFile && isCssFile(stylesheetFile.originalName)) {
        const cssPath = await fileManager.downloadToTempFile(sessionId, designRules.stylesheetFileId);
        tempFilePaths.push(cssPath);
        stylesheetCss = await fs.readFile(cssPath, "utf-8");
        log.info("Using stylesheet", { fileName: stylesheetFile.originalName });
      }
    }

    const outputFiles: ManagedFile[] = [];
    for (const fileId of fileIds) {
      const outputFile = await convertSingleHtmlToPdf(
        sessionId,
        fileId,
        settings,
        browser,
        stylesheetCss,
        designRulesCss,
        tempFilePaths
      );
      outputFiles.push(outputFile);
    }

    if (outputFiles.length === 1) {
      return { file: outputFiles[0] };
    }
    return { files: outputFiles };
  } finally {
    if (browser) {
      await browser.close();
    }
    for (const tempPath of tempFilePaths) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}
