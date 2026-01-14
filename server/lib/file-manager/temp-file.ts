import fs from "fs/promises";

export async function withTempFile<T>(
  tempPath: string,
  fn: (path: string) => Promise<T>
): Promise<T> {
  try {
    return await fn(tempPath);
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

export async function withTempFiles<T>(
  tempPaths: string[],
  fn: (paths: string[]) => Promise<T>
): Promise<T> {
  try {
    return await fn(tempPaths);
  } finally {
    await Promise.all(
      tempPaths.map(path => fs.unlink(path).catch(() => {}))
    );
  }
}

export class TempFileCollector {
  private paths: string[] = [];
  
  add(path: string): void {
    this.paths.push(path);
  }
  
  addAll(paths: string[]): void {
    this.paths.push(...paths);
  }
  
  async cleanup(): Promise<void> {
    await Promise.all(
      this.paths.map(path => fs.unlink(path).catch(() => {}))
    );
    this.paths = [];
  }
  
  getPaths(): string[] {
    return [...this.paths];
  }
}
