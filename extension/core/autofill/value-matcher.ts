import { normalizeText } from "../normalization/normalize-text";
import { VALUE_ALIAS_GROUPS } from "../rules/value-aliases";

export interface ValueCandidate<T> { value: string; label: string; target: T; disabled?: boolean; }

function aliasGroup(value: string) {
  const normalized = normalizeText(value);
  return VALUE_ALIAS_GROUPS.find(group => group.aliases.some(alias => normalizeText(alias) === normalized));
}

export function findMatchingCandidate<T>(profileValue: string, candidates: ValueCandidate<T>[]): ValueCandidate<T> | undefined {
  const enabled = candidates.filter(candidate => !candidate.disabled);
  const normalizedTarget = normalizeText(profileValue);
  const checks: Array<(candidate: ValueCandidate<T>) => boolean> = [
    candidate => candidate.value === profileValue,
    candidate => normalizeText(candidate.value) === normalizedTarget,
    candidate => candidate.label === profileValue,
    candidate => normalizeText(candidate.label) === normalizedTarget
  ];
  for (const check of checks) {
    const matches = enabled.filter(check);
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) return undefined;
  }
  const targetGroup = aliasGroup(profileValue);
  if (!targetGroup) return undefined;
  const aliasMatches = enabled.filter(candidate => [candidate.value, candidate.label].some(value =>
    targetGroup.aliases.some(alias => normalizeText(alias) === normalizeText(value))
  ));
  return aliasMatches.length === 1 ? aliasMatches[0] : undefined;
}