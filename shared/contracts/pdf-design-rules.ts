import { z } from "zod";

export const PageNumberPositionSchema = z.enum([
  "bottom-center",
  "bottom-left", 
  "bottom-right",
  "top-center",
  "top-left",
  "top-right"
]);
export type PageNumberPosition = z.infer<typeof PageNumberPositionSchema>;

export const PageNumberFormatSchema = z.enum([
  "numeric",
  "roman-lower",
  "roman-upper",
  "alpha-lower",
  "alpha-upper"
]);
export type PageNumberFormat = z.infer<typeof PageNumberFormatSchema>;

export const PageNumberSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  position: PageNumberPositionSchema.optional(),
  format: PageNumberFormatSchema.optional(),
  startNumber: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  fontSize: z.string().optional(),
  fontFamily: z.string().optional(),
  skipFirstPage: z.boolean().optional(),
});
export type PageNumberSettings = z.infer<typeof PageNumberSettingsSchema>;

export const TypographyRulesSchema = z.object({
  preventOrphans: z.boolean().optional(),
  preventWidows: z.boolean().optional(),
  orphanLines: z.number().min(1).max(5).optional(),
  widowLines: z.number().min(1).max(5).optional(),
  noWordSplitting: z.boolean().optional(),
  hyphensMode: z.enum(["none", "auto", "manual"]).optional(),
  keepHeadingsWithContent: z.boolean().optional(),
  minHeadingContentLines: z.number().min(1).max(5).optional(),
});
export type TypographyRules = z.infer<typeof TypographyRulesSchema>;

export const PageBreakRulesSchema = z.object({
  avoidBreakInsideBlocks: z.boolean().optional(),
  avoidBreakAfterHeadings: z.boolean().optional(),
  chapterStartsNewPage: z.boolean().optional(),
});
export type PageBreakRules = z.infer<typeof PageBreakRulesSchema>;

export const PdfDesignRulesSchema = z.object({
  version: z.literal(1).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  stylesheetFileId: z.string().optional(),
  pageNumbers: PageNumberSettingsSchema.optional(),
  typography: TypographyRulesSchema.optional(),
  pageBreaks: PageBreakRulesSchema.optional(),
});
export type PdfDesignRules = z.infer<typeof PdfDesignRulesSchema>;

export const defaultPdfDesignRules: PdfDesignRules = {
  version: 1,
  pageNumbers: {
    enabled: false,
    position: "bottom-center",
    format: "numeric",
    startNumber: 1,
    fontSize: "10pt",
    skipFirstPage: false,
  },
  typography: {
    preventOrphans: true,
    preventWidows: true,
    orphanLines: 2,
    widowLines: 2,
    noWordSplitting: true,
    hyphensMode: "none",
    keepHeadingsWithContent: true,
    minHeadingContentLines: 2,
  },
  pageBreaks: {
    avoidBreakInsideBlocks: true,
    avoidBreakAfterHeadings: true,
    chapterStartsNewPage: false,
  },
};
