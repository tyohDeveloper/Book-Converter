import { z } from "zod";

export const CssRuleSchema = z.object({
  selector: z.string(),
  declarations: z.record(z.string(), z.string()),
  raw: z.string().optional(),
  editable: z.boolean(),
});

export type CssRule = z.infer<typeof CssRuleSchema>;

export const ParsedStylesheetSchema = z.object({
  imports: z.array(z.string()),
  rules: z.array(CssRuleSchema),
});

export type ParsedStylesheet = z.infer<typeof ParsedStylesheetSchema>;

export const InlineStyleInfoSchema = z.object({
  selector: z.string(),
  style: z.string(),
  count: z.number(),
  type: z.enum(['inline', 'multiclass', 'duplicate']),
});

export type InlineStyleInfo = z.infer<typeof InlineStyleInfoSchema>;

export const SelectorUsageSchema = z.object({
  selector: z.string(),
  count: z.number(),
});

export type SelectorUsage = z.infer<typeof SelectorUsageSchema>;

export const CssEditorStateSchema = z.object({
  styles: z.string(),
  parsed: ParsedStylesheetSchema,
  inlineStyles: z.array(InlineStyleInfoSchema),
  selectorUsage: z.array(SelectorUsageSchema),
});

export type CssEditorState = z.infer<typeof CssEditorStateSchema>;

export const UpdateRuleRequestSchema = z.object({
  fileId: z.string(),
  selector: z.string(),
  declarations: z.record(z.string(), z.string()),
});

export type UpdateRuleRequest = z.infer<typeof UpdateRuleRequestSchema>;

export const UpdateRuleResponseSchema = z.object({
  success: z.boolean(),
  styles: z.string(),
  parsed: ParsedStylesheetSchema,
});

export type UpdateRuleResponse = z.infer<typeof UpdateRuleResponseSchema>;
