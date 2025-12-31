"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPrograms() {
    return await prisma.program.findMany({
        include: { organization: true },
        orderBy: { name: "asc" },
    });
}

export async function createProgram(formData: FormData) {
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const organizationId = formData.get("organizationId") as string;
    const description = formData.get("description") as string;

    if (!name || !code || !organizationId) {
        throw new Error("Missing required fields");
    }

    await prisma.program.create({
        data: {
            name,
            code,
            organizationId,
            description,
        },
    });

    revalidatePath("/admin/programs");
}

export async function deleteProgram(id: string) {
    try {
        await prisma.program.delete({ where: { id } });
        revalidatePath("/admin/programs");
    } catch (e) {
        throw new Error("Failed to delete program. It may have related data.");
    }
}

export async function updateProgram(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const description = formData.get("description") as string;
    const organizationId = formData.get("organizationId") as string;
    // const active = formData.get("active") === "true"; // Add when UI supports it

    await prisma.program.update({
        where: { id },
        data: { name, code, description, organizationId },
    });
    revalidatePath("/admin/programs");
}
