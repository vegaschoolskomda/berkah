import { Module, forwardRef } from '@nestjs/common';
import { DocumentDeleteRequestsController } from './document-delete-requests.controller';
import { DocumentDeleteRequestsService } from './document-delete-requests.service';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [forwardRef(() => DocumentsModule), NotificationsModule],
    controllers: [DocumentDeleteRequestsController],
    providers: [DocumentDeleteRequestsService],
})
export class DocumentDeleteRequestsModule {}
