export const chunkText = (text, size = 1000, overlap = 200) => {
  if (!text) return [];

  // Normalize whitespace: replace multiple spaces/newlines with single space
  const normalizedText = text.replace(/\s+/g, " ").trim();

  const chunks = [];
  let start = 0;

  while (start < normalizedText.length) {
    let end = start + size;

    // If we're near the end, just take the rest
    if (end >= normalizedText.length) {
      chunks.push(normalizedText.slice(start));
      break;
    }

    // Find the best split point
    // We look backwards from 'end' to find a sentence ending or space
    const lookback = normalizedText.slice(start, end);
    
    // Priority 1: Sentence endings (. ! ?)
    // We want to split AFTER the punctuation
    let splitIndex = -1;
    
    const sentenceEnd = Math.max(
      lookback.lastIndexOf(". "),
      lookback.lastIndexOf("? "),
      lookback.lastIndexOf("! ")
    );

    if (sentenceEnd !== -1 && sentenceEnd > size * 0.3) {
      // Found a sentence end reasonably far into the chunk
      splitIndex = start + sentenceEnd + 1; // Include the punctuation
    } else {
      // Priority 2: Space
      const spaceIndex = lookback.lastIndexOf(" ");
      if (spaceIndex !== -1) {
        splitIndex = start + spaceIndex;
      } else {
        // Priority 3: Hard split (word is too long)
        splitIndex = end;
      }
    }

    chunks.push(normalizedText.slice(start, splitIndex).trim());

    // Calculate next start position with overlap
    // We want the next chunk to start 'overlap' characters before the current split
    // But we should align it to a word boundary (space)
    
    let nextStart = Math.max(start + 1, splitIndex - overlap);
    
    if (nextStart < normalizedText.length) {
      // Find the first space after nextStart to align to word boundary
      // This ensures we don't start in the middle of a word
      const nextSpace = normalizedText.indexOf(" ", nextStart);
      if (nextSpace !== -1 && nextSpace < splitIndex) {
        nextStart = nextSpace + 1;
      }
    }

    start = nextStart;
  }

  return chunks;
};
