const MAX_TEXT_LENGTH = 160;

export function cleanText(value: string | null | undefined, maxLength = MAX_TEXT_LENGTH): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function uniqueTexts(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map(value => cleanText(value, 100)).filter(Boolean))];
}

export function textWithoutControls(element: Element | null): string {
  if (!element) return "";
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll("input, textarea, select, option, button, script, style").forEach(node => node.remove());
  return cleanText(clone.textContent);
}