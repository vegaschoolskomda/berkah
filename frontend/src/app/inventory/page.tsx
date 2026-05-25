"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Package, Search } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
    const [search, setSearch] = useState("");

    const { data: products, isLoading, error } = useQuery({
        queryKey: ["products"],
        queryFn: () => getProducts({ limit: 1000 }),
        staleTime: 60000,
    });

    const filteredProducts = products?.data?.filter(
        (p: any) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const lowStockProducts = filteredProducts.filter(
        (p: any) => p.currentStock && p.currentStock <= 5
    );

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Stok</h1>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-800 font-medium">Gagal memuat data stok</p>
                        <p className="text-red-700 text-sm">Pastikan server berjalan dengan baik.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Stok</h1>
                    <p className="text-muted-foreground mt-2">
                        Kelola stok produk dan pantau ketersediaan barang
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredProducts.length}</div>
                            <p className="text-xs text-muted-foreground">Produk terdaftar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {lowStockProducts.length}
                            </div>
                            <p className="text-xs text-muted-foreground">Stok ≤ 5 unit</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Nilai</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {filteredProducts
                                    .reduce(
                                        (sum: number, p: any) =>
                                            sum + (p.currentStock || 0) * (p.purchasePrice || 0),
                                        0
                                    )
                                    .toLocaleString("id-ID")}
                            </div>
                            <p className="text-xs text-muted-foreground">Rp (harga pokok)</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Daftar Produk</CardTitle>
                            <CardDescription>
                                Stok terkini untuk semua produk di sistem
                            </CardDescription>
                        </div>
                        <Link href="/inventory/opname">
                            <Button variant="default" size="sm">
                                <Package className="mr-2 h-4 w-4" />
                                Stok Opname
                            </Button>
                        </Link>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari produk atau SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left px-4 py-3 font-semibold">Produk</th>
                                    <th className="text-right px-4 py-3 font-semibold">SKU</th>
                                    <th className="text-right px-4 py-3 font-semibold">Stok</th>
                                    <th className="text-right px-4 py-3 font-semibold">
                                        Harga Pokok
                                    </th>
                                    <th className="text-right px-4 py-3 font-semibold">
                                        Nilai Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Tidak ada produk ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product: any) => {
                                        const stock = product.currentStock || 0;
                                        const price = product.purchasePrice || 0;
                                        const value = stock * price;
                                        const isLowStock = stock <= 5;

                                        return (
                                            <tr
                                                key={product.id}
                                                className={`border-b hover:bg-muted/50 ${
                                                    isLowStock ? "bg-orange-50/50" : ""
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {product.name}
                                                        </p>
                                                        {product.category && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {product.category.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-right px-4 py-3">
                                                    {product.sku || "-"}
                                                </td>
                                                <td
                                                    className={`text-right px-4 py-3 font-semibold ${
                                                        isLowStock
                                                            ? "text-orange-600"
                                                            : ""
                                                    }`}
                                                >
                                                    {stock} {product.unit?.name || ""}
                                                </td>
                                                <td className="text-right px-4 py-3">
                                                    Rp
                                                    {price.toLocaleString("id-ID")}
                                                </td>
                                                <td className="text-right px-4 py-3">
                                                    Rp
                                                    {value.toLocaleString("id-ID")}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
