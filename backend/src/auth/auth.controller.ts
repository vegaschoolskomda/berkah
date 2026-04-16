import { Controller, Post, Get, Body, HttpCode, HttpStatus, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    const login = String(signInDto.username || signInDto.email || signInDto.login || '').trim();
    const password = String(signInDto.password || '');

    if (!login || !password) {
      throw new UnauthorizedException('Username/email dan password wajib diisi');
    }

    const user = await this.authService.validateUser(login, password);
    if (!user) {
      throw new UnauthorizedException('Username/email atau password salah');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() signUpDto: Record<string, any>) {
    return this.authService.register(signUpDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }
}
