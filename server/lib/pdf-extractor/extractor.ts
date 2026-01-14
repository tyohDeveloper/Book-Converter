import { spawn } from 'child_process';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { CHAPTER_PATTERNS_STRICT, isChapterHeading } from '../../domain/chapter';
import { getTempFilePath } from '../../domain/paths';
import type { ExtractedChapter, ExtractionHandle, ExtractionProgress, ExtractionResult } from './types';
import { logger } from '../../common/logger';

const log = logger.child({ module: "pdf-extractor" });

const MAX_PREVIEW = 5000;

async function getPdfPageCount(pdfPath: string): Promise<number> {
  try {
    const pdfInfo = spawn('pdfinfo', [pdfPath]);
    const infoOutput = await new Promise<string>((res) => {
      let data = '';
      pdfInfo.stdout.on('data', (chunk) => { data += chunk; });
      pdfInfo.on('close', () => res(data));
      pdfInfo.on('error', () => res(''));
    });
    const pageMatch = infoOutput.match(/Pages:\s*(\d+)/);
    if (pageMatch) {
      return parseInt(pageMatch[1], 10);
    }
  } catch (e) {}
  return 0;
}

export function extractPDFText(
  pdfPath: string,
  detectChapters: boolean,
  onProgress?: (progress: ExtractionProgress) => void
): ExtractionHandle {
  let cancelled = false;
  let childProcess: ReturnType<typeof spawn> | null = null;

  const promise = new Promise<ExtractionResult>(async (resolve) => {
    const tempTextFile = getTempFilePath('extracted');
    const chapters: ExtractedChapter[] = [];
    let previewText = '';
    let totalChars = 0;

    onProgress?.({ stage: 'starting', percent: 0, message: 'Starting text extraction...' });

    try {
      const totalPages = await getPdfPageCount(pdfPath);

      onProgress?.({ stage: 'extracting', percent: 5, message: 'Extracting text from PDF...' });

      childProcess = spawn('pdftotext', ['-layout', pdfPath, '-']);

      const writeStream = fs.createWriteStream(tempTextFile, { encoding: 'utf8' });
      let currentPage = 1;
      let lineBuffer = '';
      let lastProgressUpdate = 0;

      childProcess.stdout?.on('data', (chunk: Buffer) => {
        if (cancelled) return;

        const text = chunk.toString('utf8');
        writeStream.write(text);
        totalChars += text.length;

        if (previewText.length < MAX_PREVIEW) {
          previewText += text.substring(0, MAX_PREVIEW - previewText.length);
        }

        if (detectChapters) {
          lineBuffer += text;
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0 && trimmed.length < 100) {
              if (isChapterHeading(trimmed, CHAPTER_PATTERNS_STRICT)) {
                chapters.push({ title: trimmed, page: currentPage });
              }
            }

            if (line.includes('\f') || line.match(/^\s*$/)) {
              currentPage++;
            }
          }
        }

        if (totalPages > 0) {
          const percent = Math.min(90, 5 + Math.floor((currentPage / totalPages) * 85));
          if (percent >= lastProgressUpdate + 10) {
            lastProgressUpdate = percent;
            onProgress?.({ stage: 'extracting', percent, message: `Extracting text... ${percent}%` });
          }
        }
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        log.warn("pdftotext stderr", { message: data.toString() });
      });

      await new Promise<void>((res, rej) => {
        childProcess!.on('close', (code) => {
          writeStream.end();
          if (code === 0 || cancelled) res();
          else rej(new Error(`pdftotext exited with code ${code}`));
        });
        childProcess!.on('error', (err) => {
          writeStream.end();
          rej(err);
        });
      });

      if (cancelled) {
        await fsPromises.unlink(tempTextFile).catch(() => {});
        resolve({
          success: false,
          chapters: [],
          totalPages: 0,
          previewText: '',
          error: 'Extraction cancelled'
        });
        return;
      }

      if (chapters.length === 0) {
        chapters.push({ title: 'Content', page: 1 });
      }

      onProgress?.({ stage: 'complete', percent: 100, message: 'Text extraction complete' });

      resolve({
        success: true,
        tempTextFile,
        chapters,
        totalPages: totalPages || currentPage,
        previewText
      });

    } catch (error: any) {
      onProgress?.({ stage: 'error', percent: 0, message: error.message });
      await fsPromises.unlink(tempTextFile).catch(() => {});
      resolve({
        success: false,
        chapters: [],
        totalPages: 0,
        previewText: '',
        error: error.message
      });
    }
  });

  const cancel = () => {
    cancelled = true;
    if (childProcess) {
      childProcess.kill('SIGTERM');
    }
  };

  return { promise, cancel };
}
