import { migrateProfile, userProfileSchema, type UserProfile } from './schema';
export function importProfileJson(source:string):UserProfile{let value:unknown;try{value=JSON.parse(source);}catch{throw new Error('JSON 格式无效，请检查逗号、引号和括号。');}try{return migrateProfile(value);}catch{throw new Error('Profile 数据结构无效，无法导入。');}}
export function exportProfileJson(profile:UserProfile):string{return JSON.stringify(userProfileSchema.parse(profile),null,2);}
