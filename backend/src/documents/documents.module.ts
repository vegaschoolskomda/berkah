import { Module, forwardRef } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentDeleteRequestsModule } from '../document-delete-requests/document-delete-requests.module';

@Module({
    imports: [UsersModule, NotificationsModule, forwardRef(() => DocumentDeleteRequestsModule)],
    controllers: [DocumentsController],
    providers: [DocumentsService],
    exports: [DocumentsService],
})
export class DocumentsModule {}
