import { getLabelTexts } from "../scanner/context";
import { dispatchFillEvents } from "./dispatch-events";
import type { FieldFillOutcome } from "./internal-types";
import { revalidateElement } from "./safety";
import { findMatchingCandidate } from "./value-matcher";

export function findRadioGroup(first: HTMLInputElement): HTMLInputElement[] {
  const fieldset = first.closest("fieldset");
  let candidates: HTMLInputElement[];
  if (fieldset) {
    candidates = Array.from(fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  } else if (first.form) {
    candidates = Array.from(first.form.elements).filter((element): element is HTMLInputElement =>
      element instanceof HTMLInputElement && element.type === "radio"
    );
  } else {
    candidates = Array.from(first.ownerDocument.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  }
  if (first.name) return candidates.filter(candidate => candidate.name === first.name);
  return fieldset ? candidates.filter(candidate => !candidate.name) : [first];
}

export function fillRadioGroup(first: HTMLInputElement, profileValue: string, overwriteExistingValues = false): FieldFillOutcome {
  const group = findRadioGroup(first);
  const checked = group.find(element => element.checked);
  const previousValue = checked?.value ?? "";
  if (!overwriteExistingValues && checked) return { status: "skipped", previousValue, reason: "existing_value" };
  const candidates = group.map(element => ({
    value: element.value,
    label: getLabelTexts(element)[0] || element.getAttribute("aria-label") || element.value,
    target: element,
    disabled: Boolean(revalidateElement(element))
  }));
  const match = findMatchingCandidate(profileValue, candidates);
  if (!match) return { status: "failed", previousValue, reason: "no_matching_option" };
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
  if (!setter) return { status: "failed", previousValue, reason: "native_checked_setter_unavailable" };
  setter.call(match.target, true);
  // React's public change plugin observes radio clicks; this targets only the
  // already matched radio control and never traverses to buttons or submitters.
  match.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  dispatchFillEvents(match.target);
  if (!match.target.checked || group.some(element => element !== match.target && element.checked)) {
    return { status: "failed", previousValue, filledValue: match.value, reason: "value_not_persisted" };
  }
  return { status: "filled", previousValue, filledValue: match.value };
}