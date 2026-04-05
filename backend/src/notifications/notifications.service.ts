import { Injectable } from '@nestjs/common';
import { Subject, Observable, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';

export interface NotifEvent {
    type: 'transaction' | 'stock' | 'shift' | 'update' | 'system';
    title: string;
    message: string;
}

@Injectable()
export class NotificationsService {
    private subject = new Subject<NotifEvent>();

    emit(event: NotifEvent) {
        this.subject.next(event);
    }

    getObservable(): Observable<MessageEvent> {
        const events$ = this.subject.pipe(
            map(event => ({ data: event } as MessageEvent))
        );
        const heartbeat$ = interval(25000).pipe(
            map(() => ({ data: { type: 'ping' } } as unknown as MessageEvent))
        );
        return merge(events$, heartbeat$);
    }

    async sendToDiscord(webhookUrl: string, content: string) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
        } catch {
            // Jangan crash jika Discord down
        }
    }
}
