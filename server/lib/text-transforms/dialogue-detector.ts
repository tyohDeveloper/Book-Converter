const SPEECH_VERBS = '\\b(said|asked|replied|answered|muttered|whispered|shouted|yelled|exclaimed|continued|added|responded|hedged|gasped|grumbled|sighed|snapped|growled|murmured|called|cried|demanded|insisted|suggested|warned|promised|admitted|confessed|explained|announced|declared|remarked|commented|observed|noted|agreed|disagreed|protested|objected|interrupted|repeated|echoed|mocked|teased|joked|laughed|smiled|frowned|nodded|shrugged)\\b';

export { SPEECH_VERBS };

export function isDialogueStart(line: string): boolean {
  const trimmed = line.trim();
  return /^[""\u201C\u201D]/.test(trimmed);
}

export function isDialogueEnd(line: string): boolean {
  const trimmed = line.trim();
  
  const pronounPattern = new RegExp(`[""\u201C\u201D][,.]?\\s*(he|she|I|they|we|it)\\s+${SPEECH_VERBS}.*[.,!?]$`, 'i');
  const namedPattern = new RegExp(`[""\u201C\u201D][,.]?\\s+[A-Z][a-z'-]+(?:\\s+[A-Z][a-z'-]+)*\\s+${SPEECH_VERBS}.*[.,!?]$`, 'i');
  const descriptivePattern = new RegExp(`[""\u201C\u201D][,.]?\\s+the\\s+[\\w\\s,'-]+\\s+${SPEECH_VERBS}.*[.,!?]$`, 'i');
  const closingQuotePattern = /[""\u201C\u201D]\s*$/i;
  
  return pronounPattern.test(trimmed) || namedPattern.test(trimmed) || descriptivePattern.test(trimmed) || closingQuotePattern.test(trimmed);
}

export function isCompleteDialogueExchange(line: string): boolean {
  const trimmed = line.trim();
  if (!isDialogueStart(trimmed)) return false;
  if (trimmed.length < 60) return false;
  
  const hasClosingQuote = /[""\u201C\u201D]\s*$/.test(trimmed) || 
                          /[""\u201C\u201D][.!?,]\s*$/.test(trimmed);
  const hasPronounAttribution = new RegExp(`[""\u201C\u201D][,.]?\\s+(he|she|I|they|we)\\s+${SPEECH_VERBS}[^"]*[.!?]\\s*$`, 'i').test(trimmed);
  const hasNamedAttribution = new RegExp(`[""\u201C\u201D][,.]?\\s+[A-Z][a-z'-]+(?:\\s+[A-Z][a-z'-]+)*\\s+${SPEECH_VERBS}[^"]*[.!?]\\s*$`, 'i').test(trimmed);
  const hasDescriptiveAttribution = new RegExp(`[""\u201C\u201D][,.]?\\s+the\\s+[\\w\\s,'-]+\\s+${SPEECH_VERBS}[^"]*[.!?]\\s*$`, 'i').test(trimmed);
  
  return hasClosingQuote || hasPronounAttribution || hasNamedAttribution || hasDescriptiveAttribution;
}
