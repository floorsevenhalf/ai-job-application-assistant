import { z } from 'zod';
const text=z.string().trim(), optionalText=text.optional(), id=z.string().min(1);
export const educationSchema=z.object({id,school:text,college:text.default(''),degree:text,major:text,startDate:text,endDate:text,isHighest:z.boolean().default(false)});
export const internshipSchema=z.object({id,company:text,department:optionalText,position:text,startDate:text,endDate:optionalText,city:optionalText,description:optionalText});
export const projectSchema=z.object({id,name:text,role:optionalText,startDate:optionalText,endDate:optionalText,description:optionalText});
export const languageSchema=z.object({id,language:text,proficiency:optionalText,certificate:optionalText,score:optionalText});
export const familyMemberSchema=z.object({id,relationship:text,name:text,birthDate:optionalText,employer:optionalText,position:optionalText,phone:optionalText});
export const skillSchema=z.object({id,name:text,level:optionalText});
export const certificateSchema=z.object({id,name:text,issuer:optionalText,date:optionalText});
const basicSchema=z.object({fullName:text,gender:z.enum(['male','female','other','prefer_not_to_say','']),phone:text,email:z.union([z.literal(''),z.string().email('请输入有效邮箱')]),birthDate:text,city:text,region:text.default('')});
const preferencesSchema=z.object({directions:z.array(text).default([]),preferredCities:z.array(text).default([])});
const metadataSchema=z.object({createdAt:z.string(),updatedAt:z.string()});
export const userProfileV1Schema=z.object({schemaVersion:z.literal(1),id,profileName:id,basic:basicSchema,educations:z.array(educationSchema).min(1),jobPreferences:preferencesSchema,metadata:metadataSchema});
export const userProfileSchema=z.object({schemaVersion:z.literal(2),id,profileName:id,basic:basicSchema,educations:z.array(educationSchema).min(1),internships:z.array(internshipSchema).default([]),projects:z.array(projectSchema).default([]),languages:z.array(languageSchema).default([]),familyMembers:z.array(familyMemberSchema).default([]),jobPreferences:preferencesSchema,skills:z.array(skillSchema).optional(),certificates:z.array(certificateSchema).optional(),metadata:metadataSchema}).superRefine((profile,context)=>{if(profile.educations.filter(item=>item.isHighest).length>1)context.addIssue({code:z.ZodIssueCode.custom,path:['educations'],message:'最高学历只能有一条'});});
export type EducationExperience=z.infer<typeof educationSchema>;
export type InternshipExperience=z.infer<typeof internshipSchema>;
export type ProjectExperience=z.infer<typeof projectSchema>;
export type LanguageAbility=z.infer<typeof languageSchema>;
export type FamilyMember=z.infer<typeof familyMemberSchema>;
export type Skill=z.infer<typeof skillSchema>;
export type Certificate=z.infer<typeof certificateSchema>;
export type UserProfile=z.infer<typeof userProfileSchema>;
export type UserProfileV1=z.infer<typeof userProfileV1Schema>;
export function newProfileItemId(prefix:string):string{return `${prefix}-${crypto.randomUUID()}`;}
export function createEmptyEducation():EducationExperience{return{id:newProfileItemId('education'),school:'',college:'',degree:'',major:'',startDate:'',endDate:'',isHighest:false};}
export function normalizeHighestEducation(items:EducationExperience[]):EducationExperience[]{let found=false;return items.map(item=>{const isHighest=item.isHighest&&!found;if(isHighest)found=true;return{...item,isHighest};});}
export function migrateProfile(value:unknown):UserProfile{const current=userProfileSchema.safeParse(value);if(current.success)return current.data;const legacy=userProfileV1Schema.parse(value);return userProfileSchema.parse({...legacy,schemaVersion:2,educations:normalizeHighestEducation(legacy.educations),internships:[],projects:[],languages:[],familyMembers:[]});}
export function createEmptyProfile():UserProfile{const now=new Date().toISOString();return{schemaVersion:2,id:crypto.randomUUID(),profileName:'默认资料',basic:{fullName:'',gender:'',phone:'',email:'',birthDate:'',city:'',region:''},educations:[{...createEmptyEducation(),isHighest:true}],internships:[],projects:[],languages:[],familyMembers:[],jobPreferences:{directions:[],preferredCities:[]},metadata:{createdAt:now,updatedAt:now}};}
