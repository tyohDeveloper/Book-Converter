import { getHeaders } from '../session';

export type ElementTag = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "blockquote";
export type WrapKind = "em" | "b" | "span";

export interface TextRange {
  start: number;
  end: number;
}

export interface HtmlElement {
  index: number;
  tag: string;
  text: string;
  fullText?: string;
  innerHTML?: string;
  style?: string;
}

export interface ElementOperation {
  index: number;
  action: "changeTag" | "addStyle" | "delete" | "split" | "insertBreak" | "mergeWithPrevious" | "wrap" | "updateContent" | "insertAfter";
  newTag?: ElementTag;
  style?: string;
  position?: number;
  range?: TextRange;
  wrapKind?: WrapKind;
  wrapStyle?: string;
  content?: string;
  insertTag?: ElementTag;
  insertContent?: string;
}

export interface HtmlElementsResult {
  success: boolean;
  elements: HtmlElement[];
}

export interface HtmlFormatResult {
  success: boolean;
  file?: { id: string; name: string; size: number; isOutput?: boolean; outputType?: string };
}

export async function getHtmlElements(fileId: string, signal?: AbortSignal): Promise<HtmlElementsResult> {
  const response = await fetch('/api/tools/html-elements', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get HTML elements' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}

export async function formatHtmlElements(fileId: string, operations: ElementOperation[], signal?: AbortSignal): Promise<HtmlFormatResult> {
  const response = await fetch('/api/tools/html-format', {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, operations }),
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to format HTML' }));
    throw new Error(error.details || error.error);
  }

  return response.json();
}
