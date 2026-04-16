import api from './client';

export type DocumentCategory = {
    id: number;
    name: string;
    _count?: { documents: number };
};

export type DocumentFile = {
    id: number;
    name: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    extension: string;
    sizeBytes: number;
    fileUrl: string;
    categoryId: number;
    uploadedById: number;
    createdAt: string;
    updatedAt: string;
    category: { id: number; name: string };
    uploadedBy: { id: number; name: string | null; email: string };
};

export const getDocumentCategories = async () =>
    (await api.get('/documents/categories')).data as DocumentCategory[];

export const createDocumentCategory = async (name: string) =>
    (await api.post('/documents/categories', { name })).data as DocumentCategory;

export const updateDocumentCategory = async (id: number, name: string) =>
    (await api.patch(`/documents/categories/${id}`, { name })).data as DocumentCategory;

export const deleteDocumentCategory = async (id: number) =>
    (await api.delete(`/documents/categories/${id}`)).data as { message: string };

export const getDocuments = async () =>
    (await api.get('/documents')).data as DocumentFile[];

export const uploadDocument = async (formData: FormData) =>
    (await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })).data as DocumentFile;

export const updateDocument = async (id: number, formData: FormData) =>
    (await api.patch(`/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })).data as DocumentFile;

export const deleteDocument = async (id: number) =>
    (await api.delete(`/documents/${id}`)).data as { message: string };
