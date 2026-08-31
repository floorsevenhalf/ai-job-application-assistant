import type { ProfileFieldPath } from "../../profile/paths";

export interface FillRequest {
  fieldId: string;
  profilePath: ProfileFieldPath;
}

export type FillStatus = "filled" | "skipped" | "failed";

export interface FillResult {
  fieldId: string;
  profilePath: ProfileFieldPath;
  status: FillStatus;
  previousValue?: unknown;
  filledValue?: unknown;
  reason?: string;
}

export interface AutofillOptions {
  overwriteExistingValues?: boolean;
  verificationDelayMs?: number;
  highlightFilledFields?: boolean;
  highlightDurationMs?: number;
}
export type RestoreStatus = "restored" | "skipped" | "failed";
export interface RestoreResult {
  fieldId: string;
  profilePath: ProfileFieldPath;
  status: RestoreStatus;
  restoredValue?: unknown;
  reason?: string;
}