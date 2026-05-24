'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateMyProfile } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Eye, EyeOff, Save, AlertCircle, Check } from 'lucide-react';

export default function ProfileSettingsPage() {
    const { currentUser, isLoading: isLoadingUser } = useCurrentUser();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                name: currentUser.name || '',
                email: currentUser.email || '',
            }));
        }
    }, [currentUser]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            const data: any = {};
            
            // Validate dan prepare data
            if (formData.name !== currentUser?.name) {
                if (!formData.name.trim()) {
                    throw new Error('Nama tidak boleh kosong');
                }
                data.name = formData.name;
            }

            if (formData.email !== currentUser?.email) {
                if (!formData.email.trim()) {
                    throw new Error('Email tidak boleh kosong');
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    throw new Error('Format email tidak valid');
                }
                data.email = formData.email;
            }

            // Password change
            if (formData.newPassword || formData.currentPassword) {
                if (!formData.newPassword) {
                    throw new Error('Password baru harus diisi');
                }
                if (formData.newPassword.length < 6) {
                    throw new Error('Password minimal 6 karakter');
                }
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('Password baru dan konfirmasi tidak cocok');
                }
                data.password = formData.newPassword;
            }

            if (Object.keys(data).length === 0) {
                throw new Error('Tidak ada data yang diubah');
            }

            return updateMyProfile(data);
        },
        onSuccess: () => {
            setSuccessMessage('Profil berhasil diperbarui!');
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));
            setErrors({});
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Gagal memperbarui profil';
            setErrors({ submit: message });
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate();
    };

    if (isLoadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500">Memuat profil...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Silakan login terlebih dahulu</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow">
                {/* Header */}
                <div className="border-b px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Pengaturan Profil</h1>
                    <p className="text-sm text-gray-500 mt-1">Perbarui informasi pribadi dan keamanan akun Anda</p>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700">{successMessage}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{errors.submit}</p>
                        </div>
                    )}

                    {/* Section: Personal Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pribadi</h2>
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Masukkan nama lengkap Anda"
                                />
                                <p className="text-xs text-gray-500 mt-1">Ganti nama dari username otomatis menjadi nama Anda</p>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Masukkan email pribadi Anda"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email untuk komunikasi dan pemulihan akun</p>
                            </div>
                        </div>
                    </div>

                    <hr className="my-6" />

                    {/* Section: Security */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Keamanan Akun</h2>
                        <p className="text-sm text-gray-600 mb-4">Kosongkan kolom password jika tidak ingin mengubah password</p>
                        <div className="space-y-4">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        placeholder="Masukkan password baru"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.new ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        placeholder="Konfirmasi password baru"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswords.confirm ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">Password minimal 6 karakter</p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
