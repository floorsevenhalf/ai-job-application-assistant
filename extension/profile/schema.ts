import { z } from "zod";

const optionalText = z.string().trim();

export const educationSchema = z.object({
  id: z.string().min(1),
  school: optionalText,
  college: optionalText.default(""),
  degree: optionalText,
  major: optionalText,
  startDate: optionalText,
  endDate: optionalText,
  isHighest: z.boolean().default(true)
});

export const userProfileSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  profileName: z.string().min(1),
  basic: z.object({
    fullName: optionalText,
    gender: z.enum(["male", "female", "other", "prefer_not_to_say", ""]),
    phone: optionalText,
    email: z.union([z.literal(""), z.string().email("请输入有效邮箱")]),
    birthDate: optionalText,
    city: optionalText,
    region: optionalText.default("")
  }),
  educations: z.array(educationSchema).min(1),
  jobPreferences: z.object({
    directions: z.array(z.string().trim()).default([]),
    preferredCities: z.array(z.string().trim()).default([])
  }),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string()
  })
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export function createEmptyProfile(): UserProfile {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    profileName: "默认资料",
    basic: {
      fullName: "",
      gender: "",
      phone: "",
      email: "",
      birthDate: "",
      city: "",
      region: ""
    },
    educations: [{
      id: crypto.randomUUID(),
      school: "",
      college: "",
      degree: "",
      major: "",
      startDate: "",
      endDate: "",
      isHighest: true
    }],
    jobPreferences: { directions: [], preferredCities: [] },
    metadata: { createdAt: now, updatedAt: now }
  };
}
