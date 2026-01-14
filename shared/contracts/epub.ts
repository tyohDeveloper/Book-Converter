import { z } from "zod";
import { OutputFileSchema } from "./common";

export const EpubToHtmlSettingsSchema = z.object({
  title: z.string().optional(),
  includeTableOfContents: z.boolean().default(true),
  skipCss: z.boolean().default(false),
});

export type EpubToHtmlSettings = z.infer<typeof EpubToHtmlSettingsSchema>;

export const EpubConvertRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one EPUB file ID required"),
  settings: EpubToHtmlSettingsSchema.optional(),
});

export type EpubConvertRequest = z.infer<typeof EpubConvertRequestSchema>;

export const EpubConvertResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema,
});

export type EpubConvertResponse = z.infer<typeof EpubConvertResponseSchema>;

export const SplitEpubSettingsSchema = z.object({
  excludeToc: z.boolean().default(true),
  outputFormat: z.enum(['zip', 'individual']).default('zip'),
});

export type SplitEpubSettings = z.infer<typeof SplitEpubSettingsSchema>;

export const SplitEpubRequestSchema = z.object({
  fileId: z.string().min(1, "EPUB file ID required"),
  settings: SplitEpubSettingsSchema.optional(),
});

export type SplitEpubRequest = z.infer<typeof SplitEpubRequestSchema>;

export const SplitEpubResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema.optional(),
  files: z.array(OutputFileSchema).optional(),
  chapterCount: z.number(),
});

export type SplitEpubResponse = z.infer<typeof SplitEpubResponseSchema>;

export const SplitHtmlSettingsSchema = z.object({
  excludeToc: z.boolean().default(true),
  outputFormat: z.enum(['zip', 'individual']).default('zip'),
});

export type SplitHtmlSettings = z.infer<typeof SplitHtmlSettingsSchema>;

export const SplitHtmlRequestSchema = z.object({
  fileId: z.string().min(1, "HTML file ID required"),
  settings: SplitHtmlSettingsSchema.optional(),
});

export type SplitHtmlRequest = z.infer<typeof SplitHtmlRequestSchema>;

export const SplitHtmlResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema.optional(),
  files: z.array(OutputFileSchema).optional(),
  chapterCount: z.number(),
});

export type SplitHtmlResponse = z.infer<typeof SplitHtmlResponseSchema>;

export const BundleHtmlSettingsSchema = z.object({
  title: z.string().optional(),
  includeTableOfContents: z.boolean().default(true),
  skipCss: z.boolean().default(false),
});

export type BundleHtmlSettings = z.infer<typeof BundleHtmlSettingsSchema>;

export const BundleHtmlRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one HTML/XHTML file ID required"),
  settings: BundleHtmlSettingsSchema.optional(),
});

export type BundleHtmlRequest = z.infer<typeof BundleHtmlRequestSchema>;

export const BundleHtmlResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema,
});

export type BundleHtmlResponse = z.infer<typeof BundleHtmlResponseSchema>;
