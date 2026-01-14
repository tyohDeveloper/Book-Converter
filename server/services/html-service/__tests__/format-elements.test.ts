import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { textPosToHtmlIndex } from "../cursor-utils";
import { splitElementAtPosition } from "../split-element";
import { insertBreakAtPosition } from "../insert-break";
import { mergeWithPreviousElement } from "../merge-element";
import { wrapTextRange } from "../wrap-text-range";
import { changeElementTag } from "../change-element-tag";
import { addElementStyle } from "../add-element-style";
import { updateElementContent } from "../update-element-content";
import { collectFormattableElements } from "../element-collector";

function createTestDoc(html: string) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  return { dom, doc: dom.window.document, body: dom.window.document.body };
}

describe("textPosToHtmlIndex", () => {
  it("returns correct index for plain text", () => {
    const html = "Hello world";
    expect(textPosToHtmlIndex(html, 5)).toBe(5);
  });

  it("skips HTML tags when counting", () => {
    const html = "Hello <b>world</b>";
    expect(textPosToHtmlIndex(html, 6)).toBe(9);
  });

  it("handles nested tags", () => {
    const html = "<span>Hello</span> <b>world</b>";
    expect(textPosToHtmlIndex(html, 6)).toBe(22);
  });

  it("returns -1 for position beyond text length", () => {
    const html = "Hi";
    expect(textPosToHtmlIndex(html, 10)).toBe(-1);
  });
});

describe("collectFormattableElements", () => {
  it("collects p, h1-h6 elements", () => {
    const { body } = createTestDoc("<h1>Title</h1><p>Para 1</p><p>Para 2</p>");
    const elements = collectFormattableElements(body);
    expect(elements).toHaveLength(3);
    expect(elements[0].tagName.toLowerCase()).toBe("h1");
    expect(elements[1].tagName.toLowerCase()).toBe("p");
  });

  it("skips empty elements", () => {
    const { body } = createTestDoc("<p>Content</p><p></p><p>   </p>");
    const elements = collectFormattableElements(body);
    expect(elements).toHaveLength(1);
  });

  it("ignores non-formattable tags", () => {
    const { body } = createTestDoc("<div>Div</div><p>Para</p><span>Span</span>");
    const elements = collectFormattableElements(body);
    expect(elements).toHaveLength(1);
    expect(elements[0].textContent).toBe("Para");
  });
});

describe("splitElementAtPosition", () => {
  it("splits element at plain text position", () => {
    const { doc, body } = createTestDoc("<p>Hello world</p>");
    const el = body.querySelector("p")!;
    const newEl = splitElementAtPosition(el, 6, doc);
    
    expect(newEl).not.toBeNull();
    expect(el.innerHTML).toBe("Hello ");
    expect(newEl!.innerHTML).toBe("world");
  });

  it("splits element with inline tags correctly", () => {
    const { doc, body } = createTestDoc("<p>Hello <b>world</b></p>");
    const el = body.querySelector("p")!;
    const newEl = splitElementAtPosition(el, 6, doc);
    
    expect(newEl).not.toBeNull();
    expect(el.innerHTML).toBe("Hello <b></b>");
    expect(newEl!.innerHTML).toBe("world");
  });

  it("preserves style attribute on new element", () => {
    const { doc, body } = createTestDoc('<p style="color: red">Hello world</p>');
    const el = body.querySelector("p")!;
    const newEl = splitElementAtPosition(el, 6, doc);
    
    expect(newEl!.getAttribute("style")).toBe("color: red");
  });

  it("returns null for invalid position", () => {
    const { doc, body } = createTestDoc("<p>Hello</p>");
    const el = body.querySelector("p")!;
    
    expect(splitElementAtPosition(el, 0, doc)).toBeNull();
    expect(splitElementAtPosition(el, 100, doc)).toBeNull();
  });
});

describe("insertBreakAtPosition", () => {
  it("inserts br at plain text position", () => {
    const { doc, body } = createTestDoc("<p>Hello world</p>");
    const el = body.querySelector("p")!;
    insertBreakAtPosition(el, 6, doc);
    
    expect(el.innerHTML).toBe("Hello <br>world");
  });

  it("inserts br with inline tags correctly", () => {
    const { doc, body } = createTestDoc("<p>Hi <em>there</em></p>");
    const el = body.querySelector("p")!;
    insertBreakAtPosition(el, 3, doc);
    
    expect(el.innerHTML).toContain("<br>");
  });
});

describe("mergeWithPreviousElement", () => {
  it("merges content with space separator", () => {
    const { body } = createTestDoc("<p>First</p><p>Second</p>");
    const elements = Array.from(body.querySelectorAll("p"));
    mergeWithPreviousElement(elements[1], elements[0]);
    
    expect(elements[0].innerHTML).toBe("First Second");
    expect(body.querySelectorAll("p")).toHaveLength(1);
  });
});

describe("wrapTextRange", () => {
  it("wraps range with bold tag", () => {
    const { doc, body } = createTestDoc("<p>Hello world</p>");
    const el = body.querySelector("p")!;
    wrapTextRange(el, 0, 5, "b", undefined, doc);
    
    expect(el.innerHTML).toBe("<b>Hello</b> world");
  });

  it("wraps range with em tag", () => {
    const { doc, body } = createTestDoc("<p>Hello world</p>");
    const el = body.querySelector("p")!;
    wrapTextRange(el, 6, 11, "em", undefined, doc);
    
    expect(el.innerHTML).toBe("Hello <em>world</em>");
  });

  it("wraps range with styled span", () => {
    const { doc, body } = createTestDoc("<p>Hello world</p>");
    const el = body.querySelector("p")!;
    wrapTextRange(el, 0, 5, "span", "color: red", doc);
    
    expect(el.innerHTML).toBe('<span style="color: red">Hello</span> world');
  });
});

describe("changeElementTag", () => {
  it("changes p to h2", () => {
    const { doc, body } = createTestDoc("<p>Title</p>");
    const el = body.querySelector("p")!;
    const newEl = changeElementTag(el, "h2", doc);
    
    expect(newEl.tagName.toLowerCase()).toBe("h2");
    expect(newEl.innerHTML).toBe("Title");
  });

  it("preserves style", () => {
    const { doc, body } = createTestDoc('<p style="color: blue">Text</p>');
    const el = body.querySelector("p")!;
    const newEl = changeElementTag(el, "h3", doc);
    
    expect(newEl.getAttribute("style")).toBe("color: blue");
  });
});

describe("addElementStyle", () => {
  it("adds style to element without existing style", () => {
    const { body } = createTestDoc("<p>Text</p>");
    const el = body.querySelector("p")!;
    addElementStyle(el, "font-size: 18px");
    
    expect(el.getAttribute("style")).toBe("font-size: 18px");
  });

  it("appends to existing style", () => {
    const { body } = createTestDoc('<p style="color: red">Text</p>');
    const el = body.querySelector("p")!;
    addElementStyle(el, "font-size: 18px");
    
    expect(el.getAttribute("style")).toBe("color: red; font-size: 18px");
  });
});

describe("updateElementContent", () => {
  it("replaces innerHTML", () => {
    const { body } = createTestDoc("<p>Old content</p>");
    const el = body.querySelector("p")!;
    updateElementContent(el, "New <b>content</b>");
    
    expect(el.innerHTML).toBe("New <b>content</b>");
  });
});
