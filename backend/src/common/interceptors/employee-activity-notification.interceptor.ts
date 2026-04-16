import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UsersService } from '../../users/users.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class EmployeeActivityNotificationInterceptor implements NestInterceptor {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = String(req?.method || '').toUpperCase();
    const path = String(req?.originalUrl || req?.url || '');
    const userId = Number(req?.user?.userId || 0);
    const roleId = Number(req?.user?.role || 0) || null;
    const actor = String(req?.user?.email || req?.user?.name || 'Karyawan');

    const isMutationMethod = ['POST', 'PATCH', 'PUT'].includes(method);
    const shouldHandle = isMutationMethod
      && userId > 0
      && !path.startsWith('/auth')
      && !path.startsWith('/notifications')
      && !path.startsWith('/employee-monitoring/ping');

    return next.handle().pipe(
      tap(() => {
        if (!shouldHandle) return;
        void this.emitIfEmployee({ roleId, method, path, actor });
      }),
    );
  }

  private async emitIfEmployee(params: { roleId: number | null; method: string; path: string; actor: string }) {
    const isManager = await this.usersService.isManagerRole(params.roleId);
    if (isManager) return;

    const cleanPath = params.path.split('?')[0] || '/';
    const action = this.actionLabel(params.method);

    this.notificationsService.emit({
      type: 'system',
      title: 'Aktivitas Karyawan',
      message: `${params.actor} melakukan ${action} data (${cleanPath}).`,
    });
  }

  private actionLabel(method: string): string {
    if (method === 'POST') return 'penambahan';
    return 'perubahan';
  }
}
