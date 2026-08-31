import type { FillRequest, FillResult, RestoreResult } from "../core/autofill/types";
import type { FillPerformanceStats, ScanPerformanceStats } from "../core/performance/types";
import type { FieldDescriptor } from "../core/scanner/types";

export const SCAN_PAGE_MESSAGE = "SCAN_PAGE_FIELDS" as const;
export const FILL_PAGE_MESSAGE = "FILL_PAGE_FIELDS" as const;
export const UNDO_PAGE_FILL_MESSAGE = "UNDO_PAGE_FILL" as const;

export interface ScanPageMessage { type: typeof SCAN_PAGE_MESSAGE; }
export interface ScanPageResponse { ok: boolean; scanSessionId?: string; fields: FieldDescriptor[]; stats?: ScanPerformanceStats; error?: string; }
export interface FillPageMessage { type: typeof FILL_PAGE_MESSAGE; scanSessionId: string; requests: FillRequest[]; overwriteExistingValues: boolean; }
export interface FillPageResponse { ok: boolean; results: FillResult[]; stats?: FillPerformanceStats; error?: string; }
export interface UndoPageFillMessage { type: typeof UNDO_PAGE_FILL_MESSAGE; scanSessionId: string; }
export interface UndoPageFillResponse { ok: boolean; results: RestoreResult[]; error?: string; }
export type ContentMessage = ScanPageMessage | FillPageMessage | UndoPageFillMessage;