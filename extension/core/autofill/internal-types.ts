import type { FillStatus } from "./types";
export interface FieldFillOutcome {
  status: FillStatus;
  previousValue?: unknown;
  filledValue?: unknown;
  reason?: string;
}