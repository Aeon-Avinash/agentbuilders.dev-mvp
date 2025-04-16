import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all categories
 */
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

/**
 * Get a specific category by ID
 */
export const getCategoryById = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const { categoryId } = args;
    return await ctx.db.get(categoryId);
  },
});

/**
 * Get a category by slug
 */
export const getCategoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const { slug } = args;
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .collect();
    
    return categories.length > 0 ? categories[0] : null;
  },
});
