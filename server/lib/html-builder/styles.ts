import type { TypographySettings } from "@shared/contracts/settings";
import type { BookStylePreset } from "@shared/contracts/book-style-preset";
import { defaultTypographySettings } from "@shared/contracts/settings";
import { getBaseStyles } from "./styles/base-styles";
import { getChapterStyles } from "./styles/chapter-styles";
import { getTocStyles } from "./styles/toc-styles";
import { getTableStyles } from "./styles/table-styles";
import { getFootnoteStyles } from "./styles/footnote-styles";
import { getPrintStyles } from "./styles/print-styles";
import { buildBookStylesCss } from "../book-styles/build-book-styles-css";

export interface DocumentStylesOptions {
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
}

export function getDocumentStyles(options?: DocumentStylesOptions | Partial<TypographySettings>): string {
  let typography: Partial<TypographySettings> | undefined;
  let bookStylePreset: BookStylePreset | undefined;

  if (options && 'bookStylePreset' in options) {
    typography = options.typography;
    bookStylePreset = options.bookStylePreset;
  } else {
    typography = options as Partial<TypographySettings> | undefined;
  }

  const t = { ...defaultTypographySettings, ...typography };
  
  const styles = [
    getBaseStyles(t),
    getChapterStyles(t),
    getTocStyles(),
    getTableStyles(),
    getFootnoteStyles(),
    getPrintStyles(),
  ];

  if (bookStylePreset) {
    styles.push(buildBookStylesCss(bookStylePreset));
  }

  return styles.join("\n");
}

export const documentStyles = getDocumentStyles();
