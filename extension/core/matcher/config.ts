import type { EvidenceSource } from "./types";

export const SOURCE_WEIGHTS: Record<EvidenceSource, number> = {
  label: 1,
  "visual-label": 0.9,
  "aria-label": 0.95,
  placeholder: 0.85,
  legend: 0.8,
  section: 0.75,
  name: 0.7,
  id: 0.65,
  "parent-text": 0.45,
  "nearby-text": 0.35,
  "input-type": 0.25,
  options: 0.4
};

export const MATCH_THRESHOLDS = { matched: 0.85, review: 0.65, minimumGap: 0.15, candidateCount: 3 } as const;
export const EXACT_MATCH_BONUS = 0.1;
export const TYPE_MISMATCH_PENALTY = 0.2;
export const NEGATIVE_PENALTY_MULTIPLIER = 0.9;
export const NEGATIVE_VETO_SOURCES = new Set<EvidenceSource>(["label", "aria-label", "legend", "section"]);