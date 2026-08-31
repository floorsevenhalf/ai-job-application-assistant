export function toHalfWidth(value: string): string {
  return value.replace(/[！-～]/g, character => String.fromCharCode(character.charCodeAt(0) - 0xfee0)).replace(/　/g, " ");
}

export function normalizeText(value: string): string {
  return toHalfWidth(value)
    .toLowerCase()
    .replace(/[\u2010-\u2015_\-–—/\\:：,，.。;；()（）\[\]【】{}<>《》"“”'‘’!?！？@#$%^&*+=|~`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesTerm(text: string, term: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);
  if (!normalizedText || !normalizedTerm) return false;
  if (/^[\x00-\x7f]+$/.test(normalizedTerm)) {
    const textTokens = normalizedText.match(/[a-z0-9]+/g) ?? [];
    const termTokens = normalizedTerm.match(/[a-z0-9]+/g) ?? [];
    if (!termTokens.length || termTokens.length > textTokens.length) return false;
    return textTokens.some((_, index) => termTokens.every((token, offset) => textTokens[index + offset] === token));
  }
  return normalizedText.includes(normalizedTerm);
}

export function termSpecificity(term: string): number {
  const normalized = normalizeText(term);
  if (!normalized) return 0;
  if (!/^[\x00-\x7f]+$/.test(normalized)) {
    const length = normalized.replace(/\s/g, "").length;
    return length >= 4 ? 1 : length >= 2 ? 0.8 : 0.45;
  }
  const tokens = normalized.match(/[a-z0-9]+/g) ?? [];
  if (tokens.length >= 2) return 1;
  const length = tokens[0]?.length ?? 0;
  return length >= 8 ? 0.85 : length >= 6 ? 0.75 : length >= 5 ? 0.65 : length === 4 ? 0.55 : 0.4;
}