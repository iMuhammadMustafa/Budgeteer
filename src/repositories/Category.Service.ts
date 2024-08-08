import { Category } from "../data/entities";
import { createEntity, deleteEntity, getEntities, getEntity, updateEntity } from "./Helper.Service";

const CATEGORY_ENDPOINT = 'categories';

export async function createCategory(data: Category): Promise<Category> {
  return createEntity<Category>(CATEGORY_ENDPOINT, data);
}

export async function getCategory(id: string): Promise<Category> {
  return getEntity<Category>(CATEGORY_ENDPOINT, id);
}

export async function getAllCategories(): Promise<Category[]> {
  return getEntities<Category>(CATEGORY_ENDPOINT);
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  return updateEntity<Category>(CATEGORY_ENDPOINT, id, data);
}

export async function deleteCategory(id: string): Promise<void> {
  return deleteEntity(CATEGORY_ENDPOINT, id);
}