export interface ScanPerformanceStats {
  scannedElementCount: number;
  usableFieldCount: number;
  excludedFieldCount: number;
  durationMs: number;
}
export interface MatchPerformanceStats {
  matchedCount: number;
  ambiguousCount: number;
  unmatchedCount: number;
  emptyProfileCount: number;
  excludedCount: number;
  durationMs: number;
}
export interface FillPerformanceStats {
  requestedCount: number;
  filledCount: number;
  skippedCount: number;
  failedCount: number;
  durationMs: number;
}