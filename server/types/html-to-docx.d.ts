declare module 'html-to-docx' {
  interface HTMLtoDOCXOptions {
    title?: string;
    subject?: string;
    creator?: string;
    keywords?: string[];
    description?: string;
    lastModifiedBy?: string;
    revision?: number;
    createdAt?: Date;
    modifiedAt?: Date;
    headerHTMLString?: string;
    footerHTMLString?: string;
    decodeUnicode?: boolean;
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
      header?: number;
      footer?: number;
      gutter?: number;
    };
    orientation?: 'portrait' | 'landscape';
    pageNumber?: boolean;
    fontSize?: number;
    font?: string;
    table?: {
      row?: {
        cantSplit?: boolean;
      };
    };
    footer?: boolean;
    header?: boolean;
  }

  function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString: string | null,
    options?: HTMLtoDOCXOptions
  ): Promise<Buffer>;

  export = HTMLtoDOCX;
}
