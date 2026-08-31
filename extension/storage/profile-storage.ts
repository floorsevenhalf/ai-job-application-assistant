import { createEmptyProfile, userProfileSchema, type UserProfile } from "../profile/schema";

const PROFILE_STORAGE_KEY = "userProfile";

function ensureStorageAvailable(): void {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    throw new Error("Chrome local storage is unavailable.");
  }
}

export async function loadProfile(): Promise<UserProfile> {
  ensureStorageAvailable();
  const stored = await chrome.storage.local.get(PROFILE_STORAGE_KEY);
  const parsed = userProfileSchema.safeParse(stored[PROFILE_STORAGE_KEY]);
  return parsed.success ? parsed.data : createEmptyProfile();
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  ensureStorageAvailable();
  const validated = userProfileSchema.parse({
    ...profile,
    metadata: { ...profile.metadata, updatedAt: new Date().toISOString() }
  });
  await chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: validated });
  return validated;
}
