import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AI_SETTINGS, loadAISettings, saveAISettings } from "../../extension/storage/ai-settings";

describe("AI settings storage",()=>{
 afterEach(()=>vi.unstubAllGlobals());
 it("saves and loads OpenAI-compatible settings only in chrome.storage.local",async()=>{let stored:Record<string,unknown>={};const set=vi.fn(async(value:Record<string,unknown>)=>{stored={...stored,...value};});vi.stubGlobal("chrome",{storage:{local:{get:vi.fn(async()=>stored),set,remove:vi.fn()}}});const settings={enabled:true,providerId:"openai-compatible",apiKey:"local-test-key",baseUrl:"https://provider.invalid/v1",model:"model-id",timeoutMs:9000};await saveAISettings(settings);expect(await loadAISettings()).toEqual(settings);expect(set).toHaveBeenCalledOnce();});
 it("migrates older settings with safe defaults",async()=>{vi.stubGlobal("chrome",{storage:{local:{get:vi.fn(async()=>({aiSettings:{enabled:true,providerId:"openai-compatible",apiKey:"key"}}))}}});expect(await loadAISettings()).toEqual({...DEFAULT_AI_SETTINGS,enabled:true,apiKey:"key"});});
});