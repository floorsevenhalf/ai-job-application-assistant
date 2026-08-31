import type { MatchResult } from "../core/matcher/types";
import type { HybridMatchResult } from "../core/semantic/types";
export function defaultSelectedFieldIds(ruleResults:MatchResult[],hybridResults:Map<string,HybridMatchResult>):Set<string>{return new Set(ruleResults.filter(rule=>rule.status==="matched"&&hybridResults.get(rule.fieldId)?.source!=="ai").map(rule=>rule.fieldId));}