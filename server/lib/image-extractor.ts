import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { UPLOADS_BASE } from "../domain/paths";

export interface ExtractedImage {
  id: string;
  filename: string;
  path: string;
  page: number;
  width: number;
  height: number;
  type: string;
}

export interface ImageExtractionResult {
  success: boolean;
  images: ExtractedImage[];
  error?: string;
}

function getImageTempDir(prefix: string): string {
  const dirName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const dirPath = path.join(UPLOADS_BASE, dirName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export async function extractImages(pdfPath: string): Promise<ImageExtractionResult> {
  const imageDir = getImageTempDir('pdf-images');
  const imageRoot = path.join(imageDir, 'img');
  
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('pdfimages', ['-png', '-p', pdfPath, imageRoot]);
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pdfimages exited with code ${code}`));
        }
      });
      
      child.on('error', reject);
    });
    
    const files = fs.readdirSync(imageDir);
    const images: ExtractedImage[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.jpeg')) {
        continue;
      }
      
      const filePath = path.join(imageDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.size < 100) {
        fs.unlinkSync(filePath);
        continue;
      }
      
      const pageMatch = file.match(/-(\d+)-/);
      const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
      
      const ext = path.extname(file).slice(1);
      const id = `img-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      images.push({
        id,
        filename: file,
        path: filePath,
        page,
        width: 0,
        height: 0,
        type: ext === 'png' ? 'image/png' : 'image/jpeg'
      });
    }
    
    images.sort((a, b) => a.page - b.page);
    
    return {
      success: true,
      images
    };
  } catch (error: any) {
    try {
      fs.rmSync(imageDir, { recursive: true, force: true });
    } catch (e) {}
    
    return {
      success: false,
      images: [],
      error: error.message
    };
  }
}

export async function cleanupExtractedImages(images: ExtractedImage[]): Promise<void> {
  const dirs = new Set<string>();
  
  // Delete all image files
  for (const image of images) {
    dirs.add(path.dirname(image.path));
    try {
      await fs.promises.unlink(image.path);
    } catch (e) {
      // File may already be deleted
    }
  }
  
  // Clean up empty directories
  for (const dir of Array.from(dirs)) {
    try {
      await fs.promises.rmdir(dir);
    } catch (e) {
      // Directory may not be empty or already deleted
    }
  }
}
