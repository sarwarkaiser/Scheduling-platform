"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Rule Sets
export async function getRuleSets(programId?: string) {
    return await prisma.ruleSet.findMany({
        where: programId ? { programId } : {},
        include: {
            constraints: true,
            program: true,
            programYear: true,
        },
        orderBy: { name: "asc" },
    });
}

export async function createRuleSet(formData: FormData) {
    const name = formData.get("name") as string;
    const programId = formData.get("programId") as string;
    const programYearId = formData.get("programYearId") as string;
    const description = formData.get("description") as string;

    if (!name || !programId) {
        throw new Error("Missing required fields");
    }

    await prisma.ruleSet.create({
        data: {
            name,
            description,
            programId,
            programYearId: programYearId || null,
            active: true,
        },
    });

    revalidatePath("/admin/rules");
}

// Constraints
export async function createConstraint(formData: FormData) {
    const ruleSetId = formData.get("ruleSetId") as string;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string; // hard vs soft
    const pluginType = formData.get("pluginType") as string;
    const parameterJson = formData.get("parameters") as string;

    if (!ruleSetId || !name || !type || !pluginType) {
        throw new Error("Missing required fields");
    }

    let parameters = {};
    try {
        parameters = JSON.parse(parameterJson);
    } catch (e) {
        // default or error
        console.error("Invalid JSON parameters", e);
    }

    await prisma.constraintDefinition.create({
        data: {
            ruleSetId,
            name,
            type,
            pluginType,
            parameters: parameters,
            active: true
        }
    })

    revalidatePath("/admin/rules");
}

export async function deleteConstraint(id: string) {
    await prisma.constraintDefinition.delete({
        where: { id }
    });
    revalidatePath("/admin/rules");
}
