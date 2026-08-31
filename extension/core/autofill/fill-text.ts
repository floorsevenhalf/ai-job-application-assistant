import { dispatchFillEvents } from "./dispatch-events";
import type { FieldFillOutcome } from "./internal-types";
import { normalizeDateForInput, validateNumberValue } from "./normalize-value";

export function fillTextField(
  element: HTMLInputElement | HTMLTextAreaElement,
  profileValue: string,
  overwriteExistingValues = false
): FieldFillOutcome {
  const previousValue = element.value;
  if (!overwriteExistingValues && previousValue.trim() !== "") return { status: "skipped", previousValue, reason: "existing_value" };

  let nextValue = profileValue;
  if (element instanceof HTMLInputElement && (element.type === "date" || element.type === "month")) {
    const normalized = normalizeDateForInput(profileValue, element.type);
    if (!normalized.value) return { status: "skipped", previousValue, reason: normalized.reason };
    nextValue = normalized.value;
  }
  if (element instanceof HTMLInputElement && element.type === "number") {
    const validated = validateNumberValue(element, profileValue);
    if (!validated.value) return { status: "skipped", previousValue, reason: validated.reason };
    nextValue = validated.value;
  }

  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (!setter) return { status: "failed", previousValue, reason: "native_value_setter_unavailable" };
  setter.call(element, nextValue);
  dispatchFillEvents(element);
  if (element.value !== nextValue) return { status: "failed", previousValue, filledValue: nextValue, reason: "value_not_persisted" };
  return { status: "filled", previousValue, filledValue: nextValue };
}