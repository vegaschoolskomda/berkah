"use client";

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRoles, getUsers, updateUser } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Copy, KeyRound, Search, Shield, UserRound, X, Eye, EyeOff } from 'lucide-react';

type PasswordModalState = {
    isOpen: boolean;
    userId: number | null;
    name: string;
    username: string;
    password: string;
    confirmPassword: string;
};

export default function EmployeeAccountsPage() {
    const queryClient = useQueryClient();
    const { currentUser, isBoss, isLoading: isLoadingUser } = useCurrentUser();
    const [searchText, setSearchText] = useState('');
    const [passwordModal, setPasswordModal] = useState<PasswordModalState>({
        isOpen: false,
        userId: null,
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const { data: users = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ['employee-accounts'],
        queryFn: getUsers,
        enabled: isBoss,
        staleTime: 30_000,
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['employee-account-roles'],
        queryFn: getRoles,
        enabled: isBoss,
        staleTime: 30_000,
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, password }: { id: number; password: string }) => updateUser(id, { password }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-accounts'] });
            setPasswordModal({ isOpen: false, userId: null, name: '', username: '', password: '', confirmPassword: '' });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Gagal reset password';
            alert(Array.isArray(message) ? message.join(', ') : message);
        },
    });

    const filteredUsers = useMemo(() => {
        const search = searchText.trim().toLowerCase();
        return users.filter((user: any) => {
            if (!search) return true;
            const roleName = user.role?.name || '';
            return [user.name, user.email, user.phone, roleName].some((value) => String(value || '').toLowerCase().includes(search));
        });
    }, [users, searchText]);

    const copyUsername = async (username: string) => {
        try {
            await navigator.clipboard.writeText(username);
            alert('Username disalin ke clipboard');
        } catch {
            alert(`Username: ${username}`);
        }
    };

    const openResetModal = (user: any) => {
        setPasswordModal({
            isOpen: true,
            userId: user.id,
            name: user.name || '',
            username: user.email || '',
            password: '',
            confirmPassword: '',
        });
        setShowPassword(false);
    };

    const handleResetPassword = () => {
        if (!passwordModal.userId) return;
        if (!passwordModal.password || passwordModal.password.length < 6) {
            alert('Password baru minimal 6 karakter');
            return;
        }
        if (passwordModal.password !== passwordModal.confirmPassword) {
            alert('Konfirmasi password tidak cocok');
            return;
        }
        resetPasswordMutation.mutate({ id: passwordModal.userId, password: passwordModal.password });
    };

    if (isLoadingUser) {
        return <div className="p-6 text-sm text-muted-foreground">Memuat data user...</div>;
    }

    if (!currentUser) {
        return <div className="p-6 text-sm text-muted-foreground">Memuat...</div>;
    }

    if (!isBoss) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-border bg-card/60 p-5 text-sm text-muted-foreground">
                    Halaman ini hanya bisa diakses akun bos.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserRound className="h-6 w-6 text-primary" />
                        Akun Karyawan
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Bos bisa melihat username karyawan dan reset password saat akun lupa akses.
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground inline-flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {roles.length} role terdaftar
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Cari nama, username, nomor, atau role..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card/50">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Akun</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kontak</th>
                            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingUsers && (
                            <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Memuat daftar akun...</td>
                            </tr>
                        )}

                        {!isLoadingUsers && filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Tidak ada akun yang cocok.</td>
                            </tr>
                        )}

                        {!isLoadingUsers && filteredUsers.map((user: any) => (
                            <tr key={user.id} className="border-t border-border hover:bg-muted/20">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground truncate">{user.name || '-'}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {user.role?.name || '-'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {user.phone || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        <button
                                            onClick={() => copyUsername(user.email)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            Salin Username
                                        </button>
                                        <button
                                            onClick={() => openResetModal(user)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            <KeyRound className="h-3.5 w-3.5" />
                                            Reset Password
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {passwordModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-primary" />
                                    Reset Password
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {passwordModal.name || passwordModal.username}
                                </p>
                            </div>
                            <button onClick={() => setPasswordModal({ isOpen: false, userId: null, name: '', username: '', password: '', confirmPassword: '' })} className="p-1.5 rounded-md hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Username</label>
                                <input
                                    type="text"
                                    value={passwordModal.username}
                                    readOnly
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Password Baru</label>
                                <div className="mt-1 relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordModal.password}
                                        onChange={(e) => setPasswordModal((prev) => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm"
                                        placeholder="Minimal 6 karakter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Konfirmasi Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordModal.confirmPassword}
                                    onChange={(e) => setPasswordModal((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setPasswordModal({ isOpen: false, userId: null, name: '', username: '', password: '', confirmPassword: '' })}
                                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={resetPasswordMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                            >
                                {resetPasswordMutation.isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
