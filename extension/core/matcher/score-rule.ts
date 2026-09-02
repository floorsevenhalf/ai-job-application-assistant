import { matchesTerm, normalizeText, termSpecificity } from "../normalization/normalize-text";
import type { FieldDescriptor } from "../scanner/types";
import { EXACT_MATCH_BONUS, NEGATIVE_PENALTY_MULTIPLIER, NEGATIVE_VETO_SOURCES, SOURCE_WEIGHTS, TYPE_MISMATCH_PENALTY } from "./config";
import type { EvidenceSource, FieldRule, MatchEvidence, RuleScore } from "./types";

interface SourceText { source: EvidenceSource; text: string; }
const GENERIC_PLACEHOLDERS = new Set(["请输入", "请选择", "please input", "please select"]);
export interface ScoreOptions {
  enabledSources?: ReadonlySet<EvidenceSource>;
  useNegativeEvidence?: boolean;
  useNegativeVeto?: boolean;
  useOptionEvidence?: boolean;
}
function sourceTexts(field: FieldDescriptor, options: ScoreOptions): SourceText[] {
  const entries: SourceText[] = [
    ...field.context.labelTexts.map(text => ({ source: "label" as const, text })),
    ...(field.context.visualLabelTexts ?? []).map(text => ({ source: "visual-label" as const, text })),
    ...(field.attributes.ariaLabel ? [{ source: "aria-label" as const, text: field.attributes.ariaLabel }] : []),
    ...field.context.ariaLabelledByTexts.map(text => ({ source: "aria-label" as const, text })),
    ...(field.attributes.placeholder && !GENERIC_PLACEHOLDERS.has(normalizeText(field.attributes.placeholder)) ? [{ source: "placeholder" as const, text: field.attributes.placeholder }] : []),
    ...(field.context.legendText ? [{ source: "legend" as const, text: field.context.legendText }] : []),
    ...(field.context.sectionTexts ?? []).map(text => ({ source: "section" as const, text })),
    ...(field.attributes.name ? [{ source: "name" as const, text: field.attributes.name }] : []),
    ...(field.attributes.id ? [{ source: "id" as const, text: field.attributes.id }] : []),
    ...(field.context.parentText ? [{ source: "parent-text" as const, text: field.context.parentText }] : []),
    ...field.context.nearbyText.map(text => ({ source: "nearby-text" as const, text }))
  ].filter(entry => !options.enabledSources || options.enabledSources.has(entry.source));
  const highQuality = new Set(entries.filter(entry => !["parent-text", "nearby-text"].includes(entry.source)).map(entry => normalizeText(entry.text)));
  return entries.filter(entry => !["parent-text", "nearby-text"].includes(entry.source) || !highQuality.has(normalizeText(entry.text)));
}
function bestTerm(text: string, terms: string[]): string | undefined { return terms.filter(term => matchesTerm(text, term)).sort((a,b)=>termSpecificity(b)-termSpecificity(a))[0]; }
function positiveEvidence(field: FieldDescriptor, rule: FieldRule, options: ScoreOptions): MatchEvidence[] {
  return sourceTexts(field, options).flatMap(({source,text}) => { const term=bestTerm(text,rule.positiveTerms); if(!term)return []; const exact=normalizeText(text)===normalizeText(term); const score=Math.min(SOURCE_WEIGHTS[source],SOURCE_WEIGHTS[source]*(termSpecificity(term)+(exact?EXACT_MATCH_BONUS:0))); return [{source,text,score,matchedTerm:term,kind:"positive" as const}]; });
}
function negativeEvidence(field: FieldDescriptor, rule: FieldRule, options: ScoreOptions): MatchEvidence[] {
  if(options.useNegativeEvidence===false || !rule.negativeTerms?.length)return [];
  return sourceTexts(field,options).flatMap(({source,text})=>{const term=bestTerm(text,rule.negativeTerms!);if(!term)return [];const veto=options.useNegativeVeto!==false&&NEGATIVE_VETO_SOURCES.has(source);return [{source,text,score:-(SOURCE_WEIGHTS[source]*termSpecificity(term)*NEGATIVE_PENALTY_MULTIPLIER),matchedTerm:term,kind:"negative" as const,veto}];});
}
function typeEvidence(field:FieldDescriptor,rule:FieldRule,options:ScoreOptions):MatchEvidence[]{if(options.enabledSources&&!options.enabledSources.has("input-type"))return [];if(!rule.allowedKinds?.length)return [];const generic=["text","textarea","unknown"].includes(field.kind);if(rule.allowedKinds.includes(field.kind)){if(generic)return [];return [{source:"input-type",text:field.kind,score:SOURCE_WEIGHTS["input-type"],matchedTerm:field.kind,kind:"type"}];}return [{source:"input-type",text:field.kind,score:-TYPE_MISMATCH_PENALTY,kind:"type"}];}
function optionEvidence(field:FieldDescriptor,rule:FieldRule,options:ScoreOptions):MatchEvidence[]{if(options.useOptionEvidence===false||(options.enabledSources&&!options.enabledSources.has("options"))||!rule.optionAliases?.length||!field.options.length)return [];const texts=field.options.flatMap(option=>[option.label,option.value]);const groups=rule.optionAliases.filter(aliases=>aliases.some(alias=>texts.some(text=>matchesTerm(text,alias))));if(groups.length<2)return [];return [{source:"options",text:field.options.map(option=>option.label||option.value).join(" / "),score:SOURCE_WEIGHTS.options,matchedTerm:`${groups.length} option groups`,kind:"option"}];}
export function scoreFieldAgainstRule(field:FieldDescriptor,rule:FieldRule,options:ScoreOptions={}):RuleScore{const positive=positiveEvidence(field,rule,options);const negative=negativeEvidence(field,rule,options);const type=typeEvidence(field,rule,options);const option=optionEvidence(field,rule,options);const vetoed=negative.some(evidence=>evidence.veto);const rawScore=[...positive,...negative,...type,...option].reduce((sum,evidence)=>sum+evidence.score,0);return {rawScore,confidence:vetoed?0:Math.max(0,Math.min(1,rawScore)),vetoed,positiveEvidence:positive,negativeEvidence:negative,typeEvidence:type,optionEvidence:option};}