import { z } from "zod";
import { ChapterSchema } from "./common";

export const AnalyzeRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one file ID required"),
  detectChapters: z.boolean().default(true),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AnalyzeResultSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  totalPages: z.number().optional(),
  chapters: z.array(ChapterSchema).optional(),
  preview: z.string().optional(),
  error: z.string().optional(),
  limitedAnalysis: z.boolean().optional(),
  message: z.string().optional(),
});

export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

export const AnalyzeResponseSchema = z.object({
  results: z.array(AnalyzeResultSchema),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

export const StructureRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one file ID required"),
});

export type StructureRequest = z.infer<typeof StructureRequestSchema>;

export const StructureResultSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  structure: z.any().optional(),
  error: z.string().optional(),
});

export type StructureResult = z.infer<typeof StructureResultSchema>;

export const StructureResponseSchema = z.object({
  results: z.array(StructureResultSchema),
});

export type StructureResponse = z.infer<typeof StructureResponseSchema>;
