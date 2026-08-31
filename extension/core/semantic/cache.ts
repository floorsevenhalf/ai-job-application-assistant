import type { SemanticMatchInput, SemanticMatchResult } from "./types";
export function semanticCacheKey(input:SemanticMatchInput):string{
  const value=JSON.stringify(input.field,Object.keys(input.field).sort());let hash=2166136261;
  for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619);}
  return `semantic-v1-${(hash>>>0).toString(16)}`;
}
export class SemanticMatchCache {
  private readonly values=new Map<string,SemanticMatchResult>();
  constructor(private readonly maxEntries=100){}
  get(key:string):SemanticMatchResult|undefined{return this.values.get(key);}
  set(key:string,value:SemanticMatchResult):void{if(this.values.size>=this.maxEntries)this.values.delete(this.values.keys().next().value!);this.values.set(key,value);}
  clear():void{this.values.clear();}
  get size():number{return this.values.size;}
}