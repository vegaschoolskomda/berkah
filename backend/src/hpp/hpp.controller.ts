import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { HppService } from './hpp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('hpp')
export class HppController {
    constructor(private readonly hppService: HppService) { }

    @Post()
    create(@Body() data: any) {
        return this.hppService.create(data);
    }

    @Get()
    findAll(@Query('variantId') variantId?: string) {
        return this.hppService.findAll(variantId ? parseInt(variantId) : undefined);
    }

    @Get('by-variant/:variantId')
    findByVariant(@Param('variantId', ParseIntPipe) variantId: number) {
        return this.hppService.findByVariant(variantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.hppService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.hppService.update(+id, data);
    }

    @Post(':id/apply-to-variant')
    applyToVariant(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { hppPerUnit: number }
    ) {
        return this.hppService.applyToVariant(id, body.hppPerUnit);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.hppService.remove(+id);
    }
}
