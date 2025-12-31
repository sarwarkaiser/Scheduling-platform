"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOrganizations() {
    return await prisma.organization.findMany({
        orderBy: { name: "asc" },
    });
}

export async function createOrganization(formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;

    if (!name || !slug) {
        throw new Error("Missing required fields");
    }

    await prisma.organization.create({
        data: {
            name,
            slug,
            description,
        },
    });

    revalidatePath("/admin/organizations");
}
