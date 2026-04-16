import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

const uploadStorage = diskStorage({
    destination: (req, file, cb) => {
        const dest = join(process.cwd(), 'public', 'uploads', 'documents');
        mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `doc-${unique}${ext}`);
    },
});

const documentFilter = (req: any, file: any, cb: any) => {
    const ext = extname(file.originalname).toLowerCase();
    const allowedExt = ['.pdf', '.xls', '.xlsx'];
    if (!allowedExt.includes(ext)) {
        return cb(new BadRequestException('Hanya file PDF dan Excel yang diperbolehkan.'), false);
    }

    const allowedMime = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (file.mimetype && !allowedMime.includes(file.mimetype)) {
        return cb(new BadRequestException('Format file tidak valid.'), false);
    }

    cb(null, true);
};

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
    constructor(
        private readonly documentsService: DocumentsService,
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService,
    ) {}

    private async isManager(req: any): Promise<boolean> {
        const roleId = Number(req?.user?.role || 0) || null;
        return this.usersService.isManagerRole(roleId);
    }

    @Get('categories')
    listCategories() {
        return this.documentsService.listCategories();
    }

    @Post('categories')
    createCategory(@Body() body: { name?: string }) {
        const name = body.name?.trim();
        if (!name) throw new BadRequestException('Nama kategori wajib diisi');
        return this.documentsService.createCategory(name);
    }

    @Patch('categories/:id')
    updateCategory(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string }) {
        const name = body.name?.trim();
        if (!name) throw new BadRequestException('Nama kategori wajib diisi');
        return this.documentsService.updateCategory(id, name);
    }

    @Delete('categories/:id')
    async deleteCategory(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const manager = await this.isManager(req);
        if (!manager) {
            const category = await this.documentsService.getCategoryById(id);
            const actor = req?.user?.email || req?.user?.name || `User#${req?.user?.userId || 'unknown'}`;

            this.notificationsService.emit({
                type: 'system',
                title: 'Permintaan Izin Hapus Kategori File',
                message: `${actor} meminta izin menghapus kategori file "${category.name}".`,
            });

            return {
                message: 'Permintaan izin hapus kategori sudah dikirim ke bos. Kategori belum dihapus.',
                requiresApproval: true,
            };
        }

        return this.documentsService.deleteCategory(id);
    }

    @Get()
    listDocuments() {
        return this.documentsService.listDocuments();
    }

    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: uploadStorage,
        fileFilter: documentFilter,
        limits: { fileSize: 25 * 1024 * 1024 },
    }))
    async uploadDocument(
        @Body() body: { name?: string; categoryId?: string },
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        if (!file) throw new BadRequestException('File wajib diunggah');
        const categoryId = Number(body.categoryId);
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            throw new BadRequestException('Kategori wajib dipilih');
        }

        const ext = extname(file.originalname).toLowerCase();
        const name = body.name?.trim() || file.originalname;

        return this.documentsService.createDocument({
            name,
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            extension: ext,
            sizeBytes: file.size,
            fileUrl: `/uploads/documents/${file.filename}`,
            categoryId,
            uploadedById: req.user.userId,
        });
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('file', {
        storage: uploadStorage,
        fileFilter: documentFilter,
        limits: { fileSize: 25 * 1024 * 1024 },
    }))
    async updateDocument(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name?: string; categoryId?: string },
        @UploadedFile() file: Express.Multer.File | undefined,
        @Request() req: any,
    ) {
        const payload: any = {};
        if (body.name !== undefined) {
            const trimmed = body.name.trim();
            if (!trimmed) throw new BadRequestException('Nama file tidak boleh kosong');
            payload.name = trimmed;
        }

        if (body.categoryId !== undefined) {
            const categoryId = Number(body.categoryId);
            if (!Number.isInteger(categoryId) || categoryId <= 0) {
                throw new BadRequestException('Kategori tidak valid');
            }
            payload.categoryId = categoryId;
        }

        if (file) {
            const ext = extname(file.originalname).toLowerCase();
            payload.originalName = file.originalname;
            payload.storedName = file.filename;
            payload.mimeType = file.mimetype;
            payload.extension = ext;
            payload.sizeBytes = file.size;
            payload.fileUrl = `/uploads/documents/${file.filename}`;
            payload.uploadedById = req.user.userId;
        }

        return this.documentsService.updateDocument(id, payload);
    }

    @Delete(':id')
    async removeDocument(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const manager = await this.isManager(req);
        if (!manager) {
            const doc = await this.documentsService.getDocumentById(id);
            const actor = req?.user?.email || req?.user?.name || `User#${req?.user?.userId || 'unknown'}`;

            this.notificationsService.emit({
                type: 'system',
                title: 'Permintaan Izin Hapus File',
                message: `${actor} meminta izin menghapus file "${doc.name}".`,
            });

            return {
                message: 'Permintaan izin hapus file sudah dikirim ke bos. File belum dihapus.',
                requiresApproval: true,
            };
        }

        return this.documentsService.deleteDocument(id);
    }
}
