import { useEffect, useMemo, useState } from "react";

import { createFillRequests } from "../core/autofill/fill-matched-fields";

import type { FillResult } from "../core/autofill/types";

import { sanitizeDescriptor } from "../core/evaluation/sanitize";

import { matchFieldsWithStats } from "../core/matcher/match-fields";

import type { MatchResult } from "../core/matcher/types";

import type { FillPerformanceStats, MatchPerformanceStats, ScanPerformanceStats } from "../core/performance/types";

import { FIELD_RULES } from "../core/rules/field-rules";

import type { FieldDescriptor } from "../core/scanner/types";

import { SemanticMatchCache } from "../core/semantic/cache";

import { hybridMatchField } from "../core/semantic/hybrid-matcher";

import { aiProviderRegistry } from "../core/semantic/provider-registry";

import { ProviderSemanticMatcher } from "../core/semantic/semantic-matcher";

import type { HybridMatchResult } from "../core/semantic/types";

import { FILL_PAGE_MESSAGE, SCAN_PAGE_MESSAGE, UNDO_PAGE_FILL_MESSAGE, type FillPageResponse, type ScanPageResponse, type UndoPageFillResponse } from "../messaging/messages";

import { resolveProfileValue } from "../profile/resolver";

import type { UserProfile } from "../profile/schema";

import { loadAISettings, saveAISettings, type AISettings } from "../storage/ai-settings";

import { loadProfile } from "../storage/profile-storage";

import { fillReasonMessage } from "./fill-reason-messages";

import { defaultFieldSelections, hasCandidateConflict, isReviewable, suggestedProfilePath, type FieldSelection } from "./human-review";

const semanticCache=new SemanticMatchCache();

export function App(){
 const [fields,setFields]=useState<FieldDescriptor[]>([]);
const [rules,setRules]=useState<MatchResult[]>([]);
const [hybrids,setHybrids]=useState<Map<string,HybridMatchResult>>(new Map());
const [profile,setProfile]=useState<UserProfile|null>(null);
const [selected,setSelected]=useState<Map<string,FieldSelection>>(new Map());
const [scanSessionId,setScanSessionId]=useState<string|null>(null);
const [scannedTabId,setScannedTabId]=useState<number|null>(null);
const [overwrite,setOverwrite]=useState(false);
const [fillResults,setFillResults]=useState<Record<string,FillResult>>({});
const [scanStats,setScanStats]=useState<ScanPerformanceStats|null>(null);
const [matchStats,setMatchStats]=useState<MatchPerformanceStats|null>(null);
const [fillStats,setFillStats]=useState<FillPerformanceStats|null>(null);
const [aiSettings,setAISettings]=useState<AISettings>({enabled:false,providerId:"",apiKey:""});
const [aiRunning,setAIRunning]=useState(false);
const [status,setStatus]=useState("尚未扫描当前页面。");

 useEffect(()=>{void loadAISettings().then(setAISettings);
},[]);

 const effective=useMemo(()=>rules.map(rule=>hybrids.get(rule.fieldId)?.hybridResult??rule),[rules,hybrids]);

 async function toggleAI(enabled:boolean){const next={...aiSettings,enabled};
setAISettings(next);
await saveAISettings(next);
}
 async function scanPage(){setStatus("正在扫描和识别…");
try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
if(!tab.id)throw new Error("tab");
const response=await chrome.tabs.sendMessage(tab.id,{type:SCAN_PAGE_MESSAGE}) as ScanPageResponse;
if(!response.ok||!response.scanSessionId)throw new Error(response.error);
const nextProfile=await loadProfile();
const settings=await loadAISettings();
const batch=matchFieldsWithStats(response.fields,nextProfile,FIELD_RULES);
setFields(response.fields);
setRules(batch.results);
setHybrids(new Map());
setProfile(nextProfile);
setSelected(defaultFieldSelections(batch.results,nextProfile));
setScanSessionId(response.scanSessionId);
setScannedTabId(tab.id);
setFillResults({});
setScanStats(response.stats??null);
setMatchStats(batch.stats);
setFillStats(null);
setAISettings(settings);
setStatus(`扫描到 ${response.fields.length} 个字段；Rule Matcher 已确认 ${batch.stats.matchedCount} 个。`);
}catch{clearScanState();
setStatus("无法扫描此页面。请刷新普通网页后重试。");
}}
 function clearScanState(){setFields([]);
setRules([]);
setHybrids(new Map());
setProfile(null);
setSelected(new Map());
setScanSessionId(null);
setScannedTabId(null);
setFillResults({});
setScanStats(null);
setMatchStats(null);
setFillStats(null);
}
 async function runAI(){if(!aiSettings.enabled)return;
setAIRunning(true);
setStatus("正在运行可选 AI fallback…");
const provider=aiProviderRegistry.get(aiSettings.providerId);
const matcher=provider?new ProviderSemanticMatcher(provider):undefined;
const entries=await Promise.all(fields.map(async(field,index)=>[field.fieldId,await hybridMatchField(field,rules[index],{enabled:true,matcher,cache:semanticCache})] as const));
const next=new Map(entries);
setHybrids(next);
if(profile){const nextEffective=rules.map(rule=>next.get(rule.fieldId)?.hybridResult??rule);const aiIds=new Set([...next].filter(([,item])=>item.source==="ai").map(([id])=>id));setSelected(defaultFieldSelections(nextEffective,profile,aiIds));}
const suggested=[...next.values()].filter(item=>item.source==="ai").length;
const failed=[...next.values()].filter(item=>item.aiStatus==="failed").length;
setStatus(`AI fallback 完成：建议 ${suggested}，失败/未配置 ${failed}。AI 建议需手动勾选。`);
setAIRunning(false);
}
 function toggleField(id:string,checked:boolean,result:MatchResult,source:FieldSelection['source']){setSelected(current=>{const next=new Map(current);
if(checked&&result.profilePath)next.set(id,{profilePath:result.profilePath,source});
else next.delete(id);
return next;
});
}
 async function fillSelectedFields(){if(!profile||!scanSessionId||!scannedTabId)return;
const requests=createFillRequests(effective,selected);
if(!requests.length){setStatus("没有已确认字段。");
return;
}setStatus("正在填写已确认字段…");
try{const response=await chrome.tabs.sendMessage(scannedTabId,{type:FILL_PAGE_MESSAGE,scanSessionId,requests,overwriteExistingValues:overwrite}) as FillPageResponse;
setFillResults(Object.fromEntries(response.results.map(result=>[result.fieldId,result])));
setFillStats(response.stats??null);
const filled=response.results.filter(item=>item.status==="filled").length;
const skipped=response.results.filter(item=>item.status==="skipped").length;
const failed=response.results.filter(item=>item.status==="failed").length;
setStatus(`填充完成：成功 ${filled}，跳过 ${skipped}，失败 ${failed}。请人工检查。`);
}catch{setStatus("填充请求失败，请重新扫描。");
}}
 async function undoLastFill(){if(!scanSessionId||!scannedTabId)return;
try{const response=await chrome.tabs.sendMessage(scannedTabId,{type:UNDO_PAGE_FILL_MESSAGE,scanSessionId}) as UndoPageFillResponse;
if(!response.ok){setStatus(fillReasonMessage(response.error));
return;
}setStatus(`撤销完成：恢复 ${response.results.filter(item=>item.status==="restored").length}。`);
setFillResults({});
}catch{setStatus("撤销失败，请重新扫描。");
}}
 return <main><h1>AI Job Application Assistant</h1><p>Rule Matcher 是默认主路径；AI 可选且不会提交表单。</p><label className="ai-toggle"><input type="checkbox" checked={aiSettings.enabled} onChange={event=>void toggleAI(event.target.checked)}/>启用 AI 语义识别（默认关闭）</label><button type="button" onClick={scanPage}>扫描当前页面</button><p role="status">{status}</p>
 {aiSettings.enabled&&fields.some((_,index)=>["ambiguous","unmatched"].includes(rules[index]?.status))&&<details className="privacy-preview"><summary>将发送给 AI 的字段信息（脱敏预览）</summary>{fields.map((field,index)=>["ambiguous","unmatched"].includes(rules[index]?.status)?<pre key={field.fieldId}>{JSON.stringify(sanitizeDescriptor(field),null,2)}</pre>:null)}<button type="button" disabled={aiRunning} onClick={()=>void runAI()}>{aiRunning?"处理中…":"确认并运行 AI fallback"}</button></details>}
 {fields.length>0&&<ul className="results">{fields.map((field,index)=>{const rule=rules[index];
const hybrid=hybrids.get(field.fieldId);
const result=effective[index];
const aiSuggested=hybrid?.source==="ai";
const reviewable=Boolean(profile)&&!aiSuggested&&isReviewable(rule,profile!);
const canFill=result?.status==="matched"||reviewable;
const path=aiSuggested?result.profilePath:suggestedProfilePath(rule);
const value=canFill&&profile&&path?resolveProfileValue(profile,path):undefined;
const chosen=selected.has(field.fieldId);
const source:FieldSelection['source']=aiSuggested?'ai_confirmed':reviewable?'rule_confirmed':'rule_matched';
const fill=fillResults[field.fieldId];
return <li key={field.fieldId}><label className="field-choice"><input type="checkbox" checked={chosen} disabled={!canFill} onChange={event=>toggleField(field.fieldId,event.target.checked,{...result,profilePath:path},source)}/><strong>{displayLabel(field)||field.kind}</strong>{aiSuggested&&<em className="ai-badge">AI 建议 · 需确认</em>}{reviewable&&<em className="review-badge">需要人工确认</em>}</label><span>Rule Matcher：{suggestedProfilePath(rule)||"未识别"} · {rule.status} {rule.confidence.toFixed(2)}</span>{reviewable&&<><span>建议匹配：{path}</span><span>置信度：{rule.confidence.toFixed(2)}</span><span>状态：需要人工确认</span><span>建议填写：{displayProfileValue(value)}</span><span>候选：{rule.candidatePaths.map((candidate,i)=>`${i+1}. ${candidate.profilePath} ${candidate.confidence.toFixed(2)}`).join('；')}</span>{hasCandidateConflict(rule)&&<span className="conflict-warning">候选冲突较大，请谨慎确认</span>}<span>我确认该网页字段对应“{displayLabel(field)||field.kind}”并允许填写</span></>}{hybrid?.aiResult&&<span>AI Fallback：{hybrid.aiResult.profilePath||"未识别"} · {hybrid.aiResult.status} {hybrid.aiResult.confidence.toFixed(2)}</span>}<span>Hybrid Result：{result.profilePath||"未识别"} · {result.status}</span><span>准备填写：{chosen?displayProfileValue(value):"—"}</span><details className="field-diagnostics"><summary>字段诊断</summary><span>Explicit Label: {field.context.labelTexts.join(" / ")||field.attributes.ariaLabel||field.context.ariaLabelledByTexts.join(" / ")||"—"}</span><span>Visual Label: {field.context.visualLabelTexts.join(" / ")||"—"}</span><span>Placeholder: {field.attributes.placeholder||"—"}</span><span>Nearby Text: {field.context.nearbyText.join(" / ")||"—"}</span><span>Section Context: {(field.context.sectionTexts??[]).join(" / ")||"—"}</span></details>{fill&&<span className={`fill-result ${fill.status}`}>填充：{fill.status}{fill.reason?` (${fillReasonMessage(fill.reason)})`:""}</span>}</li>;
})}</ul>}
 {(scanStats||matchStats||fillStats)&&<details className="performance"><summary>本地运行统计</summary>{scanStats&&<span>Scan: {scanStats.usableFieldCount}/{scanStats.scannedElementCount} · {scanStats.durationMs.toFixed(1)} ms</span>}{matchStats&&<span>Rule Match: {matchStats.matchedCount} matched · {matchStats.ambiguousCount} ambiguous · {matchStats.unmatchedCount} unmatched</span>}{fillStats&&<span>Fill: {fillStats.filledCount} filled · {fillStats.skippedCount} skipped · {fillStats.failedCount} failed</span>}</details>}
 {fields.length>0&&<label className="overwrite-option"><input type="checkbox" checked={overwrite} onChange={event=>setOverwrite(event.target.checked)}/>覆盖网页已有内容</label>}<button type="button" onClick={fillSelectedFields} disabled={!scanSessionId||selected.size===0}>填充已确认字段</button><button type="button" onClick={undoLastFill} disabled={!Object.values(fillResults).some(item=>item.status==="filled")}>撤销本次填充</button><button type="button" onClick={()=>void chrome.runtime.openOptionsPage()}>编辑个人资料</button><small>AI 建议默认不勾选；填写后请逐项检查并自行提交。</small></main>;

}
function displayLabel(field:FieldDescriptor):string{return field.context.legendText||field.context.labelTexts[0]||field.context.visualLabelTexts[0]||field.attributes.ariaLabel||field.attributes.placeholder||"";
}function displayProfileValue(value:unknown):string{if(Array.isArray(value))return value.join("、")||"—";
return value===undefined||value===null||value===""?"—":String(value);
}
