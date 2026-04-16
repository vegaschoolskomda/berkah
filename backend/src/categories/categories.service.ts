import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string }) {
    const name = String(data?.name || '').trim();
    if (!name) throw new ConflictException('Nama kategori wajib diisi');

    const existing = await this.prisma.category.findUnique({ where: { name } });
    if (existing) throw new ConflictException('Category with this name already exists');
    return this.prisma.category.create({ data: { name } });
  }

  async findAll() {
    return this.prisma.category.findMany();
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(id: number, data: { name: string }) {
    await this.findOne(id);
    const name = String(data?.name || '').trim();
    if (!name) throw new ConflictException('Nama kategori wajib diisi');

    try {
      return await this.prisma.category.update({ where: { id }, data: { name } });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    try {
      return await this.prisma.category.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2003') {
        throw new ConflictException('Kategori tidak bisa dihapus karena masih dipakai produk');
      }
      throw e;
    }
  }
}
