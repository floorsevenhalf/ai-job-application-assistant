export interface AISettings { enabled:boolean; providerId:string; apiKey:string; }
export const DEFAULT_AI_SETTINGS:AISettings={enabled:false,providerId:"",apiKey:""};
const KEY="aiSettings";
export async function loadAISettings():Promise<AISettings>{if(typeof chrome==="undefined"||!chrome.storage?.local)return {...DEFAULT_AI_SETTINGS};const stored=await chrome.storage.local.get(KEY);const value=stored[KEY] as Partial<AISettings>|undefined;return {enabled:value?.enabled===true,providerId:typeof value?.providerId==="string"?value.providerId:"",apiKey:typeof value?.apiKey==="string"?value.apiKey:""};}
export async function saveAISettings(settings:AISettings):Promise<void>{if(typeof chrome==="undefined"||!chrome.storage?.local)throw new Error("Chrome local storage is unavailable.");await chrome.storage.local.set({[KEY]:settings});}
export async function clearAISettings():Promise<void>{if(typeof chrome!=="undefined"&&chrome.storage?.local)await chrome.storage.local.remove(KEY);}