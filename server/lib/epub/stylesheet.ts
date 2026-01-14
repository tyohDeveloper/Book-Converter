import type { TypographySettings } from "@shared/contracts/settings";
import type { BookStylePreset } from "@shared/contracts/book-style-preset";
import { defaultTypographySettings } from "@shared/contracts/settings";
import { getBaseStyles } from "./styles/base-styles";
import {
  CODE_STYLES,
  FOOTNOTE_STYLES,
  TOC_STYLES,
  INDEX_STYLES,
  TABLE_STYLES,
  IMAGE_STYLES,
} from "./styles/component-styles";
import { buildBookStylesCss } from "../book-styles/build-book-styles-css";

export interface StylesheetOptions {
  typography?: Partial<TypographySettings>;
  bookStylePreset?: BookStylePreset;
}

export function getStylesheet(options?: StylesheetOptions | Partial<TypographySettings>): string {
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
    CODE_STYLES,
    FOOTNOTE_STYLES,
    TOC_STYLES,
    INDEX_STYLES,
    TABLE_STYLES,
    IMAGE_STYLES,
  ];

  if (bookStylePreset) {
    styles.push(buildBookStylesCss(bookStylePreset));
  }

  return styles.join("\n\n");
}

export { getFontFamily, getHeadingFontFamily } from "./styles/font-config";
