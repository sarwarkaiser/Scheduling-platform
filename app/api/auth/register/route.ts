
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    // Optional: pass SIGNUP_SECRET from env to register as ADMIN
    adminSecret: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password, adminSecret } = registerSchema.parse(body)

        // Determine role:
        // - ADMIN if the correct admin secret is supplied, OR if this is the very first user
        // - RESIDENT otherwise
        const userCount = await prisma.user.count()
        const secretMatches =
            adminSecret &&
            process.env.ADMIN_SIGNUP_SECRET &&
            adminSecret === process.env.ADMIN_SIGNUP_SECRET

        const role = userCount === 0 || secretMatches ? "ADMIN" : "RESIDENT"

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json(
                { message: "User with this email already exists" },
                { status: 409 }
            )
        }

        const hashedPassword = await hash(password, 12)

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role },
        })

        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(
            { message: "User created successfully", user: userWithoutPassword },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input", errors: (error as any).errors },
                { status: 400 }
            )
        }

        console.error("Registration error:", error)
        return NextResponse.json(
            { message: "An error occurred during registration" },
            { status: 500 }
        )
    }
}
