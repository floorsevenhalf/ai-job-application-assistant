import { describe, expect, it } from "vitest";
import { loadCompatibilitySamples } from "../../extension/core/evaluation/fixtures";
import { ABLATIONS, evaluateSamples } from "../../extension/core/evaluation/runner";
import { sanitizeDescriptor } from "../../extension/core/evaluation/sanitize";
import type { EvidenceSource } from "../../extension/core/matcher/types";

const samples=loadCompatibilitySamples();
const report=evaluateSamples(samples);
describe("compatibility evaluation",()=>{
  it("loads 38 anonymized cases from eight minimized fixtures",()=>{expect(samples).toHaveLength(38);expect(new Set(samples.map(item=>item.caseId)).size).toBe(38);});
  it("computes scanner recall from detected descriptors",()=>{expect(report.metrics.detectedFields).toBe(35);expect(report.metrics.scannerDetectionRecall).toBeCloseTo(35/38);});
  it("computes precision, recall and F1 from predictions",()=>{expect(report.metrics.precision).toBe(1);expect(report.metrics.recall).toBeCloseTo(23/33);expect(report.metrics.f1).toBeCloseTo(0.8214285714);});
  it("keeps production false positives at zero on the compatibility set",()=>{expect(report.wrongMatches).toHaveLength(0);expect(report.metrics.wrongMatchRate).toBe(0);});
  it("uses every configured confidence bucket exactly once",()=>{expect(report.confidenceBuckets).toHaveLength(6);expect(report.confidenceBuckets.reduce((sum,item)=>sum+item.count,0)).toBe(35);});
  it("classifies unsupported reconstructed controls",()=>{expect(report.failureCounts.custom_select_unsupported).toBe(1);expect(report.failureCounts.cascade_selector_unsupported).toBe(1);expect(report.failureCounts.contenteditable).toBe(1);});
  it("creates fallback cases only for expected ambiguous or unmatched fields",()=>{expect(report.fallbackCases).toHaveLength(7);expect(report.fallbackCases.every(item=>item.expectedPath&&item.descriptor)).toBe(true);});
  it("sanitizes sensitive-looking descriptor text",()=>{const descriptor=structuredClone(samples.find(item=>item.descriptor)!.descriptor!);descriptor.attributes.placeholder=["person","private.invalid"].join("@")+" "+["139","1234","5678"].join("");expect(sanitizeDescriptor(descriptor).placeholder).toBe("[REDACTED] [REDACTED]");});
  it("extracts only the nearest explicit section heading",()=>{const education=samples.find(item=>item.caseId==="STEP-001")!.descriptor!;const internship=samples.find(item=>item.caseId==="STEP-003")!.descriptor!;expect(education.context.sectionTexts).toEqual(["教育经历"]);expect(internship.context.sectionTexts).toEqual(["实习经历"]);});
  it("section negative veto removes a date false positive without reducing recall",()=>{const sources=new Set<EvidenceSource>(["label","aria-label","placeholder","legend","name","id","parent-text","nearby-text","input-type","options"]);const without=evaluateSamples(samples,{enabledSources:sources});expect(without.metrics.wrongMatches).toBe(1);expect(report.metrics.wrongMatches).toBe(0);expect(report.metrics.recall).toBe(without.metrics.recall);});
  it("runs all six ablation variants",()=>{const results=ABLATIONS.map(item=>evaluateSamples(samples,item.config));expect(results).toHaveLength(6);expect(results[4].metrics.precision).toBeGreaterThan(results[3].metrics.precision);});
  it("supports all 24 threshold and margin combinations without mutating defaults",()=>{const outputs=[];for(const matchedThreshold of [.70,.75,.80,.85,.90,.95])for(const minimumGap of [.05,.10,.15,.20])outputs.push(evaluateSamples(samples,{matchedThreshold,minimumGap}));expect(outputs).toHaveLength(24);expect(outputs.every(item=>item.metrics.precision>=0&&item.metrics.precision<=1)).toBe(true);expect(evaluateSamples(samples).metrics).toEqual(report.metrics);});
  it("produces fully serializable reports without profile values",()=>{const json=JSON.stringify(report);expect(()=>JSON.parse(json)).not.toThrow();expect(json).not.toContain("profileValue");});
});