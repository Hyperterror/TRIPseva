import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/jobs",
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/about-us",
  "/createuser",
  "/api/create",
  "/test-components"
]);

const isPublicApiRoute = createRouteMatcher([
  "/home",
  "/api/main",
  "/api/alljobs",
  "/api/createuser",
  "/api/create"
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentUrl = new URL(req.url);
  const pathname = currentUrl.pathname;
  const isApiRequest = pathname.startsWith("/api");
  
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Allow public API routes
  if (isApiRequest && isPublicApiRoute(req)) {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users to sign-in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
