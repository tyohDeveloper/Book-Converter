export function parseDeclarations(style: string): Record<string, string> {
  const decls: Record<string, string> = {};
  for (const part of style.split(';')) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const prop = part.slice(0, colonIdx).trim().toLowerCase();
      const val = part.slice(colonIdx + 1).trim();
      if (prop && val) decls[prop] = val;
    }
  }
  return decls;
}

export function declarationsToString(decls: Record<string, string>): string {
  return Object.entries(decls)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prop, val]) => `${prop}: ${val}`)
    .join('; ');
}

export function toCanonicalStyle(style: string): string {
  return declarationsToString(parseDeclarations(style));
}
