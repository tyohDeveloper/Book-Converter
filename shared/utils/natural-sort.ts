const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
};

const ORDINAL_ONES: Record<string, number> = {
  zeroth: 0, first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16,
  seventeenth: 17, eighteenth: 18, nineteenth: 19
};

const ORDINAL_TENS: Record<string, number> = {
  twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60, seventieth: 70, eightieth: 80, ninetieth: 90
};

function wordToNumber(word: string): number | null {
  const lower = word.toLowerCase().replace(/[-\s]+/g, ' ').replace(/\band\b/g, '').replace(/\s+/g, ' ').trim();
  
  if (ONES[lower] !== undefined) return ONES[lower];
  if (TENS[lower] !== undefined) return TENS[lower];
  if (ORDINAL_ONES[lower] !== undefined) return ORDINAL_ONES[lower];
  if (ORDINAL_TENS[lower] !== undefined) return ORDINAL_TENS[lower];
  
  const parts = lower.split(' ').filter(Boolean);
  
  if (parts.length === 2 && parts[0] === 'hundred') {
    return 100;
  }
  if (parts.length === 2 && parts[0] === 'hundredth') {
    return 100;
  }
  
  if (parts.length >= 2) {
    if (parts[0] === 'one' && parts[1] === 'hundred') {
      if (parts.length === 2) return 100;
      const rest = parts.slice(2).join(' ');
      const restNum = wordToNumber(rest);
      if (restNum !== null) return 100 + restNum;
    }
    if (parts[0] === 'two' && parts[1] === 'hundred') {
      if (parts.length === 2) return 200;
      const rest = parts.slice(2).join(' ');
      const restNum = wordToNumber(rest);
      if (restNum !== null) return 200 + restNum;
    }
    if (parts[0] === 'three' && parts[1] === 'hundred') {
      if (parts.length === 2) return 300;
      const rest = parts.slice(2).join(' ');
      const restNum = wordToNumber(rest);
      if (restNum !== null) return 300 + restNum;
    }
  }
  
  if (parts.length === 2) {
    const tensVal = TENS[parts[0]];
    const onesVal = ONES[parts[1]];
    if (tensVal !== undefined && onesVal !== undefined && onesVal < 10) {
      return tensVal + onesVal;
    }
    const ordTensVal = TENS[parts[0]];
    const ordOnesVal = ORDINAL_ONES[parts[1]];
    if (ordTensVal !== undefined && ordOnesVal !== undefined && ordOnesVal < 10) {
      return ordTensVal + ordOnesVal;
    }
  }
  
  return null;
}

function normalizeForSort(str: string): string {
  const numberWordPattern = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth|hundredth)([-\s]+(?:and[-\s]+)?(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth|fortieth|fiftieth|sixtieth|seventieth|eightieth|ninetieth|hundredth))*\b/gi;
  
  return str.replace(numberWordPattern, (match) => {
    const num = wordToNumber(match);
    if (num !== null) {
      return num.toString().padStart(4, '0');
    }
    return match;
  });
}

export function naturalCompare(a: string, b: string): number {
  const normalizedA = normalizeForSort(a);
  const normalizedB = normalizeForSort(b);
  return collator.compare(normalizedA, normalizedB);
}

export function naturalSort<T>(
  items: T[],
  keyFn?: (item: T) => string
): T[] {
  const sorted = [...items];
  if (keyFn) {
    sorted.sort((a, b) => naturalCompare(keyFn(a), keyFn(b)));
  } else {
    sorted.sort((a, b) => naturalCompare(String(a), String(b)));
  }
  return sorted;
}
