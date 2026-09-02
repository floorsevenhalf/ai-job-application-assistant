import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportProfileJson, importProfileJson } from '../../extension/profile/profile-json';
import { createEmptyProfile, migrateProfile, userProfileSchema } from '../../extension/profile/schema';
import { addEducation, addFamilyMember, addInternship, addLanguage, addProject, removeCollectionItem, removeEducation, setHighestEducation, updateEducation } from '../../extension/options/profile-editor';
import { loadProfile, saveProfile } from '../../extension/storage/profile-storage';

const v1={schemaVersion:1,id:'legacy',profileName:'旧资料',basic:{fullName:'虚构姓名',gender:'',phone:'',email:'',birthDate:'',city:'',region:''},educations:[{id:'edu-1',school:'虚构大学',college:'',degree:'本科',major:'',startDate:'2020-09',endDate:'2024-06',isHighest:true}],jobPreferences:{directions:['开发'],preferredCities:['示例市']},metadata:{createdAt:'2020',updatedAt:'2021'}};
describe('Profile schema v2',()=>{
 afterEach(()=>vi.unstubAllGlobals());
 it('migrates v1 while preserving existing data',()=>{const value=migrateProfile(v1);expect(value).toMatchObject({schemaVersion:2,id:'legacy',basic:v1.basic,educations:v1.educations,jobPreferences:v1.jobPreferences,metadata:v1.metadata});});
 it('defaults every new collection to an empty array',()=>{const value=migrateProfile(v1);expect([value.internships,value.projects,value.languages,value.familyMembers]).toEqual([[],[],[],[]]);});
 it('saves and reads multiple education records',async()=>{let stored:Record<string,unknown>={};vi.stubGlobal('chrome',{storage:{local:{get:vi.fn(async()=>stored),set:vi.fn(async value=>{stored={...stored,...value};})}}});let profile=createEmptyProfile();profile=addEducation(profile);profile=updateEducation(profile,profile.educations[1].id,{school:'第二所虚构大学'});await saveProfile(profile);expect((await loadProfile()).educations.map(item=>item.school)).toEqual(['','第二所虚构大学']);});
 it('keeps isHighest unique',()=>{let profile=addEducation(createEmptyProfile());profile=setHighestEducation(profile,profile.educations[1].id);expect(profile.educations.map(item=>item.isHighest)).toEqual([false,true]);expect(()=>userProfileSchema.parse({...profile,educations:profile.educations.map(item=>({...item,isHighest:true}))})).toThrow('最高学历只能有一条');});
 it('adds and removes education while retaining one editable record',()=>{const original=createEmptyProfile();const added=addEducation(original);expect(added.educations).toHaveLength(2);expect(removeEducation(removeEducation(added,added.educations[0].id),added.educations[1].id).educations).toHaveLength(1);});
 it('adds and removes an internship',()=>{const added=addInternship(createEmptyProfile());expect(removeCollectionItem(added,'internships',added.internships[0].id).internships).toEqual([]);});
 it('adds and removes a project',()=>{const added=addProject(createEmptyProfile());expect(removeCollectionItem(added,'projects',added.projects[0].id).projects).toEqual([]);});
 it('adds and removes a language ability',()=>{const added=addLanguage(createEmptyProfile());expect(removeCollectionItem(added,'languages',added.languages[0].id).languages).toEqual([]);});
 it('adds and removes a family member',()=>{const added=addFamilyMember(createEmptyProfile());expect(removeCollectionItem(added,'familyMembers',added.familyMembers[0].id).familyMembers).toEqual([]);});
 it('imports v1 JSON through migration',()=>expect(importProfileJson(JSON.stringify(v1)).schemaVersion).toBe(2));
 it('exports only the latest schema',()=>{const json=JSON.parse(exportProfileJson(createEmptyProfile()));expect(json.schemaVersion).toBe(2);expect(json).toHaveProperty('familyMembers');});
 it('returns clear errors for malformed and invalid JSON',()=>{expect(()=>importProfileJson('{')).toThrow('JSON 格式无效');expect(()=>importProfileJson('{}')).toThrow('Profile 数据结构无效');});
 it('does not write profile values to logs',()=>{const spy=vi.spyOn(console,'log').mockImplementation(()=>{});const secret='PRIVATE_PROFILE_VALUE';importProfileJson(exportProfileJson({...createEmptyProfile(),basic:{...createEmptyProfile().basic,fullName:secret}}));expect(spy.mock.calls.flat().join(' ')).not.toContain(secret);spy.mockRestore();});
});
