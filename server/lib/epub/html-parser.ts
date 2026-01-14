import { JSDOM } from "jsdom";
import type { HtmlChapter } from "./types";

export interface ExtractChaptersOptions {
  preserveHeadings?: boolean;
}

export interface ExtractChaptersResult {
  chapters: HtmlChapter[];
  sharedCss: string;
}

export function extractChaptersFromHtml(htmlContent: string, options: ExtractChaptersOptions = {}): HtmlChapter[] {
  const result = extractChaptersWithCss(htmlContent, options);
  return result.chapters;
}

export function extractChaptersWithCss(htmlContent: string, options: ExtractChaptersOptions = {}): ExtractChaptersResult {
  const { preserveHeadings = false } = options;
  const chapters: HtmlChapter[] = [];

  const dom = new JSDOM(htmlContent);
  const doc = dom.window.document;
  const body = doc.body;

  const styleTag = doc.querySelector("style");
  const sharedCss = styleTag?.textContent?.trim() || "";

  if (!body) {
    return { chapters: [{ title: "Content", content: htmlContent }], sharedCss };
  }

  const tocNav = body.querySelector("nav.table-of-contents");
  
  if (tocNav) {
    const tocLinks = Array.from(tocNav.querySelectorAll("a[href^='#']"));
    const chapterIds: string[] = [];
    
    for (const link of tocLinks) {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        chapterIds.push(href.slice(1));
      }
    }

    let tocContent = tocNav.innerHTML;
    let chapterIndex = 2;
    tocContent = tocContent.replace(/href="#[^"]+"/g, () => {
      return `href="chapter${chapterIndex++}.xhtml"`;
    });
    chapters.push({ title: "Table of Contents", content: tocContent });

    for (const id of chapterIds) {
      const section = doc.getElementById(id);
      if (!section) continue;

      const heading = section.querySelector("h1, h2");
      let title = "Chapter";
      
      if (heading) {
        title = heading.textContent?.trim() || "Chapter";
        if (!preserveHeadings) {
          heading.remove();
        }
      }

      const content = section.innerHTML.trim();
      if (content.length > 0) {
        chapters.push({ title, content });
      }
    }
  } else {
    const sections = Array.from(body.querySelectorAll("section[id]"));

    if (sections.length > 0) {
      for (const section of sections) {
        const heading = section.querySelector("h1, h2");
        let title = "Chapter";
        
        if (heading) {
          title = heading.textContent?.trim() || "Chapter";
          if (!preserveHeadings) {
            heading.remove();
          }
        }

        const content = section.innerHTML.trim();
        if (content.length > 0) {
          chapters.push({ title, content });
        }
      }
    }
  }

  if (chapters.length === 0) {
    const headings = Array.from(body.querySelectorAll("h1, h2"));
    
    if (headings.length > 0) {
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const title = heading.textContent?.trim() || "Chapter";
        
        const contentParts: string[] = [];
        if (preserveHeadings) {
          contentParts.push(heading.outerHTML);
        }
        
        let sibling = heading.nextElementSibling;
        while (sibling && !["H1", "H2"].includes(sibling.tagName)) {
          contentParts.push(sibling.outerHTML);
          sibling = sibling.nextElementSibling;
        }
        
        const content = contentParts.join("\n").trim();
        if (content.length > 0) {
          chapters.push({ title, content });
        }
      }
    }
  }

  if (chapters.length === 0) {
    const h1 = body.querySelector("h1");
    if (h1 && !preserveHeadings) h1.remove();
    return { chapters: [{ title: "Content", content: body.innerHTML.trim() }], sharedCss };
  }

  return { chapters, sharedCss };
}
