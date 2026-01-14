import { getHeaders } from '../../session';
import type { AddRuleResult } from './types';

export async function addCssRule(fileId: string, selector: string, signal?: AbortSignal): Promise<AddRuleResult> {
  const response = await fetch('/api/tools/html-css/add-rule', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, selector }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to add CSS rule' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
