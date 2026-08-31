import { PROFILE_FIELD_PATHS, type ProfileFieldPath } from "../../profile/paths";
import type { AIProvider, SemanticMatchInput, SemanticMatcher, SemanticMatchResult } from "./types";
const ALLOWED=new Set<string>(PROFILE_FIELD_PATHS);
export function parseSemanticResult(value:unknown,input:SemanticMatchInput):SemanticMatchResult{
  if(!value||typeof value!=="object")throw new Error("invalid_semantic_response");const item=value as Record<string,unknown>;
  if(!["matched","ambiguous","unmatched"].includes(String(item.status)))throw new Error("invalid_semantic_status");
  if(typeof item.confidence!=="number"||!Number.isFinite(item.confidence)||item.confidence<0||item.confidence>1)throw new Error("invalid_semantic_confidence");
  const allowed=new Set(input.availableProfilePaths);const path=typeof item.profilePath==="string"?item.profilePath:undefined;
  if(path&&(!ALLOWED.has(path)||!allowed.has(path as ProfileFieldPath)))throw new Error("invalid_semantic_profile_path");
  if(item.status==="matched"&&!path)throw new Error("missing_semantic_profile_path");
  if(!Array.isArray(item.reasonCodes)||!item.reasonCodes.every(code=>typeof code==="string"))throw new Error("invalid_semantic_reason_codes");
  if(!Array.isArray(item.candidatePaths))throw new Error("invalid_semantic_candidates");
  const candidates=item.candidatePaths.map(candidate=>{if(!candidate||typeof candidate!=="object")throw new Error("invalid_semantic_candidate");const record=candidate as Record<string,unknown>;if(typeof record.profilePath!=="string"||!ALLOWED.has(record.profilePath)||!allowed.has(record.profilePath as ProfileFieldPath)||typeof record.confidence!=="number"||record.confidence<0||record.confidence>1)throw new Error("invalid_semantic_candidate");return {profilePath:record.profilePath as ProfileFieldPath,confidence:record.confidence};}).sort((a,b)=>b.confidence-a.confidence);
  return {status:item.status as SemanticMatchResult["status"],profilePath:path as ProfileFieldPath|undefined,confidence:item.confidence,reasonCodes:item.reasonCodes as string[],candidatePaths:candidates};
}
export class ProviderSemanticMatcher implements SemanticMatcher{constructor(private readonly provider:AIProvider){}async match(input:SemanticMatchInput):Promise<SemanticMatchResult>{return parseSemanticResult(await this.provider.infer(input),input);}}