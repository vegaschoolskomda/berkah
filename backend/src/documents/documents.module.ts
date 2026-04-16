import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [UsersModule, NotificationsModule],
    controllers: [DocumentsController],
    providers: [DocumentsService],
})
export class DocumentsModule {}
