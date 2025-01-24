import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import { SolBalanceService } from 'src/balance/sol_balance.service';
import { StatService } from 'src/stats/stats.service';
export declare class AuthService {
    private userService;
    private jwtService;
    private solBalanceService;
    private statService;
    constructor(userService: UserService, jwtService: JwtService, solBalanceService: SolBalanceService, statService: StatService);
    validateUser(email: string, password: string): Promise<Omit<User, 'password_hash'> | null>;
    login(user: {
        id: number;
        email: string;
    }, staySignedIn: boolean): Promise<{
        access_token: string;
    }>;
    createUser(username: string, email: string, password: string): Promise<{
        id: number;
        username: string;
        email: string;
        created_at: Date;
    }>;
    getUserData(userId: number): Promise<{
        username: string;
        email: string;
        createdAt: Date;
    }>;
}
