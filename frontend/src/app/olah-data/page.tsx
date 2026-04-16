"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createDocumentCategory,
    deleteDocument,
    deleteDocumentCategory,
    getDocumentCategories,
    getDocuments,
    updateDocument,
    updateDocumentCategory,
    uploadDocument,
} from "@/lib/api";
import { Search, Plus, Upload, Pencil, Trash2, Download, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

type EditState = {
    id: number;
    name: string;
    categoryId: string;
    file: File | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

export default function OlahDataPage() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();

    const [searchText, setSearchText] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("all");

    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadName, setUploadName] = useState("");
    const [uploadCategoryId, setUploadCategoryId] = useState("");
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const [categoryOpen, setCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [editCategoryState, setEditCategoryState] = useState<{ id: number; name: string } | null>(null);
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

    const [editState, setEditState] = useState<EditState | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: categories = [] } = useQuery({
        queryKey: ["document-categories"],
        queryFn: getDocumentCategories,
    });

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ["documents"],
        queryFn: getDocuments,
    });

    useEffect(() => {
        const categoryFromUrl = searchParams.get("category");
        if (categoryFromUrl) {
            setActiveCategory(categoryFromUrl);
            return;
        }
        setActiveCategory("all");
    }, [searchParams]);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        queryClient.invalidateQueries({ queryKey: ["document-categories"] });
    };

    const uploadMutation = useMutation({
        mutationFn: (formData: FormData) => uploadDocument(formData),
        onSuccess: () => {
            invalidateAll();
            setUploadOpen(false);
            setUploadName("");
            setUploadCategoryId("");
            setUploadFile(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Gagal upload file";
            alert(Array.isArray(message) ? message.join(", ") : message);
        },
    });

    const createCategoryMutation = useMutation({
        mutationFn: (name: string) => createDocumentCategory(name),
        onSuccess: (created) => {
            invalidateAll();
            setCategoryOpen(false);
            setNewCategoryName("");
            setActiveCategory(String(created.id));
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Gagal membuat kategori";
            alert(Array.isArray(message) ? message.join(", ") : message);
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) => updateDocumentCategory(id, name),
        onSuccess: () => {
            invalidateAll();
            setEditCategoryState(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Gagal mengubah kategori";
            alert(Array.isArray(message) ? message.join(", ") : message);
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: number) => deleteDocumentCategory(id),
        onSuccess: () => {
            invalidateAll();
            setDeleteCategoryId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Gagal menghapus kategori";
            alert(Array.isArray(message) ? message.join(", ") : message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: FormData }) => updateDocument(id, formData),
        onSuccess: () => {
            invalidateAll();
            setEditState(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Gagal mengubah dokumen";
            alert(Array.isArray(message) ? message.join(", ") : message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteDocument(id),
        onSuccess: () => {
            invalidateAll();
            setDeleteId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || "Gagal menghapus dokumen";
            alert(Array.isArray(message) ? message.join(", ") : message);
        },
    });

    const filteredDocuments = useMemo(() => {
        const search = searchText.trim().toLowerCase();
        return documents.filter((doc: any) => {
            const byCategory = activeCategory === "all" || String(doc.categoryId) === activeCategory;
            const bySearch = !search || doc.name.toLowerCase().includes(search);
            return byCategory && bySearch;
        });
    }, [documents, activeCategory, searchText]);

    const handleUpload = () => {
        if (!uploadFile) {
            alert("Pilih file terlebih dahulu.");
            return;
        }
        if (!uploadCategoryId) {
            alert("Pilih kategori terlebih dahulu.");
            return;
        }

        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("name", uploadName.trim() || uploadFile.name);
        formData.append("categoryId", uploadCategoryId);
        uploadMutation.mutate(formData);
    };

    const handleCreateCategory = () => {
        const name = newCategoryName.trim();
        if (!name) {
            alert("Nama kategori wajib diisi.");
            return;
        }
        createCategoryMutation.mutate(name);
    };

    const handleUpdate = () => {
        if (!editState) return;
        const name = editState.name.trim();
        if (!name) {
            alert("Nama file wajib diisi.");
            return;
        }
        if (!editState.categoryId) {
            alert("Kategori wajib dipilih.");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("categoryId", editState.categoryId);
        if (editState.file) {
            formData.append("file", editState.file);
        }

        updateMutation.mutate({ id: editState.id, formData });
    };

    const fileAccept = ".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Olah - Data</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Kelola dokumen perusahaan (PDF & Excel) dalam satu halaman.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCategoryOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted border border-border text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Kategori
                    </button>
                    <button
                        onClick={() => setUploadOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Upload className="h-4 w-4" /> Upload File
                    </button>
                </div>
            </div>

            <div className="glass rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setActiveCategory("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            activeCategory === "all"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/40"
                        }`}
                    >
                        Semua Kategori
                    </button>
                    {categories.map((cat: any) => (
                        <div
                            key={cat.id}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors group ${
                                activeCategory === String(cat.id)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                            }`}
                        >
                            <button
                                onClick={() => setActiveCategory(String(cat.id))}
                                className="flex-1"
                            >
                                {cat.name}
                            </button>
                            <button
                                onClick={() => setEditCategoryState({ id: cat.id, name: cat.name })}
                                className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                                title="Edit kategori"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => setDeleteCategoryId(cat.id)}
                                className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                                title="Hapus kategori"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Cari nama file..."
                        className="w-full pl-9 pr-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
            </div>

            <div className="glass rounded-xl border border-border overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                        <tr className="text-left">
                            <th className="px-4 py-3 font-semibold">File Name</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Uploaded By</th>
                            <th className="px-4 py-3 font-semibold">Last Updated</th>
                            <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                    Memuat dokumen...
                                </td>
                            </tr>
                        )}

                        {!isLoading && filteredDocuments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                    Belum ada dokumen pada filter ini.
                                </td>
                            </tr>
                        )}

                        {!isLoading && filteredDocuments.map((doc: any) => (
                            <tr key={doc.id} className="border-t border-border hover:bg-muted/20">
                                <td className="px-4 py-3">
                                    <a
                                        href={`${API_BASE}${doc.fileUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={doc.originalName}
                                        className="text-primary hover:underline font-medium inline-flex items-center gap-1.5"
                                        title="Buka / Download file"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        {doc.name}
                                    </a>
                                </td>
                                <td className="px-4 py-3">{doc.category?.name || "-"}</td>
                                <td className="px-4 py-3">{doc.uploadedBy?.name || doc.uploadedBy?.email || "-"}</td>
                                <td className="px-4 py-3">{formatDate(doc.updatedAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1.5">
                                        <button
                                            onClick={() => setEditState({
                                                id: doc.id,
                                                name: doc.name,
                                                categoryId: String(doc.categoryId),
                                                file: null,
                                            })}
                                            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(doc.id)}
                                            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {uploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Upload File</h2>
                            <button onClick={() => setUploadOpen(false)} className="p-1.5 rounded-md hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Nama File (opsional)</label>
                                <input
                                    type="text"
                                    value={uploadName}
                                    onChange={(e) => setUploadName(e.target.value)}
                                    placeholder="Kosongkan untuk pakai nama file asli"
                                    className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Kategori *</label>
                                <select
                                    value={uploadCategoryId}
                                    onChange={(e) => setUploadCategoryId(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                                >
                                    <option value="">Pilih kategori</option>
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">File (PDF/Excel) *</label>
                                <input
                                    type="file"
                                    accept={fileAccept}
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="mt-1 block w-full text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setUploadOpen(false)}
                                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploadMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {uploadMutation.isPending ? "Mengunggah..." : "Upload"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {categoryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Tambah Kategori</h2>
                            <button onClick={() => setCategoryOpen(false)} className="p-1.5 rounded-md hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Nama Kategori</label>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Contoh: Siap Print"
                                className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setCategoryOpen(false)}
                                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateCategory}
                                disabled={createCategoryMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {createCategoryMutation.isPending ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editCategoryState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Edit Kategori</h2>
                            <button onClick={() => setEditCategoryState(null)} className="p-1.5 rounded-md hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Nama Kategori</label>
                            <input
                                type="text"
                                value={editCategoryState.name}
                                onChange={(e) => setEditCategoryState({ ...editCategoryState, name: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditCategoryState(null)}
                                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    const name = editCategoryState.name.trim();
                                    if (!name) {
                                        alert("Nama kategori wajib diisi.");
                                        return;
                                    }
                                    updateCategoryMutation.mutate({ id: editCategoryState.id, name });
                                }}
                                disabled={updateCategoryMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {updateCategoryMutation.isPending ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteCategoryId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm bg-card rounded-xl border border-border shadow-2xl p-5 space-y-4">
                        <h2 className="text-lg font-semibold">Hapus Kategori?</h2>
                        <p className="text-sm text-muted-foreground">Kategori yang dihapus tidak dapat dikembalikan. Pastikan tidak ada dokumen yang menggunakan kategori ini.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteCategoryId(null)}
                                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => deleteCategoryId !== null && deleteCategoryMutation.mutate(deleteCategoryId)}
                                disabled={deleteCategoryMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
                            >
                                {deleteCategoryMutation.isPending ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg bg-card rounded-xl border border-border shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Edit Dokumen</h2>
                            <button onClick={() => setEditState(null)} className="p-1.5 rounded-md hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Nama File *</label>
                                <input
                                    type="text"
                                    value={editState.name}
                                    onChange={(e) => setEditState((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                                    className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Kategori *</label>
                                <select
                                    value={editState.categoryId}
                                    onChange={(e) => setEditState((prev) => prev ? { ...prev, categoryId: e.target.value } : prev)}
                                    className="mt-1 w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                                >
                                    <option value="">Pilih kategori</option>
                                    {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Ganti File (opsional)</label>
                                <input
                                    type="file"
                                    accept={fileAccept}
                                    onChange={(e) => setEditState((prev) => prev ? { ...prev, file: e.target.files?.[0] || null } : prev)}
                                    className="mt-1 block w-full text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditState(null)}
                                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updateMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm bg-card rounded-xl border border-border shadow-2xl p-5 space-y-4">
                        <h2 className="text-lg font-semibold">Hapus Dokumen?</h2>
                        <p className="text-sm text-muted-foreground">Dokumen yang dihapus tidak dapat dikembalikan.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deleteId)}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
