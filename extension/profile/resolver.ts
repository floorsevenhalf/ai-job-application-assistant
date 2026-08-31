import type { UserProfile } from "./schema";
import type { ProfileFieldPath } from "./paths";

export function getPrimaryEducation(profile: UserProfile): UserProfile["educations"][number] | undefined {
  return profile.educations.find(education => education.isHighest) ?? profile.educations[0];
}

export function resolveProfileValue(profile: UserProfile, path: ProfileFieldPath): unknown {
  const primaryEducation = getPrimaryEducation(profile);
  const values: Record<ProfileFieldPath, unknown> = {
    "basic.fullName": profile.basic.fullName,
    "basic.gender": profile.basic.gender,
    "basic.phone": profile.basic.phone,
    "basic.email": profile.basic.email,
    "basic.birthDate": profile.basic.birthDate,
    "basic.city": profile.basic.city,
    "basic.region": profile.basic.region,
    "educations.primary.school": primaryEducation?.school,
    "educations.primary.college": primaryEducation?.college,
    "educations.primary.degree": primaryEducation?.degree,
    "educations.primary.major": primaryEducation?.major,
    "educations.primary.startDate": primaryEducation?.startDate,
    "educations.primary.endDate": primaryEducation?.endDate,
    "jobPreferences.directions": profile.jobPreferences.directions,
    "jobPreferences.preferredCities": profile.jobPreferences.preferredCities
  };
  return values[path];
}

export function hasProfileValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(item => String(item).trim().length > 0);
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}