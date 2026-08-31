import type { FieldKind } from "../scanner/types";
import type { ProfileFieldPath } from "../../profile/paths";

export type EvidenceSource = "label" | "aria-label" | "placeholder" | "name" | "id" | "legend" | "nearby-text" | "parent-text" | "input-type" | "options" | "section";

export interface MatchEvidence {
  source: EvidenceSource;
  text: string;
  score: number;
  matchedTerm?: string;
  kind?: "positive" | "negative" | "type" | "option";
  veto?: boolean;
}

export interface MatchCandidate {
  profilePath: ProfileFieldPath;
  confidence: number;
}

export interface MatchResult {
  fieldId: string;
  status: "matched" | "ambiguous" | "unmatched" | "excluded" | "empty_profile_value";
  profilePath?: ProfileFieldPath;
  confidence: number;
  matchedRuleId?: string;
  evidence: MatchEvidence[];
  candidatePaths: MatchCandidate[];
}

export interface FieldRule {
  id: string;
  profilePath: ProfileFieldPath;
  positiveTerms: string[];
  negativeTerms?: string[];
  allowedKinds?: FieldKind[];
  optionAliases?: string[][];
  thresholds?: { matched: number; review: number };
}

export interface RuleScore {
  rawScore: number;
  confidence: number;
  vetoed: boolean;
  positiveEvidence: MatchEvidence[];
  negativeEvidence: MatchEvidence[];
  typeEvidence: MatchEvidence[];
  optionEvidence: MatchEvidence[];
}