import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentDeleteRequestsService } from './document-delete-requests.service';

@UseGuards(JwtAuthGuard)
@Controller('documents/delete-requests')
export class DocumentDeleteRequestsController {
    constructor(
        private readonly service: DocumentDeleteRequestsService,
    ) {}

    @Get()
    findAll(
        @Request() req: any,
        @Query('status') status?: string,
    ) {
        if (status && status !== 'all') {
            return this.service.findAll(req.user.role, status);
        }
        return this.service.findPending(req.user.role);
    }

    @Post('documents/:id')
    requestDocumentDelete(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: { requesterNote?: string },
    ) {
        return this.service.requestDocumentDelete(+id, req.user.userId, body.requesterNote);
    }

    @Post('categories/:id')
    requestCategoryDelete(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: { requesterNote?: string },
    ) {
        return this.service.requestCategoryDelete(+id, req.user.userId, body.requesterNote);
    }

    @Patch(':id/approve')
    approve(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: { reviewerNote?: string },
    ) {
        return this.service.review(+id, req.user.userId, req.user.role, true, body.reviewerNote);
    }

    @Patch(':id/reject')
    reject(
        @Param('id') id: string,
        @Request() req: any,
        @Body() body: { reviewerNote?: string },
    ) {
        return this.service.review(+id, req.user.userId, req.user.role, false, body.reviewerNote);
    }
}
