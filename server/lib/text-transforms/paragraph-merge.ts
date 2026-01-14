import fs from "fs";
import readline from "readline";
import { getTempFilePath } from "../../domain/paths";
import { mergeParagraphsCore } from "./merge-paragraphs-core";

export async function mergeParagraphsFromFile(
  inputFile: string,
  sensitivity: number = 50,
  protectedLines?: Set<number>
): Promise<string> {
  const outputFile = getTempFilePath("merged");
  const writeStream = fs.createWriteStream(outputFile, { encoding: "utf8" });

  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile, { encoding: "utf8", highWaterMark: 64 * 1024 }),
    crlfDelay: Infinity,
  });

  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }

  const merged = mergeParagraphsCore(lines, { sensitivity, protectedLines });
  for (const paragraph of merged) {
    writeStream.write(paragraph + "\n");
  }

  await new Promise<void>((resolve, reject) => {
    writeStream.end(() => resolve());
    writeStream.on("error", reject);
  });

  return outputFile;
}

export function mergeParagraphs(
  text: string,
  sensitivity: number = 50,
  protectedLines?: Set<number>
): string {
  const lines = text.split("\n");
  const merged = mergeParagraphsCore(lines, { sensitivity, protectedLines });
  return merged.join("\n");
}
