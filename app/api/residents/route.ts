
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaginatedData, paginationResponse } from '@/lib/pagination';
import { validateBody, handleAPIError } from '@/lib/api-handler';
import { z } from 'zod';

// Input filter schema
const filterSchema = z.object({
    programId: z.string().optional(),
    status: z.enum(['active', 'inactive', 'all']).default('active').optional(),
    search: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const programId = searchParams.get('programId');
        const status = searchParams.get('status') || 'active';
        const searchQuery = searchParams.get('search');

        // Build Where Clause
        const where: any = {};
        if (programId) where.programId = programId;
        if (status !== 'all') where.active = status === 'active';

        if (searchQuery) {
            where.OR = [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        const result = await getPaginatedData(
            req,
            (skip, take) => prisma.resident.findMany({
                where,
                skip,
                take,
                orderBy: { user: { name: 'asc' } },
                include: {
                    program: { select: { name: true } },
                    programYear: { select: { name: true } }
                }
            }),
            () => prisma.resident.count({ where })
        );

        return paginationResponse(result);
    } catch (error) {
        return handleAPIError(error);
    }
}
