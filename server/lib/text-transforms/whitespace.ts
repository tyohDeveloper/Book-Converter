import fs from "fs";
import { getTempFilePath } from "../../domain/paths";

// Custom trim that preserves form-feed (page break) characters
function trimPreservingFormFeed(line: string): string {
  // Extract any form-feed characters from the line
  const hasFormFeed = line.includes('\f');
  // Standard trim to remove regular whitespace
  let trimmed = line.trim();
  // If the original had a form-feed, ensure it's preserved at the end
  if (hasFormFeed && !trimmed.includes('\f')) {
    trimmed = trimmed + '\f';
  }
  return trimmed;
}

export async function cleanWhitespaceFromFile(inputFile: string): Promise<string> {
  const outputFile = getTempFilePath("cleanws");

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(inputFile, { encoding: "utf8" });
    const writeStream = fs.createWriteStream(outputFile, { encoding: "utf8" });

    let buffer = "";
    let consecutiveEmpty = 0;

    readStream.on("data", (chunk: string | Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = trimPreservingFormFeed(line);

        if (trimmed === "" || trimmed === "\f") {
          // A line with only form-feed is a page break - preserve it
          if (trimmed === "\f") {
            consecutiveEmpty = 0;
            writeStream.write("\f\n");
          } else {
            consecutiveEmpty++;
            if (consecutiveEmpty === 1) {
              writeStream.write("\n");
            }
          }
        } else {
          consecutiveEmpty = 0;
          writeStream.write(trimmed + "\n");
        }
      }
    });

    readStream.on("end", () => {
      const trimmed = trimPreservingFormFeed(buffer);
      if (trimmed && trimmed !== "\f") {
        writeStream.write(trimmed + "\n");
      } else if (trimmed === "\f") {
        writeStream.write("\f\n");
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
