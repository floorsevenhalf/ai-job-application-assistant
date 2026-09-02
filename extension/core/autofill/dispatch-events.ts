export type FillEventStage = "focus" | "input" | "change" | "blur";

export function dispatchFillEvents(element: HTMLElement, includeFocusAndBlur = true, afterEvent?: (stage: FillEventStage) => void): void {
  if (includeFocusAndBlur) { element.dispatchEvent(new Event("focus", { bubbles: true })); afterEvent?.("focus"); }
  element.dispatchEvent(new Event("input", { bubbles: true })); afterEvent?.("input");
  element.dispatchEvent(new Event("change", { bubbles: true })); afterEvent?.("change");
  if (includeFocusAndBlur) { element.dispatchEvent(new Event("blur", { bubbles: true })); afterEvent?.("blur"); }
}
