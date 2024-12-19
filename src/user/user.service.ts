import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

export type User = {
    id: number;
    username: string;
    email: string;
    passwordHash: string;
};

@Injectable()
export class UserService {
    private users: User[] = []; // DB Simulation

    async createUser(username: string, email: string, password: string): Promise<User> {
        // Hashing the password
        const passwordHash = await bcrypt.hash(password, 10);
        const user: User = {
            id: this.users.length + 1,
            username, 
            email,
            passwordHash
        };
        this.users.push(user);
        return user;
    }

    // Finds a user by email
    async findUserByEmail(email: string): Promise<User | undefined> {
        return this.users.find(user => user.email === email);
    }

    // Validates the user by looking email and comparing hash
    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.findUserByEmail(email);
        if (user && (await bcrypt.compare(password, user.passwordHash))){
            return user;
        }
        return null;
    }
}