import { getHeaders } from '../session';

export interface SystemFont {
  family: string;
}

export interface SystemFontsResult {
  success: boolean;
  fonts: SystemFont[];
}

export async function getSystemFonts(signal?: AbortSignal): Promise<SystemFontsResult> {
  const response = await fetch('/api/tools/system-fonts', {
    method: 'GET',
    headers: getHeaders(),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get system fonts' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
