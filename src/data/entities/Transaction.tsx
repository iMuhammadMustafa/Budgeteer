import { Account } from "./Account";
import { BaseEntity } from "./BaseEntity";
import { Category } from "./Category";

type Transaction = BaseEntity & {
    Amount: number;
    Date: Date;
    CategoryId: string;
    Category: Category;
    Tags: string[];
    Notes?: string;
    
    AccountId: string;
    DestinationId: string;
    Account?: Account;
    Destination?: Account;
}

export { Transaction };