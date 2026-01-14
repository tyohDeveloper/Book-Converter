import fs from "fs";
import readline from "readline";
import { getTempFilePath } from "../../domain/paths";

const LIGATURE_MAP: Record<string, string> = {
  "\ufb00": "ff",
  "\ufb01": "fi",
  "\ufb02": "fl",
  "\ufb03": "ffi",
  "\ufb04": "ffl",
  "\ufb05": "ft",
  "\ufb06": "st",
  ff: "ff",
  fi: "fi",
  fl: "fl",
  ffi: "ffi",
  ffl: "ffl",
  Æ: "AE",
  æ: "ae",
  Œ: "OE",
  œ: "oe",
};

const LIGATURE_REGEX = new RegExp(
  Object.keys(LIGATURE_MAP)
    .filter((k) => k.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g"
);

export function fixLigatures(text: string): string {
  return text.replace(LIGATURE_REGEX, (match) => LIGATURE_MAP[match] || match);
}

export async function fixLigaturesFromFile(inputFile: string): Promise<string> {
  const outputFile = getTempFilePath("ligatures-fixed");
  const writeStream = fs.createWriteStream(outputFile, { encoding: "utf8" });

  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile, { encoding: "utf8", highWaterMark: 64 * 1024 }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const fixed = fixLigatures(line);
    writeStream.write(fixed + "\n");
  }

  await new Promise<void>((resolve, reject) => {
    writeStream.end(() => resolve());
    writeStream.on("error", reject);
  });

  try {
    await fs.promises.unlink(inputFile);
  } catch (e) {}

  return outputFile;
}
