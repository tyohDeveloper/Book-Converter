export function sanitizeFragmentId(id: string): string {
  return id.replace(/[^a-z0-9-]/gi, "-");
}
