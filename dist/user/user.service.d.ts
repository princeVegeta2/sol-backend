import { Repository } from "typeorm";
import { User } from "./user.entity";
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    createUser(username: string, email: string, password: string): Promise<User>;
    findUserByEmail(email: string): Promise<User | undefined>;
    userEmailExists(email: string): Promise<boolean>;
    userUsernameExists(username: string): Promise<boolean>;
    findUserById(id: number): Promise<User | undefined>;
    validateUser(email: string, password: string): Promise<User | null>;
    findAllUsers(): Promise<User[]>;
}
