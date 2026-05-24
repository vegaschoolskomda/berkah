"use client";

import { useState } from 'react';
import {
  AlertTriangle,
  Package,
  Map,
  Loader2,
  BarChart
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan sistem manajemen CV Berkah Pratama Sejahtera.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Selamat Datang</h2>
            <p className="text-muted-foreground mb-4">
              Sistem manajemen ini telah dihapus fitur: Kasir POS, Manajemen Stok, dan Stok Opname.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Fitur yang masih tersedia:</p>
              <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                <li>Invoice & Penawaran Harga (SPH)</li>
                <li>Antrian Produksi</li>
                <li>Manajemen Supplier</li>
                <li>Backup & Restore</li>
                <li>Laporan dan Analytics</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickActionCard
              title="Kelola Produk"
              desc="Lihat dan edit data produk."
              href="/settings"
              icon={Package}
              color="emerald"
            />
            <QuickActionCard
              title="Kelola User"
              desc="Pengaturan akun dan preferensi."
              href="/settings"
              icon={AlertTriangle}
              color="blue"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-chart-5" />
            Info Sistem
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>✓ Sistem berhasil diinisialisasi</p>
            <p>✓ Database terhubung</p>
            <p>✓ Proses migrasi selesai</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, color }: any) {
  const colorStyles: Record<string, string> = {
    blue: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    indigo: "bg-primary/20 text-primary border-primary/30",
    emerald: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    rose: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="glass rounded-xl p-4 sm:p-6">
      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function QuickActionCard({ title, desc, href, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    indigo: "hover:border-primary/50 text-primary bg-primary/10",
    emerald: "hover:border-chart-3/50 text-chart-3 bg-chart-3/10",
    blue: "hover:border-chart-2/50 text-chart-2 bg-chart-2/10",
  };

  return (
    <Link
      href={href}
      className={cn(
        "group block glass rounded-xl p-5 border border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        colorMap[color]
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4")}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Link>
  )
}
