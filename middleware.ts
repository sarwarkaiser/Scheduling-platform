
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import "@/lib/env" // Trigger validation on startup

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const isAuth = !!token
        const isAuthPage = req.nextUrl.pathname.startsWith("/login")
        const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
        const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard")

        if (isAuthPage) {
            if (isAuth) {
                const redirectPath = token?.role === "RESIDENT" ? "/dashboard" : "/admin"
                return NextResponse.redirect(new URL(redirectPath, req.url))
            }
            return null
        }

        if (!isAuth) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }

            return NextResponse.redirect(
                new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
            );
        }

        // Role based protection
        if (isAdminRoute && token?.role === "RESIDENT") {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }

        if (isDashboardRoute && token?.role !== "RESIDENT") {
            return NextResponse.redirect(new URL("/admin", req.url))
        }
    },
    {
        callbacks: {
            async authorized() {
                // This is a work-around for handling redirect on auth pages.
                // We return true here so that the middleware function above
                // is always called.
                return true
            },
        },
    }
)

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*", "/api/((?!auth).*)"],
}
