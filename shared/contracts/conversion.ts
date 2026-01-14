import { z } from "zod";
import { OutputFileSchema } from "./common";
import { TypographySettingsSchema, ConversionSettingsSchema } from "./settings";

export const EpubSettingsSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  compressionLevel: z.enum(["fast", "maximum"]).optional(),
  typography: TypographySettingsSchema.partial().optional(),
});

export type EpubSettings = z.infer<typeof EpubSettingsSchema>;

export const ConvertRequestSchema = z.object({
  fileId: z.string().min(1, "HTML file ID required"),
  settings: EpubSettingsSchema.optional(),
});

export type ConvertRequest = z.infer<typeof ConvertRequestSchema>;

export const ConvertResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema,
});

export type ConvertResponse = z.infer<typeof ConvertResponseSchema>;

export const ConvertToHtmlRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one file ID required"),
  settings: ConversionSettingsSchema.partial().optional(),
});

export type ConvertToHtmlRequest = z.infer<typeof ConvertToHtmlRequestSchema>;

export const ConvertToHtmlResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema,
});

export type ConvertToHtmlResponse = z.infer<typeof ConvertToHtmlResponseSchema>;

export const OptimizeRequestSchema = z.object({
  fileIds: z.array(z.string()).length(1, "Exactly one file ID required"),
});

export type OptimizeRequest = z.infer<typeof OptimizeRequestSchema>;

export const OptimizeStartResponseSchema = z.object({
  operationId: z.string(),
  started: z.boolean(),
});

export type OptimizeStartResponse = z.infer<typeof OptimizeStartResponseSchema>;

export const OptimizeResultSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema.optional(),
  originalSize: z.number().optional(),
  optimizedSize: z.number().optional(),
  reductionPercent: z.number().optional(),
  error: z.string().optional(),
});

export type OptimizeResult = z.infer<typeof OptimizeResultSchema>;

export const CombineRequestSchema = z.object({
  fileIds: z.array(z.string()).min(2, "At least 2 file IDs required"),
  outputName: z.string().default("combined.pdf"),
});

export type CombineRequest = z.infer<typeof CombineRequestSchema>;

export const CombineResponseSchema = z.object({
  success: z.boolean(),
  file: OutputFileSchema,
});

export type CombineResponse = z.infer<typeof CombineResponseSchema>;

export const ProgressUpdateSchema = z.object({
  stage: z.enum(["starting", "extracting", "processing", "detecting_chapters", "saving", "complete", "error"]),
  percent: z.number().min(0).max(100),
  message: z.string(),
});

export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;

export const ProgressCompleteSchema = z.object({
  success: z.boolean(),
  result: z.any().nullable(),
  error: z.string().optional(),
});

export type ProgressComplete = z.infer<typeof ProgressCompleteSchema>;

export const CancelOperationResponseSchema = z.object({
  cancelled: z.boolean(),
});

export type CancelOperationResponse = z.infer<typeof CancelOperationResponseSchema>;
