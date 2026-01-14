import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
import { spawn } from "child_process";
import { OPS_NAMES, formatArg, extractTextFromArgs } from "./helpers";
import { createTextBlockState, handleTextBlockOperator } from "./handle-text-block-operator";
import type {
  DebugMode,
  PDFDebugInfo,
  PDFPageOperators,
  PDFPageTextBlocks,
  PDFPageTextElements,
  PDFPagePoppler,
  PDFOperator,
  PDFTextElement,
  PDFDebugInfoPoppler,
} from "./types";


function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return "str" in item && typeof item.str === "string";
}

export async function extractPDFElements(
  pdfPath: string,
  fileName: string,
  mode: DebugMode = "operators"
): Promise<PDFDebugInfo> {
  if (mode === "poppler") return extractPoppler(pdfPath, fileName);

  const loadingTask = getDocument({
    url: pdfPath,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  if (mode === "operators") {
    const pages = await extractOperators(pdf, numPages);
    await pdf.destroy();
    return { mode: "operators", fileName, numPages, pages };
  }

  if (mode === "textBlocks") {
    const pages = await extractTextBlocks(pdf, numPages);
    await pdf.destroy();
    return { mode: "textBlocks", fileName, numPages, pages };
  }

  const pages = await extractPdfjsText(pdf, numPages);
  await pdf.destroy();
  return { mode: "pdfjsText", fileName, numPages, pages };
}

async function extractOperators(pdf: any, numPages: number): Promise<PDFPageOperators[]> {
  const pages: PDFPageOperators[] = [];
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const operatorList = await page.getOperatorList();

    const operators: PDFOperator[] = [];
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const opCode = operatorList.fnArray[i];
      const opArgs = operatorList.argsArray[i];
      const opName = OPS_NAMES[opCode] || `unknown_${opCode}`;
      operators.push({
        name: opName,
        args: opArgs ? opArgs.map(formatArg) : [],
        text: extractTextFromArgs(opName, opArgs),
      });
    }
    pages.push({ pageNumber: pageNum, width: viewport.width, height: viewport.height, operators });
  }
  return pages;
}

async function extractTextBlocks(pdf: any, numPages: number): Promise<PDFPageTextBlocks[]> {
  const pages: PDFPageTextBlocks[] = [];
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const operatorList = await page.getOperatorList();

    const state = createTextBlockState();
    const blocks: { blockNumber: number; text: string; operatorCount: number }[] = [];

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const opCode = operatorList.fnArray[i];
      const opArgs = operatorList.argsArray[i];
      const opName = OPS_NAMES[opCode] || `unknown_${opCode}`;
      handleTextBlockOperator(state, opName, opArgs, blocks);
    }
    pages.push({ pageNumber: pageNum, width: viewport.width, height: viewport.height, blocks });
  }
  return pages;
}

async function extractPdfjsText(pdf: any, numPages: number): Promise<PDFPageTextElements[]> {
  const pages: PDFPageTextElements[] = [];
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const elements: PDFTextElement[] = [];
    for (const item of textContent.items) {
      if (isTextItem(item)) {
        const transform = item.transform;
        elements.push({
          type: "text",
          content: item.str,
          x: transform[4],
          y: viewport.height - transform[5],
          width: item.width,
          height: item.height,
          fontName: item.fontName,
          hasEOL: (item as any).hasEOL === true,
          dir: item.dir,
        });
      }
    }
    pages.push({ pageNumber: pageNum, width: viewport.width, height: viewport.height, elements });
  }
  return pages;
}

async function extractPoppler(pdfPath: string, fileName: string): Promise<PDFDebugInfoPoppler> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const proc = spawn('pdftotext', ['-layout', pdfPath, '-']);

    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on('data', (data: Buffer) => console.warn('pdftotext stderr:', data.toString()));
    proc.on('error', (err) => reject(new Error(`Failed to run pdftotext: ${err.message}`)));

    proc.on('close', (code) => {
      if (code !== 0) { reject(new Error(`pdftotext exited with code ${code}`)); return; }
      const fullText = Buffer.concat(chunks).toString('utf8');
      const pages: PDFPagePoppler[] = fullText.split('\f')
        .map((text, index) => ({ pageNumber: index + 1, text }))
        .filter(p => p.text.trim().length > 0);
      resolve({ mode: "poppler", fileName, numPages: pages.length, pages });
    });
  });
}
