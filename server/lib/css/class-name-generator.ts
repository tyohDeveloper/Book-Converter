export function generateClassName(index: number, prefix: string): string {
  return `${prefix}-${index}`;
}

export function generateUniquePrefix(existingCss: string, base: string): string {
  let num = 1;
  while (existingCss.includes(`.${base}${num}-`)) {
    num++;
  }
  return `${base}${num}`;
}
