import { describe, it } from "node:test";
import assert from "node:assert";
import { decodeGlyph, decodeGlyphArray, formatArg, extractTextFromArgs, OPS_NAMES } from "../helpers";

describe("pdf-debug helpers", () => {
  describe("OPS_NAMES", () => {
    it("contains operator name mappings", () => {
      assert.ok(typeof OPS_NAMES === "object");
      assert.ok(Object.keys(OPS_NAMES).length > 0);
    });
  });

  describe("decodeGlyph", () => {
    it("returns string as-is", () => {
      assert.strictEqual(decodeGlyph("hello"), "hello");
    });

    it("returns empty string for numbers", () => {
      assert.strictEqual(decodeGlyph(42), "");
      assert.strictEqual(decodeGlyph(0), "");
      assert.strictEqual(decodeGlyph(-100), "");
    });

    it("extracts unicode from object", () => {
      assert.strictEqual(decodeGlyph({ unicode: "A" }), "A");
    });

    it("extracts fontChar from object when no unicode", () => {
      assert.strictEqual(decodeGlyph({ fontChar: "B" }), "B");
    });

    it("uses originalCharCode when no unicode or fontChar", () => {
      assert.strictEqual(decodeGlyph({ originalCharCode: 65 }), "A");
      assert.strictEqual(decodeGlyph({ originalCharCode: 90 }), "Z");
    });

    it("returns empty string for null/undefined", () => {
      assert.strictEqual(decodeGlyph(null), "");
      assert.strictEqual(decodeGlyph(undefined), "");
    });

    it("returns empty string for empty object", () => {
      assert.strictEqual(decodeGlyph({}), "");
    });

    it("prioritizes unicode over fontChar", () => {
      assert.strictEqual(decodeGlyph({ unicode: "U", fontChar: "F" }), "U");
    });

    it("handles boolean values", () => {
      assert.strictEqual(decodeGlyph(true as any), "");
      assert.strictEqual(decodeGlyph(false as any), "");
    });

    it("handles arrays (not nested)", () => {
      assert.strictEqual(decodeGlyph([] as any), "");
    });
  });

  describe("decodeGlyphArray", () => {
    it("decodes array of strings", () => {
      assert.strictEqual(decodeGlyphArray(["H", "e", "l", "l", "o"]), "Hello");
    });

    it("adds space for large negative numbers (< -100)", () => {
      assert.strictEqual(decodeGlyphArray(["Hello", -200, "World"]), "Hello World");
      assert.strictEqual(decodeGlyphArray(["A", -101, "B"]), "A B");
    });

    it("adds space at boundary (-100)", () => {
      assert.strictEqual(decodeGlyphArray(["A", -100, "B"]), "AB");
    });

    it("ignores small negative numbers", () => {
      assert.strictEqual(decodeGlyphArray(["He", -50, "llo"]), "Hello");
      assert.strictEqual(decodeGlyphArray(["A", -99, "B"]), "AB");
    });

    it("handles nested arrays", () => {
      assert.strictEqual(decodeGlyphArray([["A", "B"], ["C"]]), "ABC");
    });

    it("handles deeply nested arrays (one level deep)", () => {
      assert.strictEqual(decodeGlyphArray([["X", "Y"], "Z"]), "XYZ");
    });

    it("handles mixed content with glyphs", () => {
      const result = decodeGlyphArray([{ unicode: "X" }, -150, "Y"]);
      assert.strictEqual(result, "X Y");
    });

    it("handles empty array", () => {
      assert.strictEqual(decodeGlyphArray([]), "");
    });

    it("handles positive numbers (ignored)", () => {
      assert.strictEqual(decodeGlyphArray(["A", 50, "B"]), "AB");
    });

    it("handles multiple consecutive spaces", () => {
      assert.strictEqual(decodeGlyphArray(["A", -200, -200, "B"]), "A  B");
    });
  });

  describe("formatArg", () => {
    it("formats null/undefined as 'null'", () => {
      assert.strictEqual(formatArg(null), "null");
      assert.strictEqual(formatArg(undefined), "null");
    });

    it("formats strings with quotes", () => {
      assert.strictEqual(formatArg("hello"), '"hello"');
      assert.strictEqual(formatArg(""), '""');
    });

    it("formats numbers as string", () => {
      assert.strictEqual(formatArg(42), "42");
      assert.strictEqual(formatArg(3.14), "3.14");
      assert.strictEqual(formatArg(-5), "-5");
      assert.strictEqual(formatArg(0), "0");
    });

    it("formats short typed arrays as printable text", () => {
      const arr = new Uint8Array([65, 66, 67]);
      assert.strictEqual(formatArg(arr), '"ABC"');
    });

    it("formats non-printable typed arrays as bytes", () => {
      const arr = new Uint8Array([0, 1, 2, 3, 4]);
      assert.match(formatArg(arr), /<bytes: 0,1,2,3,4>/);
    });

    it("formats long typed arrays with length indicator", () => {
      const arr = new Uint8Array(25);
      assert.match(formatArg(arr), /bytes\[25\]/);
    });

    it("formats arrays with decoded glyphs", () => {
      const result = formatArg([{ unicode: "A" }, { unicode: "B" }]);
      assert.strictEqual(result, '"AB"');
    });

    it("truncates long arrays", () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const result = formatArg(arr);
      assert.match(result, /6 items/);
    });

    it("formats objects with name property (PDF names)", () => {
      assert.strictEqual(formatArg({ name: "FontName" }), "/FontName");
    });

    it("formats objects with unicode property", () => {
      assert.strictEqual(formatArg({ unicode: "X" }), '"X"');
    });

    it("truncates objects with many keys", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      assert.match(formatArg(obj), /\{a, b, c\.\.\.\}/);
    });

    it("formats objects with few keys", () => {
      const obj = { a: 1, b: 2 };
      assert.strictEqual(formatArg(obj), "{a, b}");
    });

    it("handles Int8Array", () => {
      const arr = new Int8Array([65, 66]);
      assert.strictEqual(formatArg(arr), '"AB"');
    });
  });

  describe("extractTextFromArgs", () => {
    it("extracts text from showText operator", () => {
      const result = extractTextFromArgs("showText", [[{ unicode: "H" }, { unicode: "i" }]]);
      assert.strictEqual(result, "Hi");
    });

    it("extracts text from showSpacedText operator", () => {
      const result = extractTextFromArgs("showSpacedText", [["A", "B", "C"]]);
      assert.strictEqual(result, "ABC");
    });

    it("handles showSpacedText with spacing", () => {
      const result = extractTextFromArgs("showSpacedText", [["Hello", -200, "World"]]);
      assert.strictEqual(result, "Hello World");
    });

    it("returns undefined for non-text operators", () => {
      assert.strictEqual(extractTextFromArgs("moveTo", [100, 200]), undefined);
      assert.strictEqual(extractTextFromArgs("lineTo", [50, 60]), undefined);
      assert.strictEqual(extractTextFromArgs("setFont", ["Arial", 12]), undefined);
    });

    it("returns undefined for empty args", () => {
      assert.strictEqual(extractTextFromArgs("showText", []), undefined);
    });

    it("returns undefined for null args", () => {
      assert.strictEqual(extractTextFromArgs("showText", null as any), undefined);
    });

    it("returns undefined for undefined args", () => {
      assert.strictEqual(extractTextFromArgs("showText", undefined as any), undefined);
    });

    it("returns undefined when decoded text is empty", () => {
      const result = extractTextFromArgs("showText", [[42, 43]]);
      assert.strictEqual(result, undefined);
    });

    it("handles mixed glyph types in showText", () => {
      const result = extractTextFromArgs("showText", [[
        { unicode: "A" },
        "B",
        { fontChar: "C" }
      ]]);
      assert.strictEqual(result, "ABC");
    });

    it("filters numbers from glyph arrays", () => {
      const result = extractTextFromArgs("showText", [[{ unicode: "A" }, 100, { unicode: "B" }]]);
      assert.strictEqual(result, "AB");
    });

    it("handles typed arrays in glyph content", () => {
      const result = extractTextFromArgs("showText", [[{ unicode: "X" }]]);
      assert.strictEqual(result, "X");
    });
  });

  describe("decodeGlyph error handling", () => {
    it("handles objects with null unicode", () => {
      assert.strictEqual(decodeGlyph({ unicode: null }), "");
    });

    it("handles objects with undefined properties", () => {
      assert.strictEqual(decodeGlyph({ unicode: undefined, fontChar: undefined }), "");
    });

    it("handles objects with non-string unicode", () => {
      const result = decodeGlyph({ unicode: 123 as any });
      assert.strictEqual(result, 123);
    });
  });

  describe("decodeGlyphArray error handling", () => {
    it("handles null entries in array", () => {
      const result = decodeGlyphArray(["A", null as any, "B"]);
      assert.strictEqual(result, "AB");
    });

    it("handles undefined entries in array", () => {
      const result = decodeGlyphArray(["A", undefined as any, "B"]);
      assert.strictEqual(result, "AB");
    });

    it("handles objects without glyph properties", () => {
      const result = decodeGlyphArray(["A", { foo: "bar" } as any, "B"]);
      assert.strictEqual(result, "AB");
    });
  });
});
