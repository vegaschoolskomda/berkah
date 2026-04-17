"use client";

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveDocumentDeleteRequest, getDocumentDeleteRequests, rejectDocumentDeleteRequest, DocumentDeleteRequest } from '@/lib/api/document-delete-requests';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Check, Clock, Trash2, X, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

const STATUS_CONFIG = {
    PENDING: { label: 'Menunggu', color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
    APPROVED: { label: 'Disetujui', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
    REJECTED: { label: 'Ditolak', color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle },
};

function RequestCard({ request }: { request: DocumentDeleteRequest }) {
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState(false);
    const [reviewing, setReviewing] = useState<'approve' | 'reject' | null>(null);
    const [reviewNote, setReviewNote] = useState('');

    const statusCfg = STATUS_CONFIG[request.status];
    const StatusIcon = statusCfg.icon;

    const reviewMutation = useMutation({
        mutationFn: (params: { approved: boolean; reviewerNote?: string }) =>
            params.approved
                ? approveDocumentDeleteRequest(request.id, { reviewerNote: params.reviewerNote })
                : rejectDocumentDeleteRequest(request.id, { reviewerNote: params.reviewerNote || '' }),
        onSuccess: () => {
            setReviewing(null);
            setReviewNote('');
            queryClient.invalidateQueries({ queryKey: ['document-delete-requests'] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Gagal memproses permintaan';
            alert(Array.isArray(message) ? message.join(', ') : message);
        },
    });

    const targetLabel = request.targetType === 'FILE' ? 'File' : 'Kategori';

    const handleReview = (approved: boolean) => {
        if (!approved && !reviewNote.trim()) {
            alert('Harap isi alasan penolakan');
            return;
        }
        reviewMutation.mutate({ approved, reviewerNote: reviewNote.trim() || undefined });
    };

    return (
        <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
                                <Trash2 className="h-4 w-4 text-destructive" />
                                {request.targetName}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusCfg.label}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {targetLabel} • diajukan oleh <span className="font-medium text-foreground">{request.requester.name || request.requester.email}</span>
                            {' · '}
                            {dayjs(request.createdAt).format('D MMM YYYY HH:mm')}
                        </p>
                    </div>
                    <button onClick={() => setExpanded((v) => !v)} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                </div>

                <div className="mt-2 p-2.5 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Alasan requester:</span> {request.requesterNote || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Target:</span> {request.targetType} #{request.documentId ?? request.categoryId ?? '-'}
                    </p>
                </div>

                {expanded && (
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        <p>
                            <span className="font-medium text-foreground">Target:</span> {request.targetType === 'FILE' ? 'File dokumen' : 'Kategori dokumen'}
                        </p>
                        <p>
                            <span className="font-medium text-foreground">Dibuat:</span> {dayjs(request.createdAt).format('D MMM YYYY HH:mm')}
                        </p>
                        {request.reviewer && (
                            <p>
                                <span className="font-medium text-foreground">Reviewer terakhir:</span> {request.reviewer.name || request.reviewer.email}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {request.status !== 'PENDING' && request.reviewerNote && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Catatan reviewer:</span> {request.reviewerNote}
                    </p>
                </div>
            )}

            {request.status === 'PENDING' && (
                <div className="px-4 pb-4">
                    {reviewing === null ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setReviewing('approve')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" /> Setujui
                            </button>
                            <button
                                onClick={() => setReviewing('reject')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> Tolak
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                rows={2}
                                placeholder={reviewing === 'approve' ? 'Catatan (opsional)...' : 'Alasan penolakan (wajib)...'}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReview(reviewing === 'approve')}
                                    disabled={reviewMutation.isPending}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${reviewing === 'approve'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
                                        : 'bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20'
                                        }`}
                                >
                                    {reviewMutation.isPending ? 'Memproses...' : reviewing === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                                </button>
                                <button
                                    onClick={() => { setReviewing(null); setReviewNote(''); }}
                                    className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DocumentDeleteRequestsPage() {
    const { isBoss, currentUser } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    const { data: pendingRequests, isLoading: isLoadingPending } = useQuery({
        queryKey: ['document-delete-requests', 'PENDING'],
        queryFn: () => getDocumentDeleteRequests('PENDING'),
        enabled: isBoss,
        staleTime: 30_000,
    });

    const { data: allRequests, isLoading: isLoadingAll } = useQuery({
        queryKey: ['document-delete-requests', 'all'],
        queryFn: () => getDocumentDeleteRequests('all'),
        enabled: isBoss && activeTab === 'history',
        staleTime: 30_000,
    });

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground text-sm">Memuat...</p>
            </div>
        );
    }

    if (!isBoss) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <XCircle className="w-10 h-10 text-red-500/50" />
                <p className="text-foreground font-medium">Akses Ditolak</p>
                <p className="text-muted-foreground text-sm text-center">Halaman ini hanya dapat diakses oleh bos.</p>
            </div>
        );
    }

    const pendingCount = pendingRequests?.length ?? 0;
    const displayRequests = activeTab === 'pending' ? pendingRequests : allRequests;
    const isLoading = activeTab === 'pending' ? isLoadingPending : isLoadingAll;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-foreground">Permintaan Hapus File</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Review permintaan hapus file dan kategori sebelum data benar-benar dihapus.
                </p>
            </div>

            <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pending'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Menunggu
                    {pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                            {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Riwayat
                </button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-background border border-border rounded-xl p-4 animate-pulse">
                            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : !displayRequests?.length ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 bg-background border border-border rounded-xl">
                    <CheckCircle className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">
                        {activeTab === 'pending' ? 'Tidak ada permintaan yang menunggu' : 'Belum ada riwayat permintaan'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayRequests.map((request) => (
                        <RequestCard key={request.id} request={request} />
                    ))}
                </div>
            )}
        </div>
    );
}
