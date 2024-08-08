import { Profile } from "../data/entities";
import { createEntity, deleteEntity, getEntities, getEntity, updateEntity } from "./Helper.Service";

const PROFILE_ENDPOINT = 'profiles';

export async function createProfile(data: Profile): Promise<Profile> {
  return createEntity<Profile>(PROFILE_ENDPOINT, data);
}

export async function getProfile(id: string): Promise<Profile> {
  return getEntity<Profile>(PROFILE_ENDPOINT, id);
}

export async function getAllProfiles(): Promise<Profile[]> {
  return getEntities<Profile>(PROFILE_ENDPOINT);
}

export async function updateProfile(id: string, data: Partial<Profile>): Promise<Profile> {
  return updateEntity<Profile>(PROFILE_ENDPOINT, id, data);
}

export async function deleteProfile(id: string): Promise<void> {
  return deleteEntity(PROFILE_ENDPOINT, id);
}