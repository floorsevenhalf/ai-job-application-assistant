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

  // Focus before writing, matching the order of real user input. Some controlled
  // components restore their current state synchronously when they receive focus.
  element.dispatchEvent(new Event("focus", { bubbles: true }));
  setter.call(element, nextValue);
  let firstFailure = element.value !== nextValue ? "value_not_written" : undefined;
  for (const stage of ["input", "change", "blur"] as const) {
    element.dispatchEvent(new Event(stage, { bubbles: true }));
    if (!firstFailure && element.value !== nextValue) firstFailure = `value_reverted_on_${stage}`;
  }
  if (firstFailure) return { status: "failed", previousValue, filledValue: nextValue, reason: firstFailure };
  return { status: "filled", previousValue, filledValue: nextValue };
}
