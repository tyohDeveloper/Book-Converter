import { isLikelyHeading } from "./heading-detector";
import { isDialogueStart, isDialogueEnd, isCompleteDialogueExchange, SPEECH_VERBS } from "./dialogue-detector";

export function shouldMergeWithNext(
  currentLine: string,
  nextLine: string | undefined,
  sensitivity: number
): boolean {
  if (!nextLine) return false;

  const trimmedCurrent = currentLine.trim();
  const trimmedNext = nextLine.trim();
  if (!trimmedNext) return false;

  if (isLikelyHeading(trimmedCurrent)) return false;
  if (isLikelyHeading(trimmedNext)) return false;

  const endsWithContinuation = /,\s*$/.test(trimmedCurrent) || 
                               new RegExp(`${SPEECH_VERBS},?\\s*$`, 'i').test(trimmedCurrent);
  
  if (isDialogueStart(trimmedNext) && !isDialogueStart(trimmedCurrent) && !endsWithContinuation) {
    return false;
  }
  
  if (isDialogueEnd(trimmedCurrent) && isDialogueStart(trimmedNext) && !endsWithContinuation) {
    return false;
  }
  
  if (isCompleteDialogueExchange(trimmedCurrent)) {
    return false;
  }
  
  const isNarrativeStart = !isDialogueStart(trimmedNext) && /^[A-Z][a-z]/.test(trimmedNext);
  if (isDialogueEnd(trimmedCurrent) && isNarrativeStart) {
    return false;
  }

  const threshold = sensitivity / 100;

  if (trimmedCurrent.length < 25 && /^[A-Z]/.test(trimmedCurrent) && threshold < 0.3) {
    return false;
  }

  return true;
}
