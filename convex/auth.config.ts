import { defineConfig } from "convex/config";
import { v } from "convex/values";

export default defineConfig({
  // Ensure all actions and mutations are authenticated unless specifically
  // marked as public
  actions: {
    // Makes the default permission for all actions to require authentication
    defaultPermission: "authenticated",
  },
  mutations: {
    // Makes the default permission for all mutations to require authentication
    defaultPermission: "authenticated",
  },
  // Auth configuration for Clerk integration
  auth: {
    providers: [
      {
        // This configures Clerk as our authentication provider
        domain: "clerk.agentbuilders.dev",
        applicationID: "clerk",
      },
    ],
    // What the JWT contains
    getUserIdentity: async (tokenData) => {
      // Return user identity to access in Convex functions
      return {
        tokenIdentifier: tokenData.sub,
        // Additional user fields provided by Clerk
        userId: tokenData.sub,
        name: `${tokenData.given_name || ""} ${tokenData.family_name || ""}`.trim() || null,
        email: tokenData.email || null,
      };
    },
  },
});
