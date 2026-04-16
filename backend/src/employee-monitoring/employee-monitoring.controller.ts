import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeeMonitoringService } from './employee-monitoring.service';
import { UsersService } from '../users/users.service';

@Controller('employee-monitoring')
export class EmployeeMonitoringController {
  constructor(
    private readonly employeeMonitoringService: EmployeeMonitoringService,
    private readonly usersService: UsersService,
  ) {}

  private async ensureManager(req: any) {
    const roleId = Number(req?.user?.role || 0) || null;
    const isManager = await this.usersService.isManagerRole(roleId);
    if (!isManager) {
      throw new ForbiddenException('Akses ditolak. Hanya manager/admin/owner yang diizinkan.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('ping')
  async ping(
    @Request() req: any,
    @Body() data: { path: string; pageTitle?: string | null },
  ) {
    const userId = Number(req?.user?.userId || 0);
    return this.employeeMonitoringService.ping(userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('employees')
  async getEmployees(@Request() req: any) {
    await this.ensureManager(req);
    return this.employeeMonitoringService.getEmployeeStates();
  }

  @UseGuards(JwtAuthGuard)
  @Get('employees/:userId/history')
  async getEmployeeHistory(
    @Request() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string,
  ) {
    await this.ensureManager(req);
    return this.employeeMonitoringService.getEmployeeHistory(userId, Number(limit || 100));
  }
}
