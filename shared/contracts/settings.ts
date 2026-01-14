import { z } from "zod";
import { BookStylePresetSchema } from "./book-style-preset";

export const TypographySettingsSchema = z.object({
  fontFamily: z.enum(["serif", "sans-serif", "georgia", "times", "palatino", "arial", "helvetica", "verdana"]).default("serif"),
  fontSize: z.number().min(12).max(24).default(16),
  lineHeight: z.number().min(1).max(3).default(1.6),
  textAlign: z.enum(["left", "justify"]).default("left"),
  paragraphSpacing: z.number().min(0).max(3).default(1),
  firstLineIndent: z.number().min(0).max(4).default(0),
  pageMargin: z.number().min(0).max(100).default(20),
  headingSize: z.number().min(1).max(3).default(1.5),
});

export type TypographySettings = z.infer<typeof TypographySettingsSchema>;

export const defaultTypographySettings: TypographySettings = {
  fontFamily: "serif",
  fontSize: 16,
  lineHeight: 1.6,
  textAlign: "left",
  paragraphSpacing: 1,
  firstLineIndent: 0,
  pageMargin: 20,
  headingSize: 1.5,
};

export const ConversionSettingsSchema = z.object({
  mergeParagraphs: z.boolean().default(true),
  detectChapters: z.boolean().default(true),
  removePageNumbers: z.boolean().default(true),
  fixHyphenation: z.boolean().default(true),
  removeHeadersFooters: z.boolean().default(true),
  cleanWhitespace: z.boolean().default(true),
  fixLigatures: z.boolean().default(true),
  sensitivity: z.number().min(0).max(100).default(50),
  title: z.string().default("Generated eBook"),
  author: z.string().default("Unknown"),
  compressionLevel: z.enum(["fast", "maximum"]).default("maximum"),
  detectCodeBlocks: z.boolean().default(true),
  convertFootnotes: z.boolean().default(true),
  preserveTOCIndentation: z.boolean().default(true),
  preserveIndex: z.boolean().default(true),
  extractImages: z.boolean().default(false),
  detectTables: z.boolean().default(true),
  includeTableOfContents: z.boolean().default(true),
  simpleExtraction: z.boolean().default(false),
  outputFormat: z.literal("individual").default("individual"),
  skipCss: z.boolean().default(false),
  preserveStyles: z.boolean().default(false),
  typography: TypographySettingsSchema.optional(),
  bookStylePreset: BookStylePresetSchema.optional(),
});

export type ConversionSettings = z.infer<typeof ConversionSettingsSchema>;
