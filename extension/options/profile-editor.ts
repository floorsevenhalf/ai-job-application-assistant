import { createEmptyEducation, newProfileItemId, type EducationExperience, type FamilyMember, type InternshipExperience, type LanguageAbility, type ProjectExperience, type UserProfile } from '../profile/schema';
export type CollectionKey='educations'|'internships'|'projects'|'languages'|'familyMembers';
export function addEducation(profile:UserProfile):UserProfile{return{...profile,educations:[...profile.educations,createEmptyEducation()]};}
export function removeEducation(profile:UserProfile,id:string):UserProfile{const remaining=profile.educations.filter(item=>item.id!==id);return{...profile,educations:remaining.length?remaining:[createEmptyEducation()]};}
export function setHighestEducation(profile:UserProfile,id:string):UserProfile{return{...profile,educations:profile.educations.map(item=>({...item,isHighest:item.id===id}))};}
export function addInternship(profile:UserProfile):UserProfile{const item:InternshipExperience={id:newProfileItemId('internship'),company:'',position:'',startDate:''};return{...profile,internships:[...profile.internships,item]};}
export function addProject(profile:UserProfile):UserProfile{const item:ProjectExperience={id:newProfileItemId('project'),name:''};return{...profile,projects:[...profile.projects,item]};}
export function addLanguage(profile:UserProfile):UserProfile{const item:LanguageAbility={id:newProfileItemId('language'),language:''};return{...profile,languages:[...profile.languages,item]};}
export function addFamilyMember(profile:UserProfile):UserProfile{const item:FamilyMember={id:newProfileItemId('family'),relationship:'',name:''};return{...profile,familyMembers:[...profile.familyMembers,item]};}
export function removeCollectionItem(profile:UserProfile,key:Exclude<CollectionKey,'educations'>,id:string):UserProfile{return{...profile,[key]:profile[key].filter(item=>item.id!==id)};}
export function updateEducation(profile:UserProfile,id:string,patch:Partial<EducationExperience>):UserProfile{return{...profile,educations:profile.educations.map(item=>item.id===id?{...item,...patch}:item)};}
