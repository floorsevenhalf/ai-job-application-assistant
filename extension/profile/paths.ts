export const PROFILE_FIELD_PATHS = [
  "basic.fullName",
  "basic.gender",
  "basic.phone",
  "basic.email",
  "basic.birthDate",
  "basic.city",
  "basic.region",
  "educations.primary.school",
  "educations.primary.college",
  "educations.primary.degree",
  "educations.primary.major",
  "educations.primary.startDate",
  "educations.primary.endDate",
  "jobPreferences.directions",
  "jobPreferences.preferredCities"
] as const;

export type ProfileFieldPath = typeof PROFILE_FIELD_PATHS[number];