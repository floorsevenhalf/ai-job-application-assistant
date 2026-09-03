import { PROFILE_FIELD_PATHS } from "../../profile/paths";
import { FIELD_RULES } from "../rules/field-rules";
import { scoreFieldAgainstRule } from "../matcher/score-rule";
import type { MatchResult } from "../matcher/types";
import type { FieldDescriptor } from "../scanner/types";
import { sanitizeDescriptor } from "../evaluation/sanitize";
import { AI_MATCH_CONFIG } from "./config";
import { semanticCacheKey, SemanticMatchCache } from "./cache";
import { assertNoSensitiveProfileValues } from "./privacy";
import type { HybridMatchResult, SemanticMatchInput, SemanticMatcher, SemanticMatchResult } from "./types";

export interface HybridMatcherOptions { enabled:boolean; matcher?:SemanticMatcher; timeoutMs?:number; matchThreshold?:number; minimumGap?:number; cache?:SemanticMatchCache; }
export function vetoedProfilePaths(field:FieldDescriptor):Set<string>{return new Set(FIELD_RULES.filter(rule=>scoreFieldAgainstRule(field,rule).vetoed).map(rule=>rule.profilePath));}
export function createSemanticInput(field:FieldDescriptor,ruleResult:MatchResult):SemanticMatchInput{
  const vetoed=vetoedProfilePaths(field);const available=PROFILE_FIELD_PATHS.filter(path=>!vetoed.has(path));
  const input:SemanticMatchInput={field:sanitizeDescriptor(field),candidates:ruleResult.candidatePaths.filter(item=>!vetoed.has(item.profilePath)).map(item=>({profilePath:item.profilePath,ruleConfidence:item.confidence})),availableProfilePaths:[...available],sectionContext:field.context.sectionTexts??[]};
  assertNoSensitiveProfileValues(input);return input;
}
function fallback(ruleResult:MatchResult,aiStatus:HybridMatchResult["aiStatus"],failureReason?:HybridMatchResult["failureReason"]):HybridMatchResult{return {ruleResult,aiStatus,hybridResult:ruleResult,source:"rule",requiresHumanConfirmation:false,failureReason};}
function safetyGate(field:FieldDescriptor,ruleResult:MatchResult,ai:SemanticMatchResult,threshold:number,margin:number):MatchResult{
  const vetoed=vetoedProfilePaths(field);const ranked=[...ai.candidatePaths].sort((a,b)=>b.confidence-a.confidence);const top=ranked[0];const second=ranked[1]?.confidence??0;
  const valid=ai.status==="matched"&&ai.profilePath&&PROFILE_FIELD_PATHS.includes(ai.profilePath)&&!vetoed.has(ai.profilePath)&&ai.confidence>=threshold&&top?.profilePath===ai.profilePath&&top.confidence-second>=margin;
  if(!valid)return {...ruleResult,status:"ambiguous",profilePath:ai.profilePath,confidence:ai.confidence,candidatePaths:ranked};
  return {...ruleResult,status:"matched",profilePath:ai.profilePath,confidence:ai.confidence,matchedRuleId:"semantic-fallback",candidatePaths:ranked};
}
export async function hybridMatchField(field:FieldDescriptor,ruleResult:MatchResult,options:HybridMatcherOptions):Promise<HybridMatchResult>{
  if(!options.enabled)return fallback(ruleResult,"disabled");
  if(ruleResult.status!=="ambiguous"&&ruleResult.status!=="unmatched")return fallback(ruleResult,"not_triggered");
  if(field.safety.excluded)return fallback(ruleResult,"not_triggered");
  if(!options.matcher)return fallback(ruleResult,"failed","provider_not_configured");
  let input:SemanticMatchInput;try{input=createSemanticInput(field,ruleResult);}catch{return fallback(ruleResult,"failed","invalid_response");}
  if(!input.availableProfilePaths.length)return fallback(ruleResult,"not_triggered");
  const cache=options.cache;const key=semanticCacheKey(input);let result=cache?.get(key);const aiStatus:HybridMatchResult["aiStatus"]=result?"cache_hit":"succeeded";
  if(!result){
    const timeoutMs=options.timeoutMs??AI_MATCH_CONFIG.timeoutMs;let timer:ReturnType<typeof setTimeout>|undefined;
    try{result=await Promise.race([options.matcher.match(input),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("ai_timeout")),timeoutMs);})]);cache?.set(key,result);}catch(error){const message=error instanceof Error?error.message:"";const providerCodes=new Set(["invalid_api_key","rate_limited","provider_timeout","provider_unavailable","network_error"]);const reason=message==="ai_timeout"?"timeout":message==="invalid_response"||message.startsWith("invalid_semantic")?"invalid_response":providerCodes.has(message)?message as HybridMatchResult["failureReason"]:"provider_error";return fallback(ruleResult,"failed",reason);}finally{if(timer)clearTimeout(timer);}
  }
  const hybridResult=safetyGate(field,ruleResult,result,options.matchThreshold??AI_MATCH_CONFIG.matchThreshold,options.minimumGap??AI_MATCH_CONFIG.minimumGap);
  return {ruleResult,aiStatus,aiResult:result,hybridResult,source:hybridResult.status==="matched"?"ai":"rule",requiresHumanConfirmation:hybridResult.status==="matched"};
}