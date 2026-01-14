export function getPrintStyles(): string {
  return `
@media print {
  .chapter-heading { page-break-before: always; }
  .chapter-heading:first-of-type { page-break-before: avoid; }
}
`;
}
