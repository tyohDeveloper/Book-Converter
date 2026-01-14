export interface CssInstruction {
  type: 'delete' | 'replace';
  selector: string;
  replacement?: string;
}

const CSS_INSTRUCTION_PATTERN = /\/\*\s*db-instruction:\s*(delete|replace)\s+"([^"]+)"(?:\s+with\s+"([^"]+)")?\s*\*\//g;
const HTML_INSTRUCTION_PATTERN = /<!--\s*db-instruction:\s*(delete|replace)\s+"([^"]+)"(?:\s+with\s+"([^"]+)")?\s*-->/g;

export function extractInstructions(content: string): CssInstruction[] {
  const instructions: CssInstruction[] = [];
  
  for (const pattern of [CSS_INSTRUCTION_PATTERN, HTML_INSTRUCTION_PATTERN]) {
    let match;
    const regex = new RegExp(pattern.source, 'g');
    while ((match = regex.exec(content)) !== null) {
      const [, action, selector, replacement] = match;
      if (action === 'delete') {
        instructions.push({ type: 'delete', selector });
      } else if (action === 'replace' && replacement) {
        instructions.push({ type: 'replace', selector, replacement });
      }
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

function isClassSelector(selector: string): boolean {
  return selector.startsWith('.');
}

export function removeAppliedInstructions(content: string, applied: CssInstruction[]): string {
  let result = content;
  for (const instruction of applied) {
    if (!isClassSelector(instruction.selector)) continue;
    if (instruction.type === 'replace' && instruction.replacement && !isClassSelector(instruction.replacement)) continue;
    
    const cssComment = instruction.type === 'delete'
      ? `/* db-instruction: delete "${instruction.selector}" */`
      : `/* db-instruction: replace "${instruction.selector}" with "${instruction.replacement}" */`;
    const htmlComment = instruction.type === 'delete'
      ? `<!-- db-instruction: delete "${instruction.selector}" -->`
      : `<!-- db-instruction: replace "${instruction.selector}" with "${instruction.replacement}" -->`;
    result = result.replace(cssComment, '').replace(htmlComment, '');
  }
  return result.replace(/\n\s*\n\s*\n/g, '\n\n');
}
