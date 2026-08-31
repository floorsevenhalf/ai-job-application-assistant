export function dispatchFillEvents(element: HTMLElement, includeFocusAndBlur = true): void {
  if (includeFocusAndBlur) element.dispatchEvent(new Event("focus", { bubbles: true }));
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  if (includeFocusAndBlur) element.dispatchEvent(new Event("blur", { bubbles: true }));
}