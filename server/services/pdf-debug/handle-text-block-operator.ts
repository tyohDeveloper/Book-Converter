import { extractTextFromArgs } from "./helpers";

export interface TextBlockState {
  inTextBlock: boolean;
  currentBlock: { text: string; opCount: number } | null;
}

export function createTextBlockState(): TextBlockState {
  return {
    inTextBlock: false,
    currentBlock: null,
  };
}

export interface CompletedBlock {
  blockNumber: number;
  text: string;
  operatorCount: number;
}

export function handleTextBlockOperator(
  state: TextBlockState,
  opName: string,
  opArgs: any,
  completedBlocks: CompletedBlock[]
): void {
  if (opName === 'beginText') {
    state.inTextBlock = true;
    state.currentBlock = { text: '', opCount: 0 };
    return;
  }

  if (opName === 'endText' && state.currentBlock) {
    state.inTextBlock = false;
    if (state.currentBlock.text.trim().length > 0) {
      completedBlocks.push({
        blockNumber: completedBlocks.length + 1,
        text: state.currentBlock.text.trim(),
        operatorCount: state.currentBlock.opCount,
      });
    }
    state.currentBlock = null;
    return;
  }

  if (state.inTextBlock && state.currentBlock) {
    state.currentBlock.opCount++;
    const text = extractTextFromArgs(opName, opArgs);
    if (text) state.currentBlock.text += text;
    if (opName === 'nextLine' || opName === 'nextLineSetSpacingShowText' || opName === 'nextLineShowText') {
      state.currentBlock.text += '\n';
    }
  }
}
