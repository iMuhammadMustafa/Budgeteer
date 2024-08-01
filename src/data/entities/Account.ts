import { User } from "../models/User";
import { BaseEntity } from "./BaseEntity";

type Account = BaseEntity & {
    Name: string;
    Category: string;
    Type: string;
    OpenBalance: number;
    CurrentBalance: number;
    Currency: string;
    Notes?: string;

    OnwerId: string;
    Owner?: User;
    Users?: UserAccount[];
}


type UserAccount = BaseEntity & {
    UserId: string;
    AccountId: string;
    User?: User;
    Account?: Account;
    AccessType: string;
}

export { Account, UserAccount };