import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  private async ensureManager(req: any) {
    const roleId = Number(req?.user?.role || 0) || null;
    const isManager = await this.usersService.isManagerRole(roleId);
    if (!isManager) {
      throw new ForbiddenException('Akses ditolak. Hanya manager/admin/owner yang diizinkan.');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() createUserDto: CreateUserDto) {
    await this.ensureManager(req);
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: any) {
    await this.ensureManager(req);
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('roles')
  async getRoles(@Request() req: any) {
    await this.ensureManager(req);
    return this.usersService.fetchRoles();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateOwnProfile(
    @Request() req: any,
    @Body() data: { name?: string, email?: string, password?: string }
  ) {
    return this.usersService.updateOwnProfile(req.user.userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(@Request() req: any, @Param('id') id: string, @Body() data: { name?: string, email?: string, roleId?: number, phone?: string, password?: string }) {
    const targetUserId = +id;
    const currentUserId = Number(req?.user?.userId || 0);
    const roleId = Number(req?.user?.role || 0) || null;
    const isManager = await this.usersService.isManagerRole(roleId);

    if (!isManager && currentUserId !== targetUserId) {
      throw new ForbiddenException('Karyawan hanya bisa mengubah profilnya sendiri.');
    }

    if (!isManager) {
      return this.usersService.updateOwnProfile(currentUserId, {
        name: data.name,
        email: data.email,
        password: data.password,
      });
    }

    return this.usersService.updateUser(targetUserId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    await this.ensureManager(req);
    return this.usersService.deleteUser(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('roles')
  async createRole(@Request() req: any, @Body() data: { name: string }) {
    await this.ensureManager(req);
    return this.usersService.createRole(data.name);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('roles/:id')
  async updateRole(@Request() req: any, @Param('id') id: string, @Body() data: { name: string }) {
    await this.ensureManager(req);
    return this.usersService.updateRole(+id, data.name);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('roles/:id')
  async deleteRole(@Request() req: any, @Param('id') id: string) {
    await this.ensureManager(req);
    return this.usersService.deleteRole(+id);
  }
}
