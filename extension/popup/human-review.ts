import type { MatchResult } from '../core/matcher/types';
import { PROFILE_FIELD_PATHS, type ProfileFieldPath } from '../profile/paths';
import { hasProfileValue, resolveProfileValue } from '../profile/resolver';
import type { UserProfile } from '../profile/schema';

export const REVIEWABLE_CONFIDENCE = 0.65;
export const DEFAULT_SELECTED_CONFIDENCE = 0.70;
export const CANDIDATE_CONFLICT_MARGIN = 0.15;
export type SelectionSource = 'rule_matched' | 'rule_confirmed' | 'ai_confirmed';
export interface FieldSelection { profilePath: ProfileFieldPath; source: SelectionSource; }
export function suggestedProfilePath(result: MatchResult): ProfileFieldPath | undefined { return result.profilePath ?? result.candidatePaths[0]?.profilePath; }
export function hasStrongNegativeVeto(result: MatchResult): boolean { return result.evidence.some(evidence => evidence.kind === 'negative' && evidence.veto === true); }
export function isReviewable(result: MatchResult, profile: UserProfile): boolean {
  const profilePath = suggestedProfilePath(result);
  return result.status === 'ambiguous' && result.confidence >= REVIEWABLE_CONFIDENCE && Boolean(profilePath)
    && PROFILE_FIELD_PATHS.includes(profilePath!) && !hasStrongNegativeVeto(result)
    && hasProfileValue(resolveProfileValue(profile, profilePath!));
}
export function hasCandidateConflict(result: MatchResult): boolean {
  const [top, second] = result.candidatePaths;
  return Boolean(top && second && top.confidence - second.confidence < CANDIDATE_CONFLICT_MARGIN);
}
export function defaultFieldSelections(results: MatchResult[], profile?: UserProfile, aiFieldIds: ReadonlySet<string> = new Set()): Map<string, FieldSelection> {
  const selections = new Map<string, FieldSelection>();
  results.forEach(result => {
    const profilePath = suggestedProfilePath(result);
    if (!profilePath) return;
    if (result.status === 'matched') {
      if (aiFieldIds.has(result.fieldId)) return;
      const source: SelectionSource = 'rule_matched';
      if (result.confidence >= DEFAULT_SELECTED_CONFIDENCE) selections.set(result.fieldId, { profilePath, source });
      return;
    }
    if (profile && result.confidence >= DEFAULT_SELECTED_CONFIDENCE && isReviewable(result, profile)) {
      selections.set(result.fieldId, { profilePath, source: 'rule_confirmed' });
    }
  });
  return selections;
}
