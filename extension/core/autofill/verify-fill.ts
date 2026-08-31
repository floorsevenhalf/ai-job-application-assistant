import type { UserProfile } from "../../profile/schema";
import type { FillPerformanceStats } from "../performance/types";
import { AUTOFILL_CONFIG } from "./config";
import { fillMatchedFields } from "./fill-matched-fields";
import { findRadioGroup } from "./fill-radio";
import { highlightFilledElement } from "./highlight";
import type { AutofillOptions, FillRequest, FillResult } from "./types";

export interface VerifiedFillBatch { results: FillResult[]; stats: FillPerformanceStats; }

export async function fillMatchedFieldsVerified(
  requests: FillRequest[],
  profile: UserProfile,
  elementMap: Map<string, HTMLElement>,
  options: AutofillOptions = {}
): Promise<VerifiedFillBatch> {
  const started = now();
  const results = fillMatchedFields(requests, profile, elementMap, options);
  const delayMs = options.verificationDelayMs ?? AUTOFILL_CONFIG.postFillVerificationDelayMs;
  if (results.some(result => result.status === "filled") && delayMs > 0) await delay(delayMs);
  const verified = results.map(result => {
    if (result.status !== "filled") return result;
    const element = elementMap.get(result.fieldId);
    if (!element || currentValue(element) !== String(result.filledValue ?? "")) {
      return { ...result, status: "failed" as const, reason: "value_reverted_after_fill" };
    }
    if (options.highlightFilledFields ?? AUTOFILL_CONFIG.highlightEnabled) {
      highlightFilledElement(element, options.highlightDurationMs ?? AUTOFILL_CONFIG.highlightDurationMs);
    }
    return result;
  });
  return { results: verified, stats: fillStats(verified, requests.length, now() - started) };
}

export function currentValue(element: HTMLElement): string {
  if (element instanceof HTMLInputElement && element.type === "radio") {
    return findRadioGroup(element).find(radio => radio.checked)?.value ?? "";
  }
  if (element instanceof HTMLInputElement && element.type === "checkbox") return String(element.checked);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return element.value;
  return "";
}

function fillStats(results: FillResult[], requestedCount: number, durationMs: number): FillPerformanceStats {
  return {
    requestedCount,
    filledCount: results.filter(result => result.status === "filled").length,
    skippedCount: results.filter(result => result.status === "skipped").length,
    failedCount: results.filter(result => result.status === "failed").length,
    durationMs
  };
}
function delay(milliseconds: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, milliseconds)); }
function now(): number { return globalThis.performance?.now?.() ?? Date.now(); }