
"use server";

import { FairnessModule } from "@/lib/modules/reporting/fairness";
import { revalidatePath } from "next/cache";

const fairnessModule = new FairnessModule();

export async function getFairnessReport(programId: string, startDate: Date, endDate: Date) {
    // Ensure dates are Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await fairnessModule.getFairnessReport(programId, start, end);
}

export async function recalculateFairness(programId: string, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    await fairnessModule.calculateFairnessStats({
        programId,
        periodStart: start,
        periodEnd: end,
    });

    revalidatePath("/admin/reports/fairness");
}
