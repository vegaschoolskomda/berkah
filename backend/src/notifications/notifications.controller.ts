import { Controller, Header, Query, UnauthorizedException, Sse } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly jwtService: JwtService,
    ) { }

    @Sse('stream')
    @Header('X-Accel-Buffering', 'no')
    @Header('Cache-Control', 'no-cache')
    stream(@Query('token') token: string): Observable<MessageEvent> {
        if (!token) throw new UnauthorizedException();
        try {
            this.jwtService.verify(token);
        } catch {
            throw new UnauthorizedException();
        }
        return this.notificationsService.getObservable();
    }
}
