import { z } from "zod";

export const HeadingScaleSchema = z.object({
  h1: z.number().min(1).max(4).default(2.5),
  h2: z.number().min(1).max(3.5).default(2),
  h3: z.number().min(1).max(3).default(1.5),
  h4: z.number().min(1).max(2.5).default(1.25),
  h5: z.number().min(1).max(2).default(1.1),
  h6: z.number().min(1).max(1.75).default(1),
});

export type HeadingScale = z.infer<typeof HeadingScaleSchema>;

export const TocStyleSchema = z.object({
  titleSize: z.number().min(1).max(3).default(1.5),
  entrySize: z.number().min(0.8).max(1.5).default(1),
  showDivider: z.boolean().default(true),
});

export type TocStyle = z.infer<typeof TocStyleSchema>;

export const BookStylePresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  bodyFontFamily: z.enum(["serif", "sans-serif", "georgia", "times", "palatino", "arial", "helvetica", "verdana"]).default("georgia"),
  bodyFontSize: z.number().min(12).max(24).default(16),
  lineHeight: z.number().min(1.2).max(2.5).default(1.6),
  headingFontFamily: z.enum(["serif", "sans-serif", "georgia", "times", "palatino", "arial", "helvetica", "verdana"]).default("georgia"),
  headingScale: HeadingScaleSchema.default({}),
  tocStyle: TocStyleSchema.default({}),
  paragraphSpacing: z.number().min(0).max(2).default(0.5),
  firstLineIndent: z.number().min(0).max(3).default(1.5),
});

export type BookStylePreset = z.infer<typeof BookStylePresetSchema>;

export const defaultBookStylePresets: BookStylePreset[] = [
  {
    id: "classic-serif",
    name: "Classic Serif",
    bodyFontFamily: "georgia",
    bodyFontSize: 16,
    lineHeight: 1.7,
    headingFontFamily: "georgia",
    headingScale: { h1: 2.5, h2: 2, h3: 1.5, h4: 1.25, h5: 1.1, h6: 1 },
    tocStyle: { titleSize: 1.5, entrySize: 1, showDivider: true },
    paragraphSpacing: 0.5,
    firstLineIndent: 1.5,
  },
  {
    id: "modern-clean",
    name: "Modern Clean",
    bodyFontFamily: "sans-serif",
    bodyFontSize: 15,
    lineHeight: 1.6,
    headingFontFamily: "helvetica",
    headingScale: { h1: 2.25, h2: 1.75, h3: 1.35, h4: 1.15, h5: 1.05, h6: 1 },
    tocStyle: { titleSize: 1.4, entrySize: 0.95, showDivider: false },
    paragraphSpacing: 1,
    firstLineIndent: 0,
  },
  {
    id: "traditional-book",
    name: "Traditional Book",
    bodyFontFamily: "times",
    bodyFontSize: 14,
    lineHeight: 1.5,
    headingFontFamily: "times",
    headingScale: { h1: 2.2, h2: 1.8, h3: 1.4, h4: 1.2, h5: 1.1, h6: 1 },
    tocStyle: { titleSize: 1.6, entrySize: 1, showDivider: true },
    paragraphSpacing: 0.3,
    firstLineIndent: 2,
  },
];

export function getDefaultPreset(): BookStylePreset {
  return defaultBookStylePresets[0];
}

export function getPresetById(id: string): BookStylePreset | undefined {
  return defaultBookStylePresets.find(p => p.id === id);
}
