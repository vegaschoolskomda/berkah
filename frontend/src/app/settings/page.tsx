"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function SettingsRedirect() {
    const router = useRouter();
    const { isManager, isLoading } = useCurrentUser();

    useEffect(() => {
        if (isLoading) return;
        router.replace(isManager ? '/settings/general' : '/settings/users');
    }, [isLoading, isManager, router]);

    return (
        <div className="p-8 flex justify-center text-muted-foreground">
            <Loader2 className="animate-spin" />
        </div>
    );
}
