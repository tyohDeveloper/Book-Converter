import fs from "fs";
import { getTempFilePath } from "../../domain/paths";

const PROTECTED_PATTERNS = [
  /^chapter\s+\d+/i,
  /^chapter\s+[ivxlcdm]+/i,
  /^part\s+\d+/i,
  /^part\s+[ivxlcdm]+/i,
  /^section\s+\d+/i,
  /^book\s+\d+/i,
  /^prologue/i,
  /^epilogue/i,
  /^introduction/i,
  /^conclusion/i,
  /^appendix/i,
  /^preface/i,
  /^foreword/i,
  /^acknowledgments/i,
  /^contents/i,
  /^table of contents/i,
];

function isProtected(line: string): boolean {
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(line));
}

export async function removeHeadersFootersFromFile(inputFile: string): Promise<string> {
  const outputFile = getTempFilePath("noheaders");

  const lineFrequency = new Map<string, number>();
  let totalLines = 0;

  await new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream(inputFile, { encoding: "utf8" });
    let buffer = "";

    readStream.on("data", (chunk: string | Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        totalLines++;
        if (trimmed) {
          lineFrequency.set(trimmed, (lineFrequency.get(trimmed) || 0) + 1);
        }
      }
    });

    readStream.on("end", () => resolve());
    readStream.on("error", reject);
  });

  const estimatedPages = Math.max(1, Math.floor(totalLines / 40));
  const threshold = Math.max(5, Math.floor(estimatedPages * 0.7));

  const repeatedLines = new Set<string>();
  lineFrequency.forEach((count, line) => {
    if (
      count >= threshold &&
      line.length < 50 &&
      !isProtected(line) &&
      !line.includes('"') &&
      !line.includes("'") &&
      !/^\d+\.\s/.test(line)
    ) {
      repeatedLines.add(line);
    }
  });

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(inputFile, { encoding: "utf8" });
    const writeStream = fs.createWriteStream(outputFile, { encoding: "utf8" });
    let buffer = "";

    readStream.on("data", (chunk: string | Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!repeatedLines.has(trimmed)) {
          writeStream.write(line + "\n");
        }
      }
    });

    readStream.on("end", () => {
      if (buffer.trim() && !repeatedLines.has(buffer.trim())) {
        writeStream.write(buffer);
      }

      writeStream.end(() => {
        try {
          fs.unlinkSync(inputFile);
        } catch (e) {}
        resolve(outputFile);
      });
    });

    readStream.on("error", (err) => {
      writeStream.end();
      reject(err);
    });
  });
}
