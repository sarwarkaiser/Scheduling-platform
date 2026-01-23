
import { z } from 'zod';

// ============================================================================
// SHARED
// ============================================================================
export const idSchema = z.string(); // Loosened to allow non-cuid strings (e.g. seeded IDs like prog-1)
export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
});

// ============================================================================
// ORGANIZATION & STRUCTURE
// ============================================================================
export const organizationSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10).toUpperCase(),
});

export const programSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10),
    organizationId: idSchema,
});

// ============================================================================
// RESIDENTS
// ============================================================================
export const residentSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    programId: idSchema,
    programYearId: idSchema.optional(), // Can be derived or manual
    pgy: z.number().int().min(1).max(10).optional(), // Helper for seed/import
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()).optional(),
    active: z.boolean().default(true),
});

// ============================================================================
// SCHEDULING
// ============================================================================
export const generateScheduleSchema = z.object({
    programId: idSchema,
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    callPoolIds: z.array(idSchema).optional(),
    siteIds: z.array(idSchema).optional(),
    async: z.boolean().default(false),
});

export const swapRequestSchema = z.object({
    assignmentId: idSchema,
    targetResidentId: idSchema.optional(), // Open swap if null
    reason: z.string().optional(),
});
