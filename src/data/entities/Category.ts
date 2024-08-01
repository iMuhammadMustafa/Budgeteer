import { BaseEntity } from "./BaseEntity";

type Category = BaseEntity & {
    Name: string;
    Type: string;
    Description?: string;
}

export { Category };