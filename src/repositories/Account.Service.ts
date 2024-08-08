import { Account, UserAccount } from "../data/entities";
import { createEntity, deleteEntity, getEntities, getEntity, updateEntity } from "./Helper.Service";


const ACCOUNT_ENDPOINT = 'accounts';


export async function createAccount(data: Account): Promise<Account> {
  return createEntity<Account>(ACCOUNT_ENDPOINT, data);
}

export async function getAccount(id: string): Promise<Account> {
  return getEntity<Account>(ACCOUNT_ENDPOINT, id);
}

export async function getAllAccounts(): Promise<Account[]> {
  return getEntities<Account>(ACCOUNT_ENDPOINT);
}

export async function updateAccount(id: string, data: Partial<Account>): Promise<Account> {
  return updateEntity<Account>(ACCOUNT_ENDPOINT, id, data);
}

export async function deleteAccount(id: string): Promise<void> {
  return deleteEntity(ACCOUNT_ENDPOINT, id);
}

const USER_ACCOUNT_ENDPOINT = 'userAccounts';

export async function createUserAccount(data: UserAccount): Promise<UserAccount> {
  return createEntity<UserAccount>(USER_ACCOUNT_ENDPOINT, data);
}

export async function getUserAccount(id: string): Promise<UserAccount> {
  return getEntity<UserAccount>(USER_ACCOUNT_ENDPOINT, id);
}

export async function getAllUserAccounts(): Promise<UserAccount[]> {
  return getEntities<UserAccount>(USER_ACCOUNT_ENDPOINT);
}

export async function updateUserAccount(id: string, data: Partial<UserAccount>): Promise<UserAccount> {
  return updateEntity<UserAccount>(USER_ACCOUNT_ENDPOINT, id, data);
}

export async function deleteUserAccount(id: string): Promise<void> {
  return deleteEntity(USER_ACCOUNT_ENDPOINT, id);
}