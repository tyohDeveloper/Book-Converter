import { describe, it, expect } from "vitest";
import { isDialogueStart, isDialogueEnd, isCompleteDialogueExchange } from "../dialogue-detector";

describe("isDialogueStart", () => {
  it("detects lines starting with quotes", () => {
    expect(isDialogueStart('"Hello," she said.')).toBe(true);
    expect(isDialogueStart('"What do you mean?"')).toBe(true);
    expect(isDialogueStart('\u201CHello\u201D')).toBe(true);
  });

  it("rejects lines not starting with quotes", () => {
    expect(isDialogueStart("She said hello.")).toBe(false);
    expect(isDialogueStart("The room was dark.")).toBe(false);
  });
});

describe("isDialogueEnd", () => {
  it("detects pronoun attributions", () => {
    expect(isDialogueEnd('"Hello," she said.')).toBe(true);
    expect(isDialogueEnd('"What?" he asked.')).toBe(true);
    expect(isDialogueEnd('"Fine," I replied.')).toBe(true);
  });

  it("detects named attributions", () => {
    expect(isDialogueEnd('"Hello," John said.')).toBe(true);
    expect(isDialogueEnd('"Wait," Mary whispered.')).toBe(true);
  });

  it("detects closing quotes", () => {
    expect(isDialogueEnd('and walked away."')).toBe(true);
    expect(isDialogueEnd('the end.\u201D')).toBe(true);
  });

  it("rejects non-dialogue endings", () => {
    expect(isDialogueEnd("The room was dark.")).toBe(false);
    expect(isDialogueEnd("She walked away.")).toBe(false);
  });
});

describe("isCompleteDialogueExchange", () => {
  it("detects dialogue lines ending with closing quotes", () => {
    expect(isCompleteDialogueExchange('"I think we should go now and find the others before it gets dark."')).toBe(true);
    expect(isCompleteDialogueExchange('"What do you mean by that? I don\'t understand what you\'re saying."')).toBe(true);
  });

  it("rejects short dialogue fragments", () => {
    expect(isCompleteDialogueExchange('"Hello."')).toBe(false);
    expect(isCompleteDialogueExchange('"Yes," she said.')).toBe(false);
  });

  it("rejects non-dialogue lines", () => {
    expect(isCompleteDialogueExchange("The room was dark and cold.")).toBe(false);
  });
});
