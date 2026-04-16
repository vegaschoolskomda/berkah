import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: any) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        phone: createUserDto.phone,
        passwordHash,
        roleId: createUserDto.roleId ? parseInt(createUserDto.roleId.toString()) : null,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findByLogin(login: string) {
    const normalizedLogin = String(login || '').trim();
    const candidateLogins = Array.from(new Set([
      normalizedLogin,
      normalizedLogin.toLowerCase(),
    ].filter(Boolean)));

    return this.prisma.user.findFirst({
      where: {
        OR: candidateLogins.flatMap((candidate) => [
          { email: candidate },
          { name: candidate },
        ]),
      },
      include: { role: true },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: { select: { id: true, name: true } } },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roleId: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async fetchRoles() {
    return this.prisma.role.findMany({
      orderBy: { id: 'asc' }
    });
  }

  async updateUser(id: number, data: { name?: string, email?: string, roleId?: number, phone?: string, password?: string }) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.roleId !== undefined) updateData.roleId = data.roleId || null;

    if (data.password) {
      const salt = await bcrypt.genSalt();
      updateData.passwordHash = await bcrypt.hash(data.password, salt);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Tidak ada data yang diubah');
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, phone: true, role: true }
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Username/email sudah dipakai akun lain');
      }
      throw e;
    }
  }

  async updateOwnProfile(id: number, data: { name?: string, email?: string, password?: string }) {
    return this.updateUser(id, {
      name: data.name,
      email: data.email,
      password: data.password,
    });
  }

  async isManagerRole(roleId: number | null): Promise<boolean> {
    if (!roleId) return false;
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return false;
    const n = role.name.toLowerCase();
    return (
      n === 'admin' ||
      n === 'owner' ||
      n === 'pemilik' ||
      n.includes('manajer') ||
      n.includes('manager') ||
      n.includes('supervisor') ||
      n.includes('kepala')
    );
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  async createRole(name: string) {
    return this.prisma.role.create({
      data: { name }
    });
  }

  async updateRole(id: number, name: string) {
    return this.prisma.role.update({
      where: { id },
      data: { name }
    });
  }

  async deleteRole(id: number) {
    return this.prisma.role.delete({
      where: { id }
    });
  }
}
