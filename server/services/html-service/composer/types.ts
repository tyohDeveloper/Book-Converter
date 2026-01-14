import type { TypographySettings } from "@shared/contracts/settings";

export interface ContentFragment {
  id: string;
  name: string;
  bodyHtml: string;
}

export interface ComposeDocumentOptions {
  title: string;
  fragments: ContentFragment[];
  includeToc?: boolean;
  typography?: Partial<TypographySettings>;
  skipCss?: boolean;
}

export interface ComposeSectionOptions {
  fragments: ContentFragment[];
  includeToc?: boolean;
}
