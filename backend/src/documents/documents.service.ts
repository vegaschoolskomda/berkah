import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DocumentsService {
    constructor(private readonly prisma: PrismaService) {}

    async listCategories() {
        return this.prisma.documentCategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { documents: true },
                },
            },
        });
    }

    async createCategory(name: string) {
        return this.prisma.documentCategory.create({
            data: { name: name.trim() },
        });
    }

    async updateCategory(id: number, name: string) {
        await this.ensureCategoryExists(id);

        try {
            return await this.prisma.documentCategory.update({
                where: { id },
                data: { name: name.trim() },
            });
        } catch (e: any) {
            if (e?.code === 'P2002') {
                throw new ConflictException('Kategori dengan nama yang sama sudah ada');
            }
            throw e;
        }
    }

    async deleteCategory(id: number) {
        await this.ensureCategoryExists(id);

        try {
            await this.prisma.documentCategory.delete({ where: { id } });
            return { message: 'Kategori berhasil dihapus' };
        } catch (e: any) {
            if (e?.code === 'P2003') {
                throw new ConflictException('Kategori tidak bisa dihapus karena masih dipakai dokumen');
            }
            throw e;
        }
    }

    async getCategoryById(id: number) {
        const existing = await this.prisma.documentCategory.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Kategori tidak ditemukan');
        return existing;
    }

    async listDocuments() {
        return this.prisma.documentFile.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                category: true,
                uploadedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    async createDocument(data: {
        name: string;
        originalName: string;
        storedName: string;
        mimeType: string;
        extension: string;
        sizeBytes: number;
        fileUrl: string;
        categoryId: number;
        uploadedById: number;
    }) {
        return this.prisma.documentFile.create({
            data,
            include: {
                category: true,
                uploadedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    async updateDocument(
        id: number,
        data: {
            name?: string;
            categoryId?: number;
            originalName?: string;
            storedName?: string;
            mimeType?: string;
            extension?: string;
            sizeBytes?: number;
            fileUrl?: string;
            uploadedById?: number;
        },
    ) {
        await this.ensureDocumentExists(id);
        return this.prisma.documentFile.update({
            where: { id },
            data,
            include: {
                category: true,
                uploadedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    async deleteDocument(id: number) {
        const existing = await this.prisma.documentFile.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Dokumen tidak ditemukan');

        const absPath = join(process.cwd(), 'public', existing.fileUrl.replace(/^\//, ''));
        if (existsSync(absPath)) {
            unlinkSync(absPath);
        }

        await this.prisma.documentFile.delete({ where: { id } });
        return { message: 'Dokumen berhasil dihapus' };
    }

    async getDocumentById(id: number) {
        const existing = await this.prisma.documentFile.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Dokumen tidak ditemukan');
        return existing;
    }

    private async ensureDocumentExists(id: number) {
        const existing = await this.prisma.documentFile.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Dokumen tidak ditemukan');
        return existing;
    }

    private async ensureCategoryExists(id: number) {
        const existing = await this.prisma.documentCategory.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Kategori tidak ditemukan');
        return existing;
    }
}
