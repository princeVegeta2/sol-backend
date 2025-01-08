import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity'; // Ensure you import your User entity
import { SolBalanceService } from 'src/balance/sol_balance.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private solBalanceService: SolBalanceService,
  ) {}

  /**
   * Validate user credentials
   * @param email - User's email
   * @param password - User's password
   * @returns A user object without sensitive information, or throws an exception
   */
  async validateUser(email: string, password: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.userService.validateUser(email, password);
    if (user) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Generate a JWT token for the user
   * @param user - User object
   * @returns An object containing the JWT token
   */
  async login(user: { id: number; email: string; }, staySignedIn: boolean) {
    const payload = { sub: user.id, email: user.email }; // 'sub' is short for 'subject' (user ID)
    const options = {
      expiresIn: staySignedIn ? '30d' : '24h',
    };
    return {
      access_token: this.jwtService.sign(payload, options),
    };
  }

  /**
   * Create a new user
   * @param username - User's username
   * @param email - User's email
   * @param password - User's password
   * @returns The created user object
   */
  async createUser(username: string, email: string, password: string) {
    const newUser = await this.userService.createUser(username, email, password);
    await this.solBalanceService.createBalance({
      user: newUser,
      balance: 0,
      balance_usd: 0,
      total_redeemed: 0,
      total_usd_redeemed: 0,
      one_redeemable: true,
      five_redeemable: true,
      last_one_redeemed_at: null,
      last_five_redeemed_at: null,
    });

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      created_at: newUser.created_at,
    }; // Return only non-sensitive fields
  }
}
