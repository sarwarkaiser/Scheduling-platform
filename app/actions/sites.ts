"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSites() {
    return await prisma.site.findMany({
        include: { organization: true },
        orderBy: { name: "asc" },
    });
}

export async function createSite(formData: FormData) {
    const name = formData.get("name") as string;
    const organizationId = formData.get("organizationId") as string;
    const timezone = formData.get("timezone") as string;
    const description = formData.get("description") as string;

    if (!name || !organizationId) {
        throw new Error("Missing required fields");
    }

    await prisma.site.create({
        data: {
            name,
            organizationId,
            timezone: timezone || "UTC",
        },
    });

    revalidatePath("/admin/sites");
}
