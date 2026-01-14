import { describe, it, expect } from "vitest";
import { detectFontStyle } from "../font-style-detector";

describe("detectFontStyle", () => {
  it("returns false for undefined font name", () => {
    expect(detectFontStyle(undefined)).toEqual({ isItalic: false, isBold: false });
  });

  it("returns false for plain font name", () => {
    expect(detectFontStyle("TimesNewRoman")).toEqual({ isItalic: false, isBold: false });
  });

  it("detects italic from font name containing italic", () => {
    expect(detectFontStyle("TimesNewRoman-Italic")).toEqual({ isItalic: true, isBold: false });
  });

  it("detects italic from -it suffix", () => {
    expect(detectFontStyle("BCDGEE+CasablancaAntique-Regu-it")).toEqual({ isItalic: true, isBold: false });
  });

  it("detects italic from oblique", () => {
    expect(detectFontStyle("Helvetica-Oblique")).toEqual({ isItalic: true, isBold: false });
  });

  it("detects bold from font name containing bold", () => {
    expect(detectFontStyle("TimesNewRoman-Bold")).toEqual({ isItalic: false, isBold: true });
  });

  it("detects bold from semibold", () => {
    expect(detectFontStyle("Arial-SemiBold")).toEqual({ isItalic: false, isBold: true });
  });

  it("detects bold from black", () => {
    expect(detectFontStyle("Helvetica-Black")).toEqual({ isItalic: false, isBold: true });
  });

  it("detects both italic and bold", () => {
    expect(detectFontStyle("TimesNewRoman-BoldItalic")).toEqual({ isItalic: true, isBold: true });
  });
});
