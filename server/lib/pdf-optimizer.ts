import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../common/logger";

const log = logger.child({ module: "pdf-optimizer" });

export interface OptimizationResult {
  success: boolean;
  originalSize: number;
  optimizedSize: number;
  reduction: number;
  outputPath: string;
  error?: string;
}

export interface OptimizationProgress {
  stage: "starting" | "processing" | "complete" | "error";
  message: string;
}

export interface OptimizationHandle {
  promise: Promise<OptimizationResult>;
  cancel: () => void;
}

export function optimizePDFWithHandle(
  inputPath: string,
  onProgress?: (progress: OptimizationProgress) => void
): OptimizationHandle {
  const originalSize = fs.statSync(inputPath).size;
  
  // Generate output path that handles any case extension
  const parsed = path.parse(inputPath);
  const outputPath = path.join(parsed.dir, `${parsed.name}_optimized${parsed.ext}`);

  onProgress?.({ stage: "starting", message: "Starting PDF optimization..." });

  let gsProcess: ChildProcess | null = null;
  let cancelled = false;

  const promise = new Promise<OptimizationResult>((resolve, reject) => {
    const args = [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/ebook",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      "-dCompressFonts=true",
      "-dSubsetFonts=true",
      "-dEmbedAllFonts=true",
      "-dDetectDuplicateImages=true",
      "-dCompressPages=true",
      "-dOptimize=true",
      `-sOutputFile=${outputPath}`,
      inputPath
    ];

    onProgress?.({ stage: "processing", message: "Compressing and optimizing PDF..." });

    const gs = spawn("gs", args);
    gsProcess = gs;

    let stderr = "";

    gs.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    gs.on("close", (code) => {
      if (code !== 0) {
        onProgress?.({ stage: "error", message: `Ghostscript failed: ${stderr}` });
        resolve({
          success: false,
          originalSize,
          optimizedSize: 0,
          reduction: 0,
          outputPath: "",
          error: stderr || `Ghostscript exited with code ${code}`
        });
        return;
      }

      if (!fs.existsSync(outputPath)) {
        onProgress?.({ stage: "error", message: "Output file was not created" });
        resolve({
          success: false,
          originalSize,
          optimizedSize: 0,
          reduction: 0,
          outputPath: "",
          error: "Output file was not created"
        });
        return;
      }

      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = ((originalSize - optimizedSize) / originalSize) * 100;

      onProgress?.({ 
        stage: "complete", 
        message: `Optimization complete! Reduced by ${reduction.toFixed(1)}%` 
      });

      resolve({
        success: true,
        originalSize,
        optimizedSize,
        reduction,
        outputPath
      });
    });

    gs.on("error", (err) => {
      onProgress?.({ stage: "error", message: `Failed to start Ghostscript: ${err.message}` });
      resolve({
        success: false,
        originalSize,
        optimizedSize: 0,
        reduction: 0,
        outputPath: "",
        error: `Failed to start Ghostscript: ${err.message}`
      });
    });
  });

  const cancel = () => {
    if (gsProcess && !cancelled) {
      cancelled = true;
      gsProcess.kill('SIGTERM');
      log.info("ghostscript process cancelled");
      // Cleanup partial output file
      try {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };

  return { promise, cancel };
}

export function cleanupOptimizedFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error: any) {
    log.warn("failed to cleanup optimized file", { path: filePath, error: error.message });
  }
}
