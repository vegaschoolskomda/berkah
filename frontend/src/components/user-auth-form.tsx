"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    mobileGlass?: boolean;
}

export function UserAuthForm({ className, mobileGlass, ...props }: UserAuthFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setErrorMsg(null)

        const target = event.target as typeof event.target & {
            username: { value: string };
            password: { value: string };
        };

        const username = target.username.value.trim();
        const password = target.password.value;

        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const endpoint = `${base}/auth/login`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email: username, login: username, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const message = Array.isArray(data?.message)
                    ? data.message.join(', ')
                    : data?.message || 'Authentication failed';
                throw new Error(message);
            }

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            // Set cookie for Next.js Middleware. Expires in 1 day to match backend JWT setting.
            const expires = new Date();
            expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
            document.cookie = `token=${data.access_token};expires=${expires.toUTCString()};path=/`;

            router.replace('/');
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label className="sr-only" htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            placeholder="Masukkan username atau email"
                            type="text"
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                            className={mobileGlass ? "bg-white/10 border-white/25 text-white placeholder:text-white/40 focus-visible:ring-white/30 lg:bg-background lg:border-input lg:text-foreground lg:placeholder:text-muted-foreground" : ""}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="sr-only" htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            placeholder="Password"
                            type="password"
                            autoCapitalize="none"
                            autoComplete="current-password"
                            disabled={isLoading}
                            required
                            className={mobileGlass ? "bg-white/10 border-white/25 text-white placeholder:text-white/40 focus-visible:ring-white/30 lg:bg-background lg:border-input lg:text-foreground lg:placeholder:text-muted-foreground" : ""}
                        />
                    </div>
                    {errorMsg && (
                        <div className="text-sm font-medium text-destructive text-center">
                            {errorMsg}
                        </div>
                    )}
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Masuk
                    </Button>
                </div>
            </form>
        </div>
    )
}
