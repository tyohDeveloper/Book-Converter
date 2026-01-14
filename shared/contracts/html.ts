import { z } from "zod";
import { OutputFileSchema } from "./common";
import { PdfDesignRulesSchema } from "./pdf-design-rules";

export const HtmlToPdfSettingsSchema = z.object({
  title: z.string().optional(),
  paperSize: z.enum(["letter", "a4"]).optional(),
  landscape: z.boolean().optional(),
  margin: z.object({
    top: z.string().optional(),
    right: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional(),
  }).optional(),
  designRules: PdfDesignRulesSchema.optional(),
});

export type HtmlToPdfSettings = z.infer<typeof HtmlToPdfSettingsSchema>;

export const HtmlToPdfRequestSchema = z.object({
  fileId: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
  settings: HtmlToPdfSettingsSchema.optional(),
}).refine((data) => data.fileId || (data.fileIds && data.fileIds.length > 0), {
  message: "Either fileId or fileIds must be provided",
});

export type HtmlToPdfRequest = z.infer<typeof HtmlToPdfRequestSchema>;

export const HtmlToPdfResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema.optional(),
  files: z.array(OutputFileSchema).optional(),
});

export type HtmlToPdfResponse = z.infer<typeof HtmlToPdfResponseSchema>;

// HTML Element Formatting
export const ElementTagSchema = z.enum(["p", "h1", "h2", "h3", "h4", "h5", "h6", "div", "blockquote"]);
export type ElementTag = z.infer<typeof ElementTagSchema>;

export const WrapKindSchema = z.enum(["em", "b", "span"]);
export type WrapKind = z.infer<typeof WrapKindSchema>;

export const TextRangeSchema = z.object({
  start: z.number(),
  end: z.number(),
});
export type TextRange = z.infer<typeof TextRangeSchema>;

export const ElementOperationSchema = z.object({
  index: z.number(),
  action: z.enum(["changeTag", "addStyle", "delete", "split", "insertBreak", "mergeWithPrevious", "wrap", "updateContent", "insertAfter"]),
  newTag: ElementTagSchema.optional(),
  style: z.string().optional(),
  position: z.number().optional(),
  range: TextRangeSchema.optional(),
  wrapKind: WrapKindSchema.optional(),
  insertTag: ElementTagSchema.optional(),
  insertContent: z.string().optional(),
  wrapStyle: z.string().optional(),
  content: z.string().optional(),
});
export type ElementOperation = z.infer<typeof ElementOperationSchema>;

export const HtmlFormatRequestSchema = z.object({
  fileId: z.string(),
  operations: z.array(ElementOperationSchema),
});
export type HtmlFormatRequest = z.infer<typeof HtmlFormatRequestSchema>;

export const HtmlElementSchema = z.object({
  index: z.number(),
  tag: z.string(),
  text: z.string(),
  fullText: z.string().optional(),
  innerHTML: z.string().optional(),
  style: z.string().optional(),
});
export type HtmlElement = z.infer<typeof HtmlElementSchema>;

export const HtmlFormatPreviewResponseSchema = z.object({
  success: z.boolean(),
  elements: z.array(HtmlElementSchema),
});
export type HtmlFormatPreviewResponse = z.infer<typeof HtmlFormatPreviewResponseSchema>;

export const HtmlFormatResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema.optional(),
});
export type HtmlFormatResponse = z.infer<typeof HtmlFormatResponseSchema>;

export const CleanHtmlSettingsSchema = z.object({
  removeNullSpans: z.boolean().optional(),
  removeWhitespaceStyles: z.boolean().optional(),
  removeInterparagraphBr: z.boolean().optional(),
  flattenNestedElements: z.boolean().optional(),
  removeUndefinedClasses: z.boolean().optional(),
});
export type CleanHtmlSettings = z.infer<typeof CleanHtmlSettingsSchema>;

export const CleanHtmlRequestSchema = z.object({
  fileId: z.string(),
  settings: CleanHtmlSettingsSchema.optional(),
});
export type CleanHtmlRequest = z.infer<typeof CleanHtmlRequestSchema>;

export const CleanHtmlResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema,
  stats: z.object({
    nullSpansRemoved: z.number(),
    whitespaceStylesRemoved: z.number(),
    brElementsRemoved: z.number(),
    nestedElementsFlattened: z.number(),
    undefinedClassesRemoved: z.number(),
  }),
});
export type CleanHtmlResponse = z.infer<typeof CleanHtmlResponseSchema>;

