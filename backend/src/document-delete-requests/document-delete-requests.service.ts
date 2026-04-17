import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DocumentDeleteRequestsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly documentsService: DocumentsService,
        private readonly notifications: NotificationsService,
    ) {}

    private async isBoss(roleId: number | null): Promise<boolean> {
        if (!roleId) return false;
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) return false;
        const name = role.name.toLowerCase();
        return (
            name === 'owner' ||
            name === 'pemilik' ||
            name === 'bos' ||
            name.includes('owner') ||
            name.includes('pemilik') ||
            name.includes('boss') ||
            name.includes('bos')
        );
    }

    async requestDocumentDelete(documentId: number, requesterId: number, requesterNote?: string) {
        const document = await this.documentsService.getDocumentById(documentId);
        const pending = await this.prisma.documentDeleteRequest.findFirst({
            where: {
                documentId,
                status: 'PENDING',
            },
        });
        if (pending) {
            throw new BadRequestException('Sudah ada permintaan hapus yang menunggu untuk file ini');
        }

        const request = await this.prisma.documentDeleteRequest.create({
            data: {
                documentId,
                targetType: 'FILE',
                targetName: document.name,
                requesterId,
                requesterNote,
                status: 'PENDING',
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                reviewer: { select: { id: true, name: true, email: true } },
            },
        });

        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
            select: { name: true, email: true },
        });

        this.notifications.emit({
            type: 'system',
            title: 'Permintaan Hapus File',
            message: `${requester?.name ?? requester?.email ?? 'Karyawan'} meminta izin menghapus file "${document.name}".`,
        });

        return request;
    }

    async requestCategoryDelete(categoryId: number, requesterId: number, requesterNote?: string) {
        const category = await this.documentsService.getCategoryById(categoryId);
        const pending = await this.prisma.documentDeleteRequest.findFirst({
            where: {
                categoryId,
                status: 'PENDING',
            },
        });
        if (pending) {
            throw new BadRequestException('Sudah ada permintaan hapus yang menunggu untuk kategori ini');
        }

        const request = await this.prisma.documentDeleteRequest.create({
            data: {
                categoryId,
                targetType: 'CATEGORY',
                targetName: category.name,
                requesterId,
                requesterNote,
                status: 'PENDING',
            },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                reviewer: { select: { id: true, name: true, email: true } },
            },
        });

        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
            select: { name: true, email: true },
        });

        this.notifications.emit({
            type: 'system',
            title: 'Permintaan Hapus Kategori File',
            message: `${requester?.name ?? requester?.email ?? 'Karyawan'} meminta izin menghapus kategori file "${category.name}".`,
        });

        return request;
    }

    async findPending(roleId: number | null) {
        if (!(await this.isBoss(roleId))) {
            throw new ForbiddenException('Hanya bos yang dapat melihat permintaan hapus');
        }
        return this.prisma.documentDeleteRequest.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                reviewer: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async findAll(roleId: number | null, status?: string) {
        if (!(await this.isBoss(roleId))) {
            throw new ForbiddenException('Hanya bos yang dapat melihat permintaan hapus');
        }
        return this.prisma.documentDeleteRequest.findMany({
            where: status ? { status: status as any } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                reviewer: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async review(requestId: number, reviewerId: number, reviewerRoleId: number | null, approved: boolean, reviewerNote?: string) {
        if (!(await this.isBoss(reviewerRoleId))) {
            throw new ForbiddenException('Hanya bos yang dapat memproses permintaan');
        }

        const request = await this.prisma.documentDeleteRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new NotFoundException('Permintaan tidak ditemukan');
        }
        if (request.status !== 'PENDING') {
            throw new BadRequestException('Permintaan ini sudah diproses');
        }

        if (approved) {
            if (request.targetType === 'FILE' && request.documentId) {
                await this.documentsService.deleteDocument(request.documentId);
            } else if (request.targetType === 'CATEGORY' && request.categoryId) {
                await this.documentsService.deleteCategory(request.categoryId);
            } else {
                throw new BadRequestException('Target permintaan tidak valid');
            }
        }

        await this.prisma.documentDeleteRequest.update({
            where: { id: requestId },
            data: {
                status: approved ? 'APPROVED' : 'REJECTED',
                reviewedById: reviewerId,
                reviewerNote: reviewerNote ?? null,
                reviewedAt: new Date(),
            },
        });

        this.notifications.emit({
            type: 'system',
            title: approved ? 'Permintaan Hapus Disetujui' : 'Permintaan Hapus Ditolak',
            message: `${request.targetType === 'FILE' ? 'File' : 'Kategori'} "${request.targetName}" ${approved ? 'disetujui' : 'ditolak'}.${reviewerNote ? ` ${approved ? 'Catatan' : 'Alasan'}: ${reviewerNote}` : ''}`,
        });

        return { success: true };
    }
}
