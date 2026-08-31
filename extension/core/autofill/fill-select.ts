import { dispatchFillEvents } from "./dispatch-events";
import type { FieldFillOutcome } from "./internal-types";
import { findMatchingCandidate } from "./value-matcher";

export function fillSelectField(element: HTMLSelectElement, profileValue: string, overwriteExistingValues = false): FieldFillOutcome {
  const previousValue = element.value;
  if (!overwriteExistingValues && previousValue !== "") return { status: "skipped", previousValue, reason: "existing_value" };
  const candidates = Array.from(element.options, option => ({
    value: option.value,
    label: option.label || option.textContent || "",
    target: option,
    disabled: option.disabled
  }));
  const match = findMatchingCandidate(profileValue, candidates);
  if (!match) return { status: "failed", previousValue, reason: "no_matching_option" };
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  if (!setter) return { status: "failed", previousValue, reason: "native_value_setter_unavailable" };
  setter.call(element, match.value);
  dispatchFillEvents(element);
  if (element.value !== match.value || !match.target.selected) {
    return { status: "failed", previousValue, filledValue: match.value, reason: "value_not_persisted" };
  }
  return { status: "filled", previousValue, filledValue: match.value };
}