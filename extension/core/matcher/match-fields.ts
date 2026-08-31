import type { MatchPerformanceStats } from "../performance/types";
import type { UserProfile } from "../../profile/schema";
import { hasProfileValue, resolveProfileValue } from "../../profile/resolver";
import type { FieldDescriptor } from "../scanner/types";
import { MATCH_THRESHOLDS } from "./config";
import { scoreFieldAgainstRule } from "./score-rule";
import type { FieldRule, MatchResult } from "./types";

export function matchField(field: FieldDescriptor, profile: UserProfile, rules: FieldRule[]): MatchResult {
  if (field.safety.excluded) {
    return { fieldId: field.fieldId, status: "excluded", confidence: 0, evidence: [], candidatePaths: [] };
  }

  const ranked = rules.map(rule => ({ rule, score: scoreFieldAgainstRule(field, rule) }))
    .sort((left, right) => right.score.confidence - left.score.confidence);
  const top = ranked[0];
  const secondConfidence = ranked[1]?.score.confidence ?? 0;
  const candidatePaths = ranked.slice(0, MATCH_THRESHOLDS.candidateCount).map(candidate => ({
    profilePath: candidate.rule.profilePath,
    confidence: candidate.score.confidence
  }));

  if (!top || top.score.confidence < (top?.rule.thresholds?.review ?? MATCH_THRESHOLDS.review)) {
    return { fieldId: field.fieldId, status: "unmatched", confidence: top?.score.confidence ?? 0, evidence: top ? allEvidence(top.score) : [], candidatePaths };
  }

  const matchedThreshold = top.rule.thresholds?.matched ?? MATCH_THRESHOLDS.matched;
  const hasSafeLead = top.score.confidence - secondConfidence >= MATCH_THRESHOLDS.minimumGap;
  if (top.score.confidence < matchedThreshold || !hasSafeLead) {
    return {
      fieldId: field.fieldId,
      status: "ambiguous",
      profilePath: top.rule.profilePath,
      confidence: top.score.confidence,
      matchedRuleId: top.rule.id,
      evidence: allEvidence(top.score),
      candidatePaths
    };
  }

  const status = hasProfileValue(resolveProfileValue(profile, top.rule.profilePath)) ? "matched" : "empty_profile_value";
  return {
    fieldId: field.fieldId,
    status,
    profilePath: top.rule.profilePath,
    confidence: top.score.confidence,
    matchedRuleId: top.rule.id,
    evidence: allEvidence(top.score),
    candidatePaths
  };
}

export function matchFields(fields: FieldDescriptor[], profile: UserProfile, rules: FieldRule[]): MatchResult[] {
  return fields.map(field => matchField(field, profile, rules));
}

function allEvidence(score: ReturnType<typeof scoreFieldAgainstRule>) {
  return [...score.positiveEvidence, ...score.negativeEvidence, ...score.typeEvidence, ...score.optionEvidence]
    .sort((left, right) => Math.abs(right.score) - Math.abs(left.score));
}
export function matchFieldsWithStats(fields: FieldDescriptor[], profile: UserProfile, rules: FieldRule[]): { results: MatchResult[]; stats: MatchPerformanceStats } {
  const started = globalThis.performance?.now?.() ?? Date.now();
  const results = matchFields(fields, profile, rules);
  return {
    results,
    stats: {
      matchedCount: results.filter(result => result.status === "matched").length,
      ambiguousCount: results.filter(result => result.status === "ambiguous").length,
      unmatchedCount: results.filter(result => result.status === "unmatched").length,
      emptyProfileCount: results.filter(result => result.status === "empty_profile_value").length,
      excludedCount: results.filter(result => result.status === "excluded").length,
      durationMs: (globalThis.performance?.now?.() ?? Date.now()) - started
    }
  };
}