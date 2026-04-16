import { Module } from '@nestjs/common';
import { EmployeeMonitoringController } from './employee-monitoring.controller';
import { EmployeeMonitoringService } from './employee-monitoring.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [EmployeeMonitoringController],
  providers: [EmployeeMonitoringService],
})
export class EmployeeMonitoringModule {}
