import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { name: string }) {
        const name = String(data?.name || '').trim();
        if (!name) throw new ConflictException('Nama unit wajib diisi');

        const existing = await this.prisma.unit.findUnique({ where: { name } });
        if (existing) throw new ConflictException('Unit with this name already exists');
        return this.prisma.unit.create({ data: { name } });
    }

    async findAll() {
        return this.prisma.unit.findMany();
    }

    async findOne(id: number) {
        const unit = await this.prisma.unit.findUnique({ where: { id } });
        if (!unit) throw new NotFoundException(`Unit #${id} not found`);
        return unit;
    }

    async update(id: number, data: { name: string }) {
        await this.findOne(id);
        const name = String(data?.name || '').trim();
        if (!name) throw new ConflictException('Nama unit wajib diisi');

        try {
            return await this.prisma.unit.update({ where: { id }, data: { name } });
        } catch (e: any) {
            if (e?.code === 'P2002') {
                throw new ConflictException('Unit with this name already exists');
            }
            throw e;
        }
    }

    async remove(id: number) {
        await this.findOne(id);
        try {
            return await this.prisma.unit.delete({ where: { id } });
        } catch (e: any) {
            if (e?.code === 'P2003') {
                throw new ConflictException('Unit tidak bisa dihapus karena masih dipakai produk');
            }
            throw e;
        }
    }
}
