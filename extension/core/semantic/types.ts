import type { MatchCandidate, MatchResult } from "../matcher/types";
import type { SanitizedFieldDescriptor } from "../evaluation/types";
import type { ProfileFieldPath } from "../../profile/paths";

export interface SemanticMatchInput {
  field: SanitizedFieldDescriptor;
  candidates: Array<{ profilePath: ProfileFieldPath; ruleConfidence: number }>;
  availableProfilePaths: ProfileFieldPath[];
  sectionContext?: string[];
}
export interface SemanticMatchResult {
  status: "matched" | "ambiguous" | "unmatched";
  profilePath?: ProfileFieldPath;
  confidence: number;
  reasonCodes: string[];
  candidatePaths: MatchCandidate[];
}
export interface SemanticMatcher { match(input: SemanticMatchInput): Promise<SemanticMatchResult>; }
export interface AIProvider { id: string; infer(input: SemanticMatchInput): Promise<unknown>; }
export type AIStatus = "disabled" | "not_triggered" | "succeeded" | "cache_hit" | "failed";
export interface HybridMatchResult {
  ruleResult: MatchResult;
  aiStatus: AIStatus;
  aiResult?: SemanticMatchResult;
  hybridResult: MatchResult;
  source: "rule" | "ai";
  requiresHumanConfirmation: boolean;
  failureReason?: "provider_error" | "timeout" | "invalid_response" | "provider_not_configured" | "invalid_api_key" | "rate_limited" | "provider_timeout" | "provider_unavailable" | "network_error";
}