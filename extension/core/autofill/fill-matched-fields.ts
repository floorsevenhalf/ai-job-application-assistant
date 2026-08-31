import type { MatchResult } from "../matcher/types";
import type { UserProfile } from "../../profile/schema";
import { resolveProfileValue } from "../../profile/resolver";
import { fillRadioGroup } from "./fill-radio";
import { fillSelectField } from "./fill-select";
import { fillTextField } from "./fill-text";
import { scalarProfileValue } from "./normalize-value";
import { revalidateElement } from "./safety";
import type { AutofillOptions, FillRequest, FillResult } from "./types";

const TEXT_INPUT_TYPES = new Set(["text", "email", "tel", "number", "date", "month", "search", "url"]);

export function createFillRequests(matches: MatchResult[], selectedFieldIds: ReadonlySet<string>): FillRequest[] {
  return matches.flatMap(match =>
    match.status === "matched" && match.profilePath && selectedFieldIds.has(match.fieldId)
      ? [{ fieldId: match.fieldId, profilePath: match.profilePath }]
      : []
  );
}

export function fillMatchedFields(
  requests: FillRequest[],
  profile: UserProfile,
  elementMap: Map<string, HTMLElement>,
  options: AutofillOptions = {}
): FillResult[] {
  return requests.map(request => fillOne(request, profile, elementMap, options));
}

function fillOne(request: FillRequest, profile: UserProfile, elementMap: Map<string, HTMLElement>, options: AutofillOptions): FillResult {
  const element = elementMap.get(request.fieldId);
  if (!element) return result(request, "failed", { reason: "field_not_found" });
  const unsafeReason = revalidateElement(element);
  if (unsafeReason) return result(request, "skipped", { reason: unsafeReason });
  const resolved = scalarProfileValue(resolveProfileValue(profile, request.profilePath));
  if (!resolved.value) return result(request, "skipped", { reason: resolved.reason });
  const overwrite = options.overwriteExistingValues ?? false;

  if (element instanceof HTMLSelectElement) return result(request, ...outcomeArgs(fillSelectField(element, resolved.value, overwrite)));
  if (element instanceof HTMLTextAreaElement) return result(request, ...outcomeArgs(fillTextField(element, resolved.value, overwrite)));
  if (element instanceof HTMLInputElement) {
    if (element.type === "radio") return result(request, ...outcomeArgs(fillRadioGroup(element, resolved.value, overwrite)));
    if (element.type === "checkbox") return result(request, "skipped", { previousValue: element.checked, reason: "checkbox_without_boolean_profile_mapping" });
    if (TEXT_INPUT_TYPES.has(element.type)) return result(request, ...outcomeArgs(fillTextField(element, resolved.value, overwrite)));
  }
  return result(request, "skipped", { reason: "unsupported_element" });
}

function outcomeArgs(outcome: { status: FillResult["status"]; previousValue?: unknown; filledValue?: unknown; reason?: string }): [FillResult["status"], Omit<FillResult, "fieldId" | "profilePath" | "status">] {
  const { status, ...details } = outcome;
  return [status, details];
}

function result(
  request: FillRequest,
  status: FillResult["status"],
  details: Omit<FillResult, "fieldId" | "profilePath" | "status">
): FillResult {
  return { fieldId: request.fieldId, profilePath: request.profilePath, status, ...details };
}