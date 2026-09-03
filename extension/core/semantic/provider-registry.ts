import type { AIProvider } from "./types";
import { loadAISettings } from "../../storage/ai-settings";
import { OpenAICompatibleProvider } from "./openai-compatible-provider";
export class AIProviderRegistry {
  private readonly providers=new Map<string,AIProvider>();
  register(provider:AIProvider):void{if(this.providers.has(provider.id))throw new Error(`duplicate_ai_provider:${provider.id}`);this.providers.set(provider.id,provider);}
  unregister(id:string):void{this.providers.delete(id);}
  get(id:string):AIProvider|undefined{return this.providers.get(id);}
  list():string[]{return [...this.providers.keys()];}
}
export const aiProviderRegistry=new AIProviderRegistry();
aiProviderRegistry.register(new OpenAICompatibleProvider(async()=>loadAISettings()));