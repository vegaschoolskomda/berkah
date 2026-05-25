"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Save, RotateCcw, Package, Search } from "lucide-react";

export default function StockOpnamePage() {
    const [search, setSearch] = useState("");
    const [opnameData, setOpnameData] = useState<Record<string, number>>({});

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

    const handleOpnameChange = (productId: number, value: string) => {
        const numValue = value === "" ? 0 : parseInt(value, 10) || 0;
        setOpnameData((prev) => ({
            ...prev,
            [productId]: numValue,
        }));
    };

    const handleReset = () => {
        setOpnameData({});
    };

    const totalVariance = filteredProducts.reduce((sum: number, p: any) => {
        const opnameQty = opnameData[p.id] || 0;
        const systemQty = p.currentStock || 0;
        return sum + (opnameQty - systemQty);
    }, 0);

    const differenceCount = filteredProducts.filter((p: any) => {
        const opnameQty = opnameData[p.id] || 0;
        const systemQty = p.currentStock || 0;
        return opnameQty !== systemQty;
    }).length;

    if (error) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Stok Opname</h1>
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
                    <h1 className="text-3xl font-bold tracking-tight">Stok Opname</h1>
                    <p className="text-muted-foreground mt-2">
                        Verifikasi stok fisik dengan data sistem
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredProducts.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Sudah Dicatat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Object.keys(opnameData).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Perbedaan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {differenceCount}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Variance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${
                                    totalVariance >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {totalVariance >= 0 ? "+" : ""}
                                {totalVariance}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Produk Opname</CardTitle>
                    <CardDescription>
                        Masukkan jumlah stok fisik yang dihitung
                    </CardDescription>
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left px-4 py-3 font-semibold">Produk</th>
                                    <th className="text-right px-4 py-3 font-semibold">SKU</th>
                                    <th className="text-right px-4 py-3 font-semibold">
                                        Stok Sistem
                                    </th>
                                    <th className="text-right px-4 py-3 font-semibold">
                                        Stok Fisik
                                    </th>
                                    <th className="text-right px-4 py-3 font-semibold">Selisih</th>
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
                                        const systemQty = product.currentStock || 0;
                                        const opnameQty = opnameData[product.id] ?? "";
                                        const variance =
                                            opnameQty !== ""
                                                ? (opnameQty as number) - systemQty
                                                : 0;
                                        const hasDifference =
                                            opnameQty !== "" && opnameQty !== systemQty;

                                        return (
                                            <tr
                                                key={product.id}
                                                className={`border-b hover:bg-muted/50 ${
                                                    hasDifference
                                                        ? "bg-orange-50/50"
                                                        : opnameQty !== ""
                                                        ? "bg-green-50/50"
                                                        : ""
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
                                                <td className="text-right px-4 py-3">
                                                    {systemQty} {product.unit?.name || ""}
                                                </td>
                                                <td className="text-right px-4 py-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={
                                                            opnameQty === ""
                                                                ? ""
                                                                : opnameQty
                                                        }
                                                        onChange={(e) =>
                                                            handleOpnameChange(
                                                                product.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-24 text-right"
                                                    />
                                                </td>
                                                <td
                                                    className={`text-right px-4 py-3 font-semibold ${
                                                        variance > 0
                                                            ? "text-green-600"
                                                            : variance < 0
                                                            ? "text-red-600"
                                                            : ""
                                                    }`}
                                                >
                                                    {variance >= 0 ? "+" : ""}
                                                    {variance}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={handleReset}>
                            Batal
                        </Button>
                        <Button
                            disabled={Object.keys(opnameData).length === 0}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Simpan Opname
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-blue-800 font-medium">Info Stok Opname</p>
                    <p className="text-blue-700 text-sm">
                        Stok Opname berfungsi untuk memverifikasi stok fisik dengan data di
                        sistem. Masukkan jumlah stok yang dihitung secara manual, dan sistem
                        akan menampilkan selisihnya.
                    </p>
                </div>
            </div>
        </div>
    );
}
