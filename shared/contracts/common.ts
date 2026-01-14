import { z } from "zod";

export const FileInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  uploadedAt: z.string().or(z.date()),
  isOutput: z.boolean().optional(),
  outputType: z.string().nullable().optional(),
});

export type FileInfo = z.infer<typeof FileInfoSchema>;

export const OutputFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  isOutput: z.boolean().optional(),
  outputType: z.string().nullable().optional(),
});

export type OutputFile = z.infer<typeof OutputFileSchema>;

export const ChapterSchema = z.object({
  title: z.string(),
  page: z.number(),
  content: z.string().optional(),
});

export type Chapter = z.infer<typeof ChapterSchema>;
