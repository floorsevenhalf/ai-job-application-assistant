import type { SemanticMatchInput } from "./types";
const SENSITIVE_VALUE=/\b1[3-9]\d{9}\b|\b\d{17}[\dXx]\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu;
const FORBIDDEN_KEYS=new Set(["profile","profileValue","fullName","phone","email","school","address","userProfile","currentValue"]);
export function assertNoSensitiveProfileValues(input:SemanticMatchInput):void{
  const walk=(value:unknown,key?:string):void=>{if(key&&FORBIDDEN_KEYS.has(key))throw new Error(`forbidden_semantic_input_key:${key}`);if(typeof value==="string"&&SENSITIVE_VALUE.test(value))throw new Error("sensitive_value_in_semantic_input");if(Array.isArray(value))value.forEach(item=>walk(item));else if(value&&typeof value==="object")Object.entries(value).forEach(([childKey,child])=>walk(child,childKey));};
  walk(input);
}