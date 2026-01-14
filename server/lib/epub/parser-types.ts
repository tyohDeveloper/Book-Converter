export interface EpubChapter {
  id: string;
  href: string;
  title: string;
  content: string;
  playOrder: number;
}

export interface EpubMetadata {
  title: string;
  creator: string;
  language: string;
  identifier: string;
}

export interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

export interface SpineItem {
  idref: string;
  linear?: boolean;
}

export interface ParsedEpub {
  metadata: EpubMetadata;
  manifest: ManifestItem[];
  spine: SpineItem[];
  chapters: EpubChapter[];
  tocItems: TocItem[];
  stylesheets: { href: string; content: string }[];
  images: { href: string; data: Buffer; mediaType: string }[];
  rootPath: string;
}

export interface TocItem {
  id: string;
  playOrder: number;
  title: string;
  src: string;
}
