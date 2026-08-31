import { dispatchFillEvents } from "./dispatch-events";
import { findRadioGroup } from "./fill-radio";
import { revalidateElement } from "./safety";
import type { FillResult, RestoreResult } from "./types";
import { currentValue } from "./verify-fill";

export function restoreFilledFields(records: FillResult[], elementMap: Map<string, HTMLElement>): RestoreResult[] {
  return records.filter(record => record.status === "filled").map(record => restoreOne(record, elementMap));
}

function restoreOne(record: FillResult, elementMap: Map<string, HTMLElement>): RestoreResult {
  const element = elementMap.get(record.fieldId);
  if (!element) return result(record, "failed", "field_not_found");
  const unsafe = revalidateElement(element);
  if (unsafe) return result(record, "skipped", unsafe);
  if (currentValue(element) !== String(record.filledValue ?? "")) return result(record, "skipped", "value_changed_after_fill");
  const previous = String(record.previousValue ?? "");

  if (element instanceof HTMLInputElement && element.type === "radio") return restoreRadio(record, element, previous);
  if (element instanceof HTMLSelectElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    if (!setter) return result(record, "failed", "native_value_setter_unavailable");
    setter.call(element, previous); dispatchFillEvents(element);
    return element.value === previous ? restored(record, previous) : result(record, "failed", "restore_not_persisted");
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (!setter) return result(record, "failed", "native_value_setter_unavailable");
    setter.call(element, previous); dispatchFillEvents(element);
    return element.value === previous ? restored(record, previous) : result(record, "failed", "restore_not_persisted");
  }
  return result(record, "failed", "unsupported_element");
}

function restoreRadio(record: FillResult, first: HTMLInputElement, previous: string): RestoreResult {
  const group = findRadioGroup(first);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
  if (!setter) return result(record, "failed", "native_checked_setter_unavailable");
  const current = group.find(radio => radio.checked);
  if (previous === "") {
    if (current) { setter.call(current, false); dispatchFillEvents(current); }
  } else {
    const target = group.find(radio => radio.value === previous && !radio.disabled);
    if (!target) return result(record, "failed", "restore_option_not_found");
    setter.call(target, true); dispatchFillEvents(target);
  }
  return currentValue(first) === previous ? restored(record, previous) : result(record, "failed", "restore_not_persisted");
}

function restored(record: FillResult, restoredValue: unknown): RestoreResult {
  return { fieldId: record.fieldId, profilePath: record.profilePath, status: "restored", restoredValue };
}
function result(record: FillResult, status: "skipped" | "failed", reason: string): RestoreResult {
  return { fieldId: record.fieldId, profilePath: record.profilePath, status, reason };
}