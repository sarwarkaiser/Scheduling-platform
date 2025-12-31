
"use server";

import { SwapWorkflowModule, SwapRequestInput } from "@/lib/modules/workflow/swap";
import { revalidatePath } from "next/cache";

const swapWorkflow = new SwapWorkflowModule();

export async function requestSwap(input: SwapRequestInput) {
    try {
        await swapWorkflow.createSwapRequest(input);
        revalidatePath("/admin/requests");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function validateSwap(input: SwapRequestInput) {
    // Perform pre-check validation without creating the request
    const result = await swapWorkflow.preCheckSwap(input);
    return result;
}
