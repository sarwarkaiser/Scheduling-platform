
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { paginationSchema } from './schemas';

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export async function getPaginatedData<T>(
    req: NextRequest,
    fetcher: (skip: number, take: number) => Promise<T[]>,
    counter: () => Promise<number>,
): Promise<PaginatedResult<T>> {
    const searchParams = req.nextUrl.searchParams;

    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;

    // Validate params
    const { page: safePage, pageSize: safePageSize } = paginationSchema.parse({
        page,
        pageSize,
    });

    const skip = (safePage - 1) * safePageSize;

    const [data, total] = await Promise.all([
        fetcher(skip, safePageSize),
        counter()
    ]);

    const totalPages = Math.ceil(total / safePageSize);

    return {
        data,
        meta: {
            total,
            page: safePage,
            pageSize: safePageSize,
            totalPages,
        }
    };
}

export function paginationResponse<T>(result: PaginatedResult<T>) {
    return NextResponse.json(result);
}
