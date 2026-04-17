import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { UnitsModule } from './units/units.module';
import { ProductsModule } from './products/products.module';
import { BatchesModule } from './batches/batches.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CashflowModule } from './cashflow/cashflow.module';
import { InvoiceModule } from './invoice/invoice.module';
import { BranchesModule } from './branches/branches.module';
import { SettingsModule } from './settings/settings.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { CustomersModule } from './customers/customers.module';
import { HppModule } from './hpp/hpp.module';
import { ReportsModule } from './reports/reports.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { CompetitorsModule } from './competitors/competitors.module';
import { StockOpnameModule } from './stock-opname/stock-opname.module';
import { ProductionModule } from './production/production.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { BackupModule } from './backup/backup.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhookModule } from './webhook/webhook.module';
import { CashflowRequestsModule } from './cashflow-requests/cashflow-requests.module';
import { StockPurchasesModule } from './stock-purchases/stock-purchases.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentDeleteRequestsModule } from './document-delete-requests/document-delete-requests.module';
import { EmployeeMonitoringModule } from './employee-monitoring/employee-monitoring.module';
import { EmployeeActivityNotificationInterceptor } from './common/interceptors/employee-activity-notification.interceptor';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'), // Serve local uploads
    }),
    PrismaModule, UsersModule, AuthModule, CategoriesModule, UnitsModule, ProductsModule, BatchesModule, StockMovementsModule, TransactionsModule, CashflowModule, InvoiceModule, BranchesModule, SettingsModule, BankAccountsModule, CustomersModule, HppModule, ReportsModule, WhatsappModule, CompetitorsModule, StockOpnameModule, ProductionModule, SuppliersModule, BackupModule, NotificationsModule, WebhookModule, CashflowRequestsModule, StockPurchasesModule, DocumentsModule, DocumentDeleteRequestsModule, EmployeeMonitoringModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: EmployeeActivityNotificationInterceptor,
    },
  ],
})
export class AppModule { }
