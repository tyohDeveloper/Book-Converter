type ContentType = "material" | "attribute" | "rune" | "generic" | "none";

export type { ContentType };

export function getSectionContentType(value: string): ContentType {
  const trimmed = value.trim();
  if (/^\[SR:\d+\]/.test(trimmed)) return "material";
  if (/^\[[A-Z]{2,}:\d+\]/.test(trimmed)) return "material";
  if (/^[A-Z][a-zA-Z\s]+:\s+[A-Z]/.test(trimmed)) return "attribute";
  if (/^(opponents|shadow|another|within)/.test(trimmed.toLowerCase())) return "attribute";
  if (/Rune\s+\[/i.test(trimmed)) return "rune";
  if (/^[A-Z][a-z]+\s+[A-Z][a-z]+\s+\[/.test(trimmed)) return "rune";
  if (/\[.+\]/.test(trimmed) && !trimmed.includes("|")) return "generic";
  return "none";
}

export function getSectionHeaderType(sectionName: string): ContentType[] {
  const name = sectionName.toLowerCase();
  if (name === "materials") return ["material", "generic"];
  if (name === "attributes") return ["attribute"];
  if (name === "runes") return ["rune"];
  return ["material", "attribute", "rune", "generic"];
}
