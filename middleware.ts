
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import "@/lib/env" // Trigger validation on startup

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const isAuth = !!token
        const isAuthPage = req.nextUrl.pathname.startsWith("/login")

        if (isAuthPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL("/admin", req.url))
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
        if (req.nextUrl.pathname.startsWith("/admin")) {
            // Example: Only ADMIN or CHIEF can access /admin routes
            // For MVP, if they are logged in, let them viewing the dashboard, 
            // but maybe restrict specific sub-routes?
            // Requirement: "residents limited to viewing their schedules"

            // If resident tries to access admin settings:
            if (token?.role === "RESIDENT" &&
                (req.nextUrl.pathname.startsWith("/admin/organizations") ||
                    req.nextUrl.pathname.startsWith("/admin/programs"))) {
                return NextResponse.redirect(new URL("/admin/files/unauthorized", req.url)) // or just 403
            }
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
    matcher: ["/admin/:path*", "/api/((?!auth).*)"],
}
