import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user settings by user ID
 */
export const getUserSettings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
      
    return userSettings || null;
  },
});

/**
 * Create or update user settings
 */
export const saveUserSettings = mutation({
  args: {
    userId: v.string(),
    theme: v.string(),
    favoriteFrameworkIds: v.optional(v.array(v.id("frameworks"))),
  },
  handler: async (ctx, args) => {
    const { userId, theme, favoriteFrameworkIds = [] } = args;
    
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
      
    if (existingSettings) {
      return await ctx.db.patch(existingSettings._id, {
        theme,
        favoriteFrameworkIds,
      });
    } else {
      return await ctx.db.insert("userSettings", {
        userId,
        theme,
        favoriteFrameworkIds,
      });
    }
  },
});
