import { fillForScanSessionVerified } from "../core/autofill/fill-session";
import { restoreFilledFields } from "../core/autofill/restore-fields";
import type { FillResult } from "../core/autofill/types";
import { scanDocument } from "../core/scanner/scan-form";
import { loadProfile } from "../storage/profile-storage";
import type { ContentMessage, FillPageMessage, FillPageResponse, ScanPageResponse, UndoPageFillMessage, UndoPageFillResponse } from "../messaging/messages";
import { observeScannedElements, type SessionObserver } from "./session-observer";

const SCAN_PAGE_MESSAGE = "SCAN_PAGE_FIELDS";
const FILL_PAGE_MESSAGE = "FILL_PAGE_FIELDS";
const UNDO_PAGE_FILL_MESSAGE = "UNDO_PAGE_FILL";
const fieldElements = new Map<string, HTMLElement>();
let currentScanSessionId: string | null = null;
let sessionObserver: SessionObserver | null = null;
let lastFilledResults: FillResult[] = [];

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  if (message?.type === SCAN_PAGE_MESSAGE) {
    try {
      const result = scanDocument(document);
      beginScanSession(result.scanSessionId, result.elementMap);
      sendResponse({ ok: true, scanSessionId: result.scanSessionId, fields: result.fields, stats: result.stats } satisfies ScanPageResponse);
    } catch (error) {
      sendResponse({ ok: false, fields: [], error: error instanceof Error ? error.message : "Unknown scanner error" } satisfies ScanPageResponse);
    }
    return false;
  }
  if (message?.type === FILL_PAGE_MESSAGE) { void handleFill(message, sendResponse); return true; }
  if (message?.type === UNDO_PAGE_FILL_MESSAGE) { handleUndo(message, sendResponse); return false; }
  return false;
});

function beginScanSession(scanSessionId: string, elements: Map<string, HTMLElement>): void {
  sessionObserver?.disconnect();
  currentScanSessionId = scanSessionId;
  lastFilledResults = [];
  fieldElements.clear();
  elements.forEach((element, fieldId) => fieldElements.set(fieldId, element));
  sessionObserver = observeScannedElements(fieldElements.values(), invalidateScanSession);
}

function invalidateScanSession(): void {
  currentScanSessionId = null;
  lastFilledResults = [];
  fieldElements.clear();
  sessionObserver = null;
}

async function handleFill(message: FillPageMessage, sendResponse: (response: FillPageResponse) => void): Promise<void> {
  try {
    const profile = await loadProfile();
    const batch = await fillForScanSessionVerified(message.scanSessionId, currentScanSessionId, message.requests, profile, fieldElements, {
      overwriteExistingValues: message.overwriteExistingValues
    });
    lastFilledResults = batch.results.filter(result => result.status === "filled");
    const stale = batch.results.length > 0 && batch.results.every(result => result.reason === "stale_scan_session");
    sendResponse({ ok: !stale, results: batch.results, stats: batch.stats });
  } catch (error) {
    sendResponse({ ok: false, results: [], error: error instanceof Error ? error.message : "Unknown autofill error" });
  }
}

function handleUndo(message: UndoPageFillMessage, sendResponse: (response: UndoPageFillResponse) => void): void {
  if (!currentScanSessionId || message.scanSessionId !== currentScanSessionId) {
    sendResponse({ ok: false, results: [], error: "stale_scan_session" });
    return;
  }
  if (!lastFilledResults.length) {
    sendResponse({ ok: false, results: [], error: "no_fill_history" });
    return;
  }
  const results = restoreFilledFields(lastFilledResults, fieldElements);
  lastFilledResults = [];
  sendResponse({ ok: true, results });
}

console.debug("[AI Job Application Assistant] Robust local form assistant ready.");