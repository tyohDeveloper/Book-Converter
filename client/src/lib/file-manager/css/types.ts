import type { CssEditorState } from '@shared/contracts/css-editor';

export type { CssEditorState, ParsedStylesheet, CssRule, InlineStyleInfo, SelectorUsage } from '@shared/contracts/css-editor';

export interface MultiFileInfo {
  id: string;
  name: string;
  size: number;
}

export interface CssStylesResult extends CssEditorState {
  success?: boolean;
}

export interface MultiCssStylesResult {
  success?: boolean;
  styles: string;
  parsed: { imports: string[]; rules: Array<{ selector: string; declarations: Record<string, string>; editable: boolean; raw?: string }> };
  files: MultiFileInfo[];
}

export interface CssUpdateResult {
  success: boolean;
  file?: { id: string; name: string; size: number; isOutput?: boolean; outputType?: string };
}

export interface MultiCssUpdateResult {
  success: boolean;
  files?: Array<{ id: string; name: string; size: number; isOutput?: boolean; outputType?: string }>;
}

export interface SimplifyInlineResult {
  success: boolean;
  file?: { id: string; name: string; size: number; isOutput?: boolean; outputType?: string };
  classesCreated?: number;
  elementsUpdated?: number;
}

export interface RemoveClassResult {
  success: boolean;
  file?: { id: string; name: string; size: number; isOutput?: boolean; outputType?: string };
  elementsUpdated?: number;
}

export interface RemoveClassesResult {
  success: boolean;
  file?: { id: string; name: string; size: number; isOutput?: boolean; outputType?: string };
  classesRemoved?: number;
  elementsUpdated?: number;
}

export interface MergeStylesheetResult {
  success: boolean;
  styles: string;
}

export interface AddRuleResult {
  success: boolean;
  file?: { id: string; name: string; size: number; isOutput?: boolean; outputType?: string };
  selector?: string;
}

export interface ReplaceClassResult {
  success: boolean;
  file?: { id: string; name: string; size: number; isOutput?: boolean; outputType?: string };
  elementsUpdated?: number;
}
