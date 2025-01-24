import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/create-user.dto';
import { LoginUserDto } from 'src/user/login-user.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signup(createUserDto: CreateUserDto): Promise<{
        id: number;
        username: string;
        email: string;
        created_at: Date;
    }>;
    login(loginUserDto: LoginUserDto): Promise<{
        access_token: string;
    }>;
    getUserData(req: any): Promise<{
        username: string;
        email: string;
        createdAt: Date;
    }>;
}
