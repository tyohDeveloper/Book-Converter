import fs from "fs";
import readline from "readline";
import { getTempFilePath } from "../../domain/paths";

export async function fixHyphenationFromFile(inputFile: string): Promise<string> {
  const outputFile = getTempFilePath("hyphenation-fixed");
  const writeStream = fs.createWriteStream(outputFile, { encoding: "utf8" });

  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile, { encoding: "utf8", highWaterMark: 64 * 1024 }),
    crlfDelay: Infinity,
  });

  let previousLine: string | null = null;
  let pendingHyphenatedWord = "";

  for await (const line of rl) {
    let currentLine = line;

    if (pendingHyphenatedWord) {
      const firstWordMatch = currentLine.match(/^(\s*)(\S+)/);
      if (firstWordMatch) {
        const leadingSpace = firstWordMatch[1];
        const firstWord = firstWordMatch[2];
        const mergedWord = pendingHyphenatedWord + firstWord;
        currentLine = currentLine.substring(leadingSpace.length + firstWord.length);
        previousLine = (previousLine ?? "").slice(0, -1) + mergedWord;
      }
      pendingHyphenatedWord = "";
    }

    if (previousLine !== null) {
      writeStream.write(previousLine + "\n");
    }

    if (currentLine.endsWith("-") && currentLine.length > 1) {
      const wordMatch = currentLine.match(/(\S+)-$/);
      if (wordMatch) {
        pendingHyphenatedWord = wordMatch[1];
        previousLine = currentLine;
      } else {
        previousLine = currentLine;
      }
    } else {
      previousLine = currentLine;
    }
  }

  if (previousLine !== null) {
    writeStream.write(previousLine + "\n");
  }

  await new Promise<void>((resolve, reject) => {
    writeStream.end(() => resolve());
    writeStream.on("error", reject);
  });

  try {
    fs.unlinkSync(inputFile);
  } catch (e) {}

  return outputFile;
}
