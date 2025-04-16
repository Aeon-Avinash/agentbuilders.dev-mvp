// Clerk authentication configuration
// This is used to integrate Clerk with the Convex backend

import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/astro";
import { defineMiddleware } from "astro:middleware";

const publicPaths = createRouteMatcher([
  "/*",
  "/api/*",
  "/frameworks/*",
  "/resources/*",
  "/about",
  "/submit",
]);

export const onRequest = clerkMiddleware({
  // Only protect routes that are not in the publicPaths list
  // The rest of the routes require authentication
  publicRoutes: publicPaths
});

export { clerkClient };
