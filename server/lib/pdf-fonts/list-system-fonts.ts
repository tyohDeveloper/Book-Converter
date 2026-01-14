import { spawn } from "child_process";
import { logger } from "../../common/logger";

const log = logger.child({ service: "system-fonts" });

export interface SystemFont {
  family: string;
}

export async function listSystemFonts(): Promise<SystemFont[]> {
  return new Promise((resolve) => {
    const proc = spawn("fc-list", [":", "family"], { stdio: ["ignore", "pipe", "pipe"] });
    
    let stdout = "";
    
    proc.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    
    proc.on("error", (err) => {
      log.warn("fc-list error", { error: err.message });
      resolve([]);
    });
    
    proc.on("close", (code) => {
      if (code !== 0) {
        log.warn("fc-list exited with error", { code });
        resolve([]);
        return;
      }
      
      const families = new Set<string>();
      const lines = stdout.split("\n");
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        const parts = trimmed.split(",");
        for (const part of parts) {
          const family = part.trim();
          if (family) families.add(family);
        }
      }
      
      const fonts = Array.from(families)
        .sort((a, b) => a.localeCompare(b))
        .map(family => ({ family }));
      
      log.debug("Listed system fonts", { count: fonts.length });
      resolve(fonts);
    });
  });
}
