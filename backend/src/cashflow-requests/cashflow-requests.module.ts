import { Module } from '@nestjs/common';
import { CashflowRequestsService } from './cashflow-requests.service';
import { CashflowRequestsController } from './cashflow-requests.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    controllers: [CashflowRequestsController],
    providers: [CashflowRequestsService],
})
export class CashflowRequestsModule { }
