import type { MatchCandidate, MatchEvidence, MatchResult } from "../matcher/types";
import type { FieldDescriptor, FieldKind } from "../scanner/types";
import type { ProfileFieldPath } from "../../profile/paths";

export type SiteCategory = "campus-recruitment" | "ats" | "company-career" | "generic-form";
export type PageType = "basic-info" | "education" | "job-preference" | "multi-step" | "mixed";
export type FailureCategory =
  | "scanner_missing_field" | "scanner_context_incomplete" | "scanner_wrong_grouping"
  | "matcher_unmatched" | "matcher_ambiguous" | "matcher_wrong_match" | "matcher_low_confidence"
  | "custom_select_unsupported" | "cascade_selector_unsupported" | "async_component_unsupported"
  | "shadow_dom" | "iframe" | "contenteditable" | "radio_group_error"
  | "select_option_not_found" | "value_reverted_after_fill" | "session_invalidated"
  | "existing_value" | "unsupported_component" | "unknown";
export type DescriptorQuality = "good" | "partial" | "poor";

export interface CompatibilityCase {
  caseId: string;
  siteCategory: SiteCategory;
  pageType: PageType;
  fieldType: string;
  expectedProfilePath?: ProfileFieldPath;
  scanner: { detected: boolean; descriptorQuality?: DescriptorQuality };
  matcher: { status?: MatchResult["status"]; predictedPath?: ProfileFieldPath; confidence?: number; correct?: boolean };
  autofill: { attempted: boolean; success?: boolean; reason?: string };
  failureCategory?: FailureCategory;
  notes?: string;
}

export interface SanitizedFieldDescriptor {
  kind: FieldKind;
  labelTexts: string[];
  placeholder?: string;
  name?: string;
  id?: string;
  ariaLabel?: string;
  legend?: string;
  nearbyText: string[];
  sectionTexts: string[];
  options: string[];
  inputType?: string;
}

export interface SemanticFallbackCase {
  caseId: string;
  descriptor: SanitizedFieldDescriptor;
  candidates: MatchCandidate[];
  expectedPath: ProfileFieldPath;
}

export interface EvaluationSample {
  caseId: string;
  siteCategory: SiteCategory;
  pageType: PageType;
  fieldType: string;
  expectedProfilePath?: ProfileFieldPath;
  descriptor?: FieldDescriptor;
  descriptorQuality?: DescriptorQuality;
  unsupportedFailure?: FailureCategory;
  autofill: { attempted: boolean; success?: boolean; reason?: string };
  notes?: string;
}

export interface ConfidenceBucket { range: string; count: number; correctCount: number; wrongCount: number; accuracy: number | null; }
export interface EvaluationMetrics {
  totalFields: number; detectedFields: number; matcherEvaluatedFields: number;
  correctMatches: number; wrongMatches: number; ambiguous: number; unmatched: number;
  precision: number; recall: number; f1: number;
  scannerDetectionRecall: number; ambiguousRate: number; unmatchedRate: number; wrongMatchRate: number;
  autofillSuccessRate: number | null;
}
export interface EvaluationReport {
  cases: CompatibilityCase[];
  metrics: EvaluationMetrics;
  confidenceBuckets: ConfidenceBucket[];
  failureCounts: Record<string, number>;
  wrongMatches: Array<{ caseId: string; descriptor?: SanitizedFieldDescriptor; expectedProfilePath?: ProfileFieldPath; predictedProfilePath?: ProfileFieldPath; confidence: number; evidence: MatchEvidence[]; matchedRuleId?: string; candidates: MatchCandidate[] }>;
  falseNegatives: Array<{ caseId: string; descriptor: SanitizedFieldDescriptor; expectedProfilePath: ProfileFieldPath; status: "ambiguous" | "unmatched"; evidence: MatchEvidence[]; candidates: MatchCandidate[] }>;
  fallbackCases: SemanticFallbackCase[];
}