import { getSessionId } from '../session';
import type { ManagedFile, UploadProgress } from './types';

interface XhrConfig {
  url: string;
  sessionId: string;
  formData: FormData;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

function configureUploadXhr(
  xhr: XMLHttpRequest,
  config: XhrConfig,
  resolve: (file: ManagedFile) => void,
  reject: (error: Error) => void,
  startTime: number,
  fileName: string
): void {
  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable && config.onProgress) {
      const percent = Math.round((event.loaded / event.total) * 100);
      config.onProgress({ loaded: event.loaded, total: event.total, percent });
    }
  });

  xhr.addEventListener('load', () => handleUploadResponse(xhr, resolve, reject, startTime, fileName));
  xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
  xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
  xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));

  if (config.signal) {
    config.signal.addEventListener('abort', () => xhr.abort());
  }

  xhr.open('POST', config.url);
  xhr.setRequestHeader('X-Session-Id', config.sessionId);
}

function handleUploadResponse(
  xhr: XMLHttpRequest,
  resolve: (file: ManagedFile) => void,
  reject: (error: Error) => void,
  startTime: number,
  fileName: string
): void {
  const elapsed = Date.now() - startTime;
  console.log(`[Upload] ${fileName}: status ${xhr.status} after ${elapsed}ms`);

  if (xhr.status >= 200 && xhr.status < 300) {
    try {
      const data = JSON.parse(xhr.responseText);
      resolve(data.files[0]);
    } catch {
      reject(new Error('Invalid response from server'));
    }
  } else {
    try {
      const error = JSON.parse(xhr.responseText);
      reject(new Error(error.details || error.error || 'Upload failed'));
    } catch {
      reject(new Error(`Upload failed with status ${xhr.status}`));
    }
  }
}

function uploadSingleFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
): Promise<ManagedFile> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const formData = new FormData();
    formData.append('files', file);

    const xhr = new XMLHttpRequest();
    configureUploadXhr(
      xhr,
      { url: '/api/files/upload', sessionId: getSessionId(), formData, onProgress, signal },
      resolve,
      reject,
      startTime,
      file.name
    );
    xhr.send(formData);
  });
}

export async function uploadFiles(
  files: File[], 
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal
): Promise<ManagedFile[]> {
  const uploadedFiles: ManagedFile[] = [];
  const totalFiles = files.length;
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (signal?.aborted) throw new Error('Upload cancelled');
    
    try {
      const uploaded = await uploadSingleFile(
        file,
        (fileProgress) => onProgress?.({ ...fileProgress, currentFile: file.name, currentIndex: i + 1, totalFiles }),
        signal
      );
      uploadedFiles.push(uploaded);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (err.message === 'Upload cancelled') throw err;
      errors.push(`${file.name}: ${err.message}`);
    }
  }
  
  if (uploadedFiles.length === 0 && files.length > 0) {
    throw new Error(`Upload failed: ${errors.join('; ') || 'Unknown error'}`);
  }
  
  return uploadedFiles;
}
