import { FIELD_RULES } from "../rules/field-rules";
import { scoreFieldAgainstRule, type ScoreOptions } from "../matcher/score-rule";
import type { EvidenceSource, MatchResult } from "../matcher/types";
import { sanitizeDescriptor } from "./sanitize";
import type { CompatibilityCase, ConfidenceBucket, EvaluationMetrics, EvaluationReport, EvaluationSample, FailureCategory } from "./types";

export interface EvaluationConfig extends ScoreOptions { matchedThreshold?: number; reviewThreshold?: number; minimumGap?: number; }
const DEFAULTS = { matchedThreshold: 0.85, reviewThreshold: 0.65, minimumGap: 0.15 };
const BUCKETS = [[0, .5, "0.00–0.49"], [.5, .65, "0.50–0.64"], [.65, .75, "0.65–0.74"], [.75, .85, "0.75–0.84"], [.85, .95, "0.85–0.94"], [.95, 1.000001, "0.95–1.00"]] as const;

export function predictSample(sample: EvaluationSample, config: EvaluationConfig = {}): MatchResult | undefined {
  if (!sample.descriptor) return undefined;
  const ranked = FIELD_RULES.map(rule => ({ rule, score: scoreFieldAgainstRule(sample.descriptor!, rule, config) })).sort((a, b) => b.score.confidence - a.score.confidence);
  const top = ranked[0]; const second = ranked[1]?.score.confidence ?? 0;
  const candidates = ranked.slice(0, 3).map(item => ({ profilePath: item.rule.profilePath, confidence: item.score.confidence }));
  const evidence = top ? [...top.score.positiveEvidence, ...top.score.negativeEvidence, ...top.score.typeEvidence, ...top.score.optionEvidence].sort((a,b)=>Math.abs(b.score)-Math.abs(a.score)) : [];
  if (!top || top.score.confidence < (config.reviewThreshold ?? DEFAULTS.reviewThreshold)) return { fieldId: sample.caseId, status: "unmatched", confidence: top?.score.confidence ?? 0, evidence, candidatePaths: candidates };
  const status = top.score.confidence >= (config.matchedThreshold ?? DEFAULTS.matchedThreshold) && top.score.confidence - second >= (config.minimumGap ?? DEFAULTS.minimumGap) ? "matched" : "ambiguous";
  return { fieldId: sample.caseId, status, profilePath: top.rule.profilePath, confidence: top.score.confidence, matchedRuleId: top.rule.id, evidence, candidatePaths: candidates };
}
function failure(sample: EvaluationSample, result?: MatchResult): FailureCategory | undefined {
  if (!sample.descriptor) return sample.unsupportedFailure ?? "scanner_missing_field";
  if (result?.status === "unmatched" && sample.expectedProfilePath) return "matcher_unmatched";
  if (result?.status === "ambiguous" && sample.expectedProfilePath) return "matcher_ambiguous";
  if (result?.status === "matched" && result.profilePath !== sample.expectedProfilePath) return "matcher_wrong_match";
  if (sample.autofill.attempted && !sample.autofill.success) return (sample.autofill.reason as FailureCategory) ?? "unknown";
  return undefined;
}
function metrics(cases: CompatibilityCase[]): EvaluationMetrics {
  const predicted = cases.filter(item => item.matcher.status === "matched");
  const correct = predicted.filter(item => item.matcher.correct).length;
  const expected = cases.filter(item => item.expectedProfilePath).length;
  const wrong = predicted.length - correct;
  const precision = predicted.length ? correct / predicted.length : 0;
  const recall = expected ? correct / expected : 0;
  const attempted = cases.filter(item => item.autofill.attempted);
  return { totalFields: cases.length, detectedFields: cases.filter(item => item.scanner.detected).length, matcherEvaluatedFields: cases.filter(item => item.scanner.detected).length, correctMatches: correct, wrongMatches: wrong, ambiguous: cases.filter(item => item.matcher.status === "ambiguous").length, unmatched: cases.filter(item => item.matcher.status === "unmatched").length, precision, recall, f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0, scannerDetectionRecall: cases.length ? cases.filter(item => item.scanner.detected).length / cases.length : 0, ambiguousRate: cases.length ? cases.filter(item => item.matcher.status === "ambiguous").length / cases.length : 0, unmatchedRate: cases.length ? cases.filter(item => item.matcher.status === "unmatched").length / cases.length : 0, wrongMatchRate: cases.length ? wrong / cases.length : 0, autofillSuccessRate: attempted.length ? attempted.filter(item => item.autofill.success).length / attempted.length : null };
}
function buckets(cases: CompatibilityCase[]): ConfidenceBucket[] { return BUCKETS.map(([min,max,range]) => { const values=cases.filter(item => item.matcher.confidence !== undefined && item.matcher.confidence >= min && item.matcher.confidence < max); const correct=values.filter(item=>item.matcher.correct).length; const wrong=values.filter(item=>item.matcher.predictedPath && !item.matcher.correct).length; return {range,count:values.length,correctCount:correct,wrongCount:wrong,accuracy:values.length ? correct/values.length:null}; }); }
export function evaluateSamples(samples: EvaluationSample[], config: EvaluationConfig = {}): EvaluationReport {
  const detailed=samples.map(sample=>({sample,result:predictSample(sample,config)}));
  const cases: CompatibilityCase[]=detailed.map(({sample,result})=>({caseId:sample.caseId,siteCategory:sample.siteCategory,pageType:sample.pageType,fieldType:sample.fieldType,expectedProfilePath:sample.expectedProfilePath,scanner:{detected:Boolean(sample.descriptor),descriptorQuality:sample.descriptorQuality},matcher:{status:result?.status,predictedPath:result?.profilePath,confidence:result?.confidence,correct:Boolean(result?.profilePath && result.profilePath === sample.expectedProfilePath)},autofill:sample.autofill,failureCategory:failure(sample,result),notes:sample.notes}));
  const failureCounts:Record<string,number>={}; cases.forEach(item=>{if(item.failureCategory) failureCounts[item.failureCategory]=(failureCounts[item.failureCategory]??0)+1;});
  const wrongMatches=detailed.filter(({sample,result})=>result?.status === "matched" && result.profilePath !== sample.expectedProfilePath).map(({sample,result})=>({caseId:sample.caseId,descriptor:sample.descriptor ? sanitizeDescriptor(sample.descriptor):undefined,expectedProfilePath:sample.expectedProfilePath,predictedProfilePath:result!.profilePath,confidence:result!.confidence,evidence:result!.evidence,matchedRuleId:result!.matchedRuleId,candidates:result!.candidatePaths}));
  const falseNegatives=detailed.filter(({sample,result})=>sample.expectedProfilePath && (result?.status === "ambiguous" || result?.status === "unmatched")).map(({sample,result})=>({caseId:sample.caseId,descriptor:sanitizeDescriptor(sample.descriptor!),expectedProfilePath:sample.expectedProfilePath!,status:result!.status as "ambiguous"|"unmatched",evidence:result!.evidence,candidates:result!.candidatePaths}));
  const fallbackCases=falseNegatives.map(item=>({caseId:item.caseId,descriptor:item.descriptor,candidates:item.candidates,expectedPath:item.expectedProfilePath}));
  return {cases,metrics:metrics(cases),confidenceBuckets:buckets(cases),failureCounts,wrongMatches,falseNegatives,fallbackCases};
}

export const ABLATIONS: Array<{name:string;config:EvaluationConfig}> = [
  {name:"A label only",config:{enabledSources:new Set<EvidenceSource>(["label"]),useNegativeEvidence:false,useNegativeVeto:false,useOptionEvidence:false}},
  {name:"B label + placeholder",config:{enabledSources:new Set<EvidenceSource>(["label","placeholder"]),useNegativeEvidence:false,useNegativeVeto:false,useOptionEvidence:false}},
  {name:"C label + placeholder + name/id",config:{enabledSources:new Set<EvidenceSource>(["label","placeholder","name","id"]),useNegativeEvidence:false,useNegativeVeto:false,useOptionEvidence:false}},
  {name:"D all context",config:{useNegativeEvidence:false,useNegativeVeto:false,useOptionEvidence:false}},
  {name:"E context + negative veto",config:{useNegativeEvidence:true,useNegativeVeto:true,useOptionEvidence:false}},
  {name:"F context + veto + options",config:{useNegativeEvidence:true,useNegativeVeto:true,useOptionEvidence:true}}
];