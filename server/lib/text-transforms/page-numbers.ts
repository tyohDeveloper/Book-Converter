import fs from "fs";
import { getTempFilePath } from "../../domain/paths";

export async function removePageNumbersFromFile(inputFile: string): Promise<string> {
  const outputFile = getTempFilePath("nopagenums");

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
        if (/^\d+$/.test(trimmed)) continue;
        if (/^page \d+/i.test(trimmed)) continue;
        if (/^[-–—]\s*\d+\s*[-–—]$/.test(trimmed)) continue;
        writeStream.write(line + "\n");
      }
    });

    readStream.on("end", () => {
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (!/^\d+$/.test(trimmed) && !/^page \d+/i.test(trimmed)) {
          writeStream.write(buffer);
        }
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

export function removePageNumbers(text: string): string {
  const lines = text.split("\n");
  return lines
    .filter((line) => {
      const trimmed = line.trim();
      if (/^\d+$/.test(trimmed)) return false;
      if (/^page \d+/i.test(trimmed)) return false;
      if (/^[-–—]\s*\d+\s*[-–—]$/.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}
