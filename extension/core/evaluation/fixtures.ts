import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { scanDocument } from "../scanner/scan-form";
import type { ProfileFieldPath } from "../../profile/paths";
import type { DescriptorQuality, EvaluationSample, FailureCategory, PageType, SiteCategory } from "./types";

const FIXTURES: Array<{file:string;siteCategory:SiteCategory;pageType:PageType}> = [
  {file:"chinese-basic-info.html",siteCategory:"campus-recruitment",pageType:"basic-info"},
  {file:"english-basic-info.html",siteCategory:"ats",pageType:"basic-info"},
  {file:"education-section.html",siteCategory:"company-career",pageType:"education"},
  {file:"weak-label-form.html",siteCategory:"generic-form",pageType:"basic-info"},
  {file:"ambiguous-form.html",siteCategory:"ats",pageType:"mixed"},
  {file:"duplicate-name-form.html",siteCategory:"company-career",pageType:"mixed"},
  {file:"multi-step-visible-section.html",siteCategory:"campus-recruitment",pageType:"multi-step"},
  {file:"custom-select-placeholder.html",siteCategory:"generic-form",pageType:"mixed"}
];
const DOM_GLOBALS=["Node","Element","HTMLElement","HTMLInputElement","HTMLTextAreaElement","HTMLSelectElement","HTMLFormElement","HTMLLabelElement"] as const;
export function loadCompatibilitySamples(base=resolve(process.cwd(),"tests/fixtures/compatibility")):EvaluationSample[]{
  const samples:EvaluationSample[]=[];
  for(const meta of FIXTURES){
    const dom=new JSDOM(readFileSync(resolve(base,meta.file),"utf8"),{url:"https://fixture.invalid/"});
    const previous=new Map<string,PropertyDescriptor|undefined>();
    for(const key of DOM_GLOBALS){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});}
    try{
      const scan=scanDocument(dom.window.document);
      const descriptors=new Map<string,typeof scan.fields[number]>();
      scan.elementMap.forEach((element,fieldId)=>{const caseId=element.dataset.caseId;if(caseId){const descriptor=scan.fields.find(field=>field.fieldId===fieldId);if(descriptor)descriptors.set(caseId,descriptor);}});
      const seen=new Set<string>();
      dom.window.document.querySelectorAll<HTMLElement>("[data-case-id]").forEach(element=>{
        const caseId=element.dataset.caseId!; if(seen.has(caseId))return; seen.add(caseId);
        const descriptor=descriptors.get(caseId); const expected=element.dataset.expectedPath as ProfileFieldPath|undefined;
        samples.push({caseId,siteCategory:meta.siteCategory,pageType:meta.pageType,fieldType:element.dataset.fieldType??descriptor?.kind??element.tagName.toLowerCase(),expectedProfilePath:expected,descriptor,descriptorQuality:(element.dataset.quality as DescriptorQuality|undefined)??(descriptor?"good":undefined),unsupportedFailure:element.dataset.failure as FailureCategory|undefined,autofill:element.dataset.autofill==="success"?{attempted:true,success:true}:{attempted:false},notes:`Synthetic minimized fixture: ${meta.file}`});
      });
    } finally {
      for(const key of DOM_GLOBALS){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as Record<string,unknown>)[key];}
      dom.window.close();
    }
  }
  return samples;
}