import JSZip from "jszip";
import { parseXML, getElementsByTagNameNS } from "../xml-helpers";

export async function findRootFilePath(zip: JSZip): Promise<string> {
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) {
    throw new Error("Invalid EPUB: missing container.xml");
  }
  
  const doc = parseXML(containerXml);
  const rootfiles = getElementsByTagNameNS(doc, null, "rootfile");
  
  if (rootfiles.length === 0) {
    throw new Error("Invalid EPUB: no rootfile found");
  }
  
  const fullPath = rootfiles[0].getAttribute("full-path");
  if (!fullPath) {
    throw new Error("Invalid EPUB: rootfile has no full-path");
  }
  
  return fullPath;
}
