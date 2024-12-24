import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

    async createUser(username: string, email: string, password: string): Promise<User> {
        // Hashing the password
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = this.userRepository.create ({
            username,
            email,
            password_hash: passwordHash
        });
        return this.userRepository.save(newUser);
    }

    // Finds a user by email
    async findUserByEmail(email: string): Promise<User | undefined> {
        return this.userRepository.findOne({ where: {email} });
    }

    // Finds user by id
    async findUserById(id: number): Promise<User | undefined> {
        return this.userRepository.findOne({ where: { id } });
    }

    // Validates the user by looking email and comparing hash
    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.findUserByEmail(email);
        if (user && (await bcrypt.compare(password, user.password_hash))){
            return user;
        }
        return null;
    }
}