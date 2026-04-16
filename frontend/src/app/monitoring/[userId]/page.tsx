"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock3, MapPinned, RefreshCcw } from 'lucide-react';
import { getEmployeeMonitoringHistory } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function formatDate(value: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function MonitoringDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = Number(params?.userId || 0);
  const { isManager, isLoading: isLoadingUser } = useCurrentUser();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['employee-monitoring-history', userId],
    queryFn: () => getEmployeeMonitoringHistory(userId, 200),
    enabled: isManager && userId > 0,
    refetchInterval: 15_000,
  });

  if (isLoadingUser) {
    return <div className="p-6 text-sm text-muted-foreground">Memuat data user...</div>;
  }

  if (!isManager) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card/60 p-5 text-sm text-muted-foreground">
          Halaman ini hanya bisa diakses akun bos/manager.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Link href="/monitoring" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke list karyawan
          </Link>

          <div>
            <h1 className="text-2xl font-bold">Detail Monitoring Karyawan</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.user?.userName || 'Karyawan'} • {data?.user?.userEmail || '-'}
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-sm font-medium inline-flex items-center gap-2"
          disabled={isFetching}
        >
          <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Halaman Saat Ini</p>
          <p className="font-semibold text-base">{data?.currentPageTitle || '-'}</p>
          <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
            <MapPinned className="h-4 w-4" />
            {data?.currentPath || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs text-muted-foreground mb-1">Status Aktif</p>
          <p className={`font-semibold text-base ${data?.isOnline ? 'text-emerald-600' : 'text-slate-600'}`}>
            {data?.isOnline ? 'Online' : 'Offline'}
          </p>
          <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4" />
            Terakhir aktif: {formatDate(data?.lastSeenAt || null)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40">
          <h2 className="font-semibold">History Perpindahan Halaman</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Urutan terbaru ke lama.</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat history...</div>}

          {!isLoading && (!data?.history || data.history.length === 0) && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada history halaman.</div>
          )}

          {!isLoading && data?.history?.map((item, idx) => (
            <div key={`${item.path}-${item.visitedAt}-${idx}`} className="px-4 py-3 border-b border-border/50">
              <p className="font-medium text-sm">{item.pageTitle || '-'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.path}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDate(item.visitedAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
