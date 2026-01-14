import { CssInstruction } from './extract-instructions';

export function applyInstructions(css: string, instructions: CssInstruction[]): string {
  let result = css;

  for (const instruction of instructions) {
    if (!isClassSelector(instruction.selector)) continue;
    
    if (instruction.type === 'delete') {
      result = applyDeleteInstruction(result, instruction.selector);
    } else if (instruction.type === 'replace' && instruction.replacement && isClassSelector(instruction.replacement)) {
      result = applyReplaceInstruction(result, instruction.selector, instruction.replacement);
    }
  }

  return result;
}

function isClassSelector(selector: string): boolean {
  return selector.startsWith('.');
}

function applyDeleteInstruction(css: string, selector: string): string {
  const cleanSelector = selector.slice(1);
  const escapedSelector = escapeRegExp(cleanSelector);
  const rulePattern = new RegExp(
    `\\.${escapedSelector}(?![a-zA-Z0-9_-])\\s*\\{[^}]*\\}\\s*`,
    'g'
  );
  return css.replace(rulePattern, '');
}

function applyReplaceInstruction(css: string, selector: string, replacement: string): string {
  const cleanSelector = selector.slice(1);
  const cleanReplacement = replacement.slice(1);
  const escapedSelector = escapeRegExp(cleanSelector);
  const selectorPattern = new RegExp(`\\.${escapedSelector}(?![a-zA-Z0-9_-])`, 'g');
  return css.replace(selectorPattern, `.${cleanReplacement}`);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
