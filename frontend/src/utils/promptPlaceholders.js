// src/utils/promptPlaceholders.js
const PLACEHOLDER_REGEX = /\[([^\]]+)\]/g;

/**
 * Split a prompt into segments: plain text and placeholder tokens.
 * Each segment: { type: 'text' | 'placeholder', value: string, inner: string, key: string }
 */
export function tokenizePrompt(prompt) {
  const segments = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(PLACEHOLDER_REGEX);

  while ((match = regex.exec(prompt)) !== null) {
    const [fullMatch, inner] = match;
    const start = match.index;

    // Add any plain text before this placeholder
    if (start > lastIndex) {
      segments.push({
        type: 'text',
        value: prompt.slice(lastIndex, start),
        key: `text-${lastIndex}`,
      });
    }

    // Add the placeholder
    segments.push({
      type: 'placeholder',
      value: fullMatch,
      inner,
      key: `ph-${start}-${inner}`,
    });

    lastIndex = start + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < prompt.length) {
    segments.push({
      type: 'text',
      value: prompt.slice(lastIndex),
      key: `text-${lastIndex}`,
    });
  }

  return segments;
}

/**
 * Replace a placeholder at a given segment index with new text.
 */
export function replacePlaceholderAt(prompt, placeholderIndex, replacement) {
  const segments = tokenizePrompt(prompt);
  if (
    placeholderIndex < 0 ||
    placeholderIndex >= segments.length ||
    segments[placeholderIndex].type !== 'placeholder'
  ) {
    return prompt;
  }

  segments[placeholderIndex] = {
    type: 'text',
    value: replacement,
    key: segments[placeholderIndex].key,
  };

  return segments.map(s => s.value).join('');
}
