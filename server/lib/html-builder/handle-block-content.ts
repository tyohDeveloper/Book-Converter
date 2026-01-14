export interface BlockState {
  inBlock: boolean;
  blockLines: string[];
  closingTag: string;
}

export function createBlockState(): BlockState {
  return {
    inBlock: false,
    blockLines: [],
    closingTag: '',
  };
}

export function handleBlockLine(state: BlockState, line: string): string | null {
  const trimmed = line.trim();
  state.blockLines.push(line);
  
  if (trimmed.includes(state.closingTag)) {
    const result = state.blockLines.join('\n');
    state.inBlock = false;
    state.blockLines = [];
    state.closingTag = '';
    return result;
  }
  
  return null;
}

export interface BlockStartResult {
  handled: true;
  output: string | null;
}

export function tryStartBlock(
  state: BlockState,
  line: string,
  trimmed: string
): BlockStartResult | null {
  if (trimmed.startsWith('<pre class="code-block">')) {
    if (trimmed.includes('</pre>')) {
      return { handled: true, output: line };
    }
    state.inBlock = true;
    state.blockLines = [line];
    state.closingTag = '</pre>';
    return { handled: true, output: null };
  }

  if (trimmed.startsWith('<div class="toc') ||
      trimmed.startsWith('<div class="index') ||
      trimmed.startsWith('<div class="footnote')) {
    if (trimmed.includes('</div>')) {
      return { handled: true, output: line };
    }
    state.inBlock = true;
    state.blockLines = [line];
    state.closingTag = '</div>';
    return { handled: true, output: null };
  }

  return null;
}
