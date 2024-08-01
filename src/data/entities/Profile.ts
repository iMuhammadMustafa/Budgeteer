import { BaseEntity } from "./BaseEntity";

type Profile = BaseEntity & {
    Name: string;
    Username: string;
    Email: string;
}