import { Controller, Post, Get, Body, Request, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { CreateUserDto } from 'src/user/create-user.dto';
import { LoginUserDto } from 'src/user/login-user.dto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
  }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;
    return this.authService.createUser(username, email, password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    const { email, password, staySignedIn } = loginUserDto;

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials"); 
    }

    return this.authService.login({ id: user.id, email: user.email }, staySignedIn);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-data')
  async getUserData(@Request() req) {
    const userId = req.user.userId;
    if (!userId) {
      throw new BadRequestException('Authentication failed');
    }
    return this.authService.getUserData(userId);
  }
}
