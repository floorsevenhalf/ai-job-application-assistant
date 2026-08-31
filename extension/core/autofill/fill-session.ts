import type { UserProfile } from "../../profile/schema";
import { fillMatchedFields } from "./fill-matched-fields";
import { fillMatchedFieldsVerified, type VerifiedFillBatch } from "./verify-fill";
import type { AutofillOptions, FillRequest, FillResult } from "./types";

export function fillForScanSession(
  requestedSessionId: string,
  currentSessionId: string | null,
  requests: FillRequest[],
  profile: UserProfile,
  elementMap: Map<string, HTMLElement>,
  options: AutofillOptions = {}
): FillResult[] {
  if (!currentSessionId || requestedSessionId !== currentSessionId) {
    return requests.map(request => ({ ...request, status: "failed", reason: "stale_scan_session" }));
  }
  return fillMatchedFields(requests, profile, elementMap, options);
}
export async function fillForScanSessionVerified(
  requestedSessionId: string,
  currentSessionId: string | null,
  requests: FillRequest[],
  profile: UserProfile,
  elementMap: Map<string, HTMLElement>,
  options: AutofillOptions = {}
): Promise<VerifiedFillBatch> {
  const started = globalThis.performance?.now?.() ?? Date.now();
  if (!currentSessionId || requestedSessionId !== currentSessionId) {
    const results: FillResult[] = requests.map(request => ({ ...request, status: "failed", reason: "stale_scan_session" }));
    return {
      results,
      stats: { requestedCount: requests.length, filledCount: 0, skippedCount: 0, failedCount: results.length, durationMs: (globalThis.performance?.now?.() ?? Date.now()) - started }
    };
  }
  return fillMatchedFieldsVerified(requests, profile, elementMap, options);
}