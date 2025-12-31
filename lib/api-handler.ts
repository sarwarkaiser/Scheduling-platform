
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class APIError extends Error {
    constructor(
        public message: string,
        public status: number = 500,
        public code: string = 'INTERNAL_SERVER_ERROR',
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export function handleAPIError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof APIError) {
        return NextResponse.json(
            { error: error.message, code: error.code, details: error.details },
            { status: error.status }
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            { error: 'Validation Error', code: 'VALIDATION_ERROR', details: (error as any).issues || (error as any).errors },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' },
        { status: 500 }
    );
}

export function validateBody<T>(schema: { safeParse: (data: any) => { success: boolean; data?: T; error?: any } }, body: any): T {
    const result = schema.safeParse(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data!;
}
