import { z } from "zod";
import { OutputFileSchema } from "./common";

export const DocxConversionSettingsSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  includeTableOfContents: z.boolean().default(true),
});

export type DocxConversionSettings = z.infer<typeof DocxConversionSettingsSchema>;

export const DocxConvertRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one DOCX file ID required"),
  outputFormat: z.enum(["html", "epub", "pdf"]),
  settings: DocxConversionSettingsSchema.optional(),
});

export type DocxConvertRequest = z.infer<typeof DocxConvertRequestSchema>;

export const DocxConvertResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema,
});

export type DocxConvertResponse = z.infer<typeof DocxConvertResponseSchema>;

export const HtmlToDocxSettingsSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  mode: z.enum(['combine', 'batch']).optional(),
});

export type HtmlToDocxSettings = z.infer<typeof HtmlToDocxSettingsSchema>;

export const HtmlToDocxRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one HTML file ID required"),
  settings: HtmlToDocxSettingsSchema.optional(),
});

export type HtmlToDocxRequest = z.infer<typeof HtmlToDocxRequestSchema>;

export const HtmlToDocxResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema.optional(),
  files: z.array(OutputFileSchema).optional(),
});

export type HtmlToDocxResponse = z.infer<typeof HtmlToDocxResponseSchema>;
