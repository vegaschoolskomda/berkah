import api from './client';

export type DocumentDeleteRequest = {
    id: number;
    documentId: number | null;
    categoryId: number | null;
    targetType: 'FILE' | 'CATEGORY';
    targetName: string;
    requesterId: number;
    reviewedById: number | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requesterNote: string | null;
    reviewerNote: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
    requester: { id: number; name: string | null; email: string };
    reviewer: { id: number; name: string | null; email: string } | null;
};

export const getDocumentDeleteRequests = async (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return (await api.get(`/documents/delete-requests${query}`)).data as DocumentDeleteRequest[];
};

export const approveDocumentDeleteRequest = async (id: number, data: { reviewerNote?: string }) =>
    (await api.patch(`/documents/delete-requests/${id}/approve`, data)).data;

export const rejectDocumentDeleteRequest = async (id: number, data: { reviewerNote?: string }) =>
    (await api.patch(`/documents/delete-requests/${id}/reject`, data)).data;
