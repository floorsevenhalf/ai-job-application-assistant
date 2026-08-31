import { AUTOFILL_CONFIG } from "./config";
import { findRadioGroup } from "./fill-radio";

interface SavedStyle { outlineValue: string; outlinePriority: string; transitionValue: string; transitionPriority: string; timer: ReturnType<typeof setTimeout>; }
const highlighted = new WeakMap<HTMLElement, SavedStyle>();

export function highlightFilledElement(element: HTMLElement, durationMs: number = AUTOFILL_CONFIG.highlightDurationMs): void {
  const target = highlightTarget(element);
  clearHighlight(target);
  const outlineValue = target.style.getPropertyValue("outline");
  const outlinePriority = target.style.getPropertyPriority("outline");
  const transitionValue = target.style.getPropertyValue("transition");
  const transitionPriority = target.style.getPropertyPriority("transition");
  const reducedMotion = target.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (!reducedMotion) target.style.setProperty("transition", "outline-color 120ms ease");
  target.style.setProperty("outline", "2px solid #3157d5", "important");
  target.dataset.aiJobAssistantFilled = "true";
  const timer = setTimeout(() => clearHighlight(target), durationMs);
  highlighted.set(target, { outlineValue, outlinePriority, transitionValue, transitionPriority, timer });
}

export function clearHighlight(target: HTMLElement): void {
  const saved = highlighted.get(target);
  if (!saved) return;
  clearTimeout(saved.timer);
  restoreProperty(target, "outline", saved.outlineValue, saved.outlinePriority);
  restoreProperty(target, "transition", saved.transitionValue, saved.transitionPriority);
  delete target.dataset.aiJobAssistantFilled;
  highlighted.delete(target);
}

function highlightTarget(element: HTMLElement): HTMLElement {
  if (element instanceof HTMLInputElement && element.type === "radio") {
    const selected = findRadioGroup(element).find(radio => radio.checked) ?? element;
    return selected.closest<HTMLElement>("fieldset, label") ?? selected;
  }
  return element;
}

function restoreProperty(element: HTMLElement, name: string, value: string, priority: string): void {
  if (value) element.style.setProperty(name, value, priority);
  else element.style.removeProperty(name);
}