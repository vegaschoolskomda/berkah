"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Activity, ArrowRight, BellRing, RefreshCcw, UserRound } from 'lucide-react';
import { getEmployeeMonitoringList } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotificationStore } from '@/store/notification-store';

function formatDate(value: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MonitoringPage() {
  const { isManager, isLoading: isLoadingUser } = useCurrentUser();
  const notifications = useNotificationStore((s) => s.notifications);
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['employee-monitoring-list'],
    queryFn: getEmployeeMonitoringList,
    enabled: isManager,
    refetchInterval: 15_000,
  });

  const employees = useMemo(() => data, [data]);
  const employeeActivityNotifs = useMemo(() => {
    return notifications
      .filter((item) => item.type === 'system' && [
        'Aktivitas Karyawan',
        'Permintaan Izin Hapus File',
        'Permintaan Izin Hapus Kategori File',
      ].includes(item.title))
      .slice(0, 8);
  }, [notifications]);

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
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Pantau Kinerja Karyawan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lihat posisi halaman yang sedang dibuka karyawan dan riwayat perpindahan halamannya.
          </p>
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

      <div className="rounded-xl border border-border overflow-hidden bg-card/50">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Karyawan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Halaman Saat Ini</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Terakhir Aktif</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Memuat daftar karyawan...</td>
                </tr>
              )}

              {!isLoading && employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada data karyawan.</td>
                </tr>
              )}

              {!isLoading && employees.map((employee) => (
                <tr key={employee.userId} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{employee.userName}</p>
                        <p className="text-xs text-muted-foreground">{employee.userEmail} • {employee.roleName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${employee.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {employee.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{employee.currentPageTitle || '-'}</p>
                    <p className="text-xs text-muted-foreground">{employee.currentPath || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(employee.lastSeenAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/monitoring/${employee.userId}`}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
                    >
                      Detail
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Notifikasi Aktivitas Karyawan</h2>
        </div>

        {employeeActivityNotifs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Belum ada notifikasi aktivitas karyawan.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {employeeActivityNotifs.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium">{item.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(new Date(item.timestamp).toISOString())}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
