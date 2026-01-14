export interface CssInstruction {
  type: 'delete' | 'replace';
  selector: string;
  replacement?: string;
}

const CSS_INSTRUCTION_PATTERN = /\/\*\s*db-instruction:\s*(delete|replace)\s+"([^"]+)"(?:\s+with\s+"([^"]+)")?\s*\*\//g;

export function extractCssInstructions(css: string): CssInstruction[] {
  const instructions: CssInstruction[] = [];
  let match;
  const pattern = new RegExp(CSS_INSTRUCTION_PATTERN.source, 'g');

  while ((match = pattern.exec(css)) !== null) {
    const [, action, selector, replacement] = match;

    if (action === 'delete') {
      instructions.push({ type: 'delete', selector });
    } else if (action === 'replace' && replacement) {
      instructions.push({ type: 'replace', selector, replacement });
    }
  }

  return instructions;
}

export function buildDeleteInstruction(selector: string): string {
  return `/* db-instruction: delete "${selector}" */`;
}

export function buildReplaceInstruction(sourceSelector: string, targetSelector: string): string {
  return `/* db-instruction: replace "${sourceSelector}" with "${targetSelector}" */`;
}

export function applyInstructionsToCss(css: string, instructions: CssInstruction[]): string {
  let result = css;
  
  for (const instruction of instructions) {
    if (instruction.type === 'delete') {
      const escapedSelector = instruction.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ruleRegex = new RegExp(`${escapedSelector}\\s*\\{[^}]*\\}\\s*`, 'g');
      result = result.replace(ruleRegex, '');
    } else if (instruction.type === 'replace' && instruction.replacement) {
      const escapedSelector = instruction.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedSelector, 'g'), instruction.replacement);
    }
  }
  
  return result.trim();
}

export function removeInstructionComments(css: string): string {
  return css.replace(CSS_INSTRUCTION_PATTERN, '').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

export function addInstructionComment(css: string, instruction: CssInstruction): string {
  const comment = instruction.type === 'delete' 
    ? buildDeleteInstruction(instruction.selector)
    : buildReplaceInstruction(instruction.selector, instruction.replacement || '');
  
  if (css.includes(comment)) return css;
  
  return comment + '\n' + css;
}
