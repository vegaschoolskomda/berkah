import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const worksheetInclude = {
    variableCosts: {
        include: { productVariant: { include: { product: { include: { unit: true } } } } }
    },
    fixedCosts: true,
    productVariant: { include: { product: true } }
};

@Injectable()
export class HppService {
    constructor(private prisma: PrismaService) { }

    async findAll(variantId?: number) {
        return this.prisma.hppWorksheet.findMany({
            where: variantId ? { productVariantId: variantId } : undefined,
            include: worksheetInclude,
            orderBy: { updatedAt: 'desc' }
        });
    }

    async findOne(id: number) {
        const worksheet = await this.prisma.hppWorksheet.findUnique({
            where: { id },
            include: worksheetInclude
        });
        if (!worksheet) throw new NotFoundException('Worksheet not found');
        return worksheet;
    }

    async findByVariant(variantId: number) {
        return this.prisma.hppWorksheet.findMany({
            where: { productVariantId: variantId },
            include: worksheetInclude,
            orderBy: { updatedAt: 'desc' }
        });
    }

    async create(data: any) {
        return this.prisma.hppWorksheet.create({
            data: {
                productName: data.productName,
                targetVolume: data.targetVolume,
                targetMargin: data.targetMargin,
                productVariantId: data.productVariantId || null,
                variableCosts: {
                    create: data.variableCosts.map((vc: any) => ({
                        productVariantId: vc.productVariantId || null,
                        customMaterialName: vc.customMaterialName || null,
                        customPrice: vc.customPrice || null,
                        usageAmount: vc.usageAmount,
                        usageUnit: vc.usageUnit
                    }))
                },
                fixedCosts: {
                    create: data.fixedCosts.map((fc: any) => ({
                        name: fc.name,
                        amount: fc.amount
                    }))
                }
            },
            include: worksheetInclude
        });
    }

    async update(id: number, data: any) {
        await this.prisma.hppVariableCost.deleteMany({ where: { worksheetId: id } });
        await this.prisma.hppFixedCost.deleteMany({ where: { worksheetId: id } });

        return this.prisma.hppWorksheet.update({
            where: { id },
            data: {
                productName: data.productName,
                targetVolume: data.targetVolume,
                targetMargin: data.targetMargin,
                productVariantId: data.productVariantId !== undefined ? (data.productVariantId || null) : undefined,
                variableCosts: {
                    create: data.variableCosts.map((vc: any) => ({
                        productVariantId: vc.productVariantId || null,
                        customMaterialName: vc.customMaterialName || null,
                        customPrice: vc.customPrice || null,
                        usageAmount: vc.usageAmount,
                        usageUnit: vc.usageUnit
                    }))
                },
                fixedCosts: {
                    create: data.fixedCosts.map((fc: any) => ({
                        name: fc.name,
                        amount: fc.amount
                    }))
                }
            },
            include: worksheetInclude
        });
    }

    async remove(id: number) {
        return this.prisma.hppWorksheet.delete({ where: { id } });
    }

    /**
     * Apply calculated HPP from worksheet to the linked variant's hpp field.
     * Caller passes the calculated hppPerUnit value (result from frontend calculator).
     */
    async applyToVariant(worksheetId: number, hppPerUnit: number) {
        const worksheet = await this.findOne(worksheetId);
        if (!worksheet.productVariantId) {
            throw new BadRequestException('Worksheet ini belum ditautkan ke varian produk manapun.');
        }

        await this.prisma.productVariant.update({
            where: { id: worksheet.productVariantId },
            data: { hpp: hppPerUnit }
        });

        // Record the applied timestamp
        await this.prisma.hppWorksheet.update({
            where: { id: worksheetId },
            data: { appliedAt: new Date() }
        });

        return {
            message: `HPP Rp ${hppPerUnit.toLocaleString('id-ID')}/unit berhasil diterapkan ke varian.`,
            worksheetId,
            variantId: worksheet.productVariantId,
            hppPerUnit
        };
    }
}
