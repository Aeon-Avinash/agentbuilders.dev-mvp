import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

/**
 * List all frameworks with filtering and sorting options
 */
export const listFrameworks = query({
  args: {
    category: v.optional(v.id("categories")), 
    tags: v.optional(v.array(v.string())),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("trendingScore"),
      v.literal("currentStars"),
      v.literal("lastCommitTimestamp"),
      v.literal("name")
    )),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { 
      category,
      tags,
      search,
      sortBy = "trendingScore", 
      sortDirection = "desc",
      limit = 20,
      skip = 0 
    } = args;
    
    // Start the query
    let query = ctx.db.query("frameworks");
    
    // Apply category filter if provided
    if (category) {
      query = query.withIndex("by_category", (q) => q.eq("category", category));
    }
    
    // Apply appropriate sort index
    if (sortBy === "trendingScore") {
      query = query.withIndex("by_trendingScore");
      if (sortDirection === "desc") {
        query = query.order("desc");
      } else {
        query = query.order("asc");
      }
    } else if (sortBy === "currentStars") {
      query = query.withIndex("by_stars");
      if (sortDirection === "desc") {
        query = query.order("desc");
      } else {
        query = query.order("asc");
      }
    } else {
      // For other sort fields, we'll sort in memory after fetching
    }
    
    // Execute the query
    let frameworks = await query.collect();
    
    // Apply post-query filters (for fields without indexes)
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      frameworks = frameworks.filter(framework => {
        if (!framework.tags) return false;
        return tags.some(tag => framework.tags?.includes(tag));
      });
    }
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      frameworks = frameworks.filter(framework => 
        framework.name.toLowerCase().includes(searchLower) ||
        framework.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sort for fields other than trendingScore and currentStars
    if (sortBy === "name") {
      frameworks.sort((a, b) => {
        if (sortDirection === "asc") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
    } else if (sortBy === "lastCommitTimestamp") {
      frameworks.sort((a, b) => {
        const aValue = a.lastCommitTimestamp || 0;
        const bValue = b.lastCommitTimestamp || 0;
        
        if (sortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
    
    // Apply pagination
    const paginatedFrameworks = frameworks.slice(skip, skip + limit);
    
    // Return result with metadata
    return {
      frameworks: paginatedFrameworks,
      total: frameworks.length,
      hasMore: skip + limit < frameworks.length,
    };
  },
});

/**
 * Get a specific framework by ID
 */
export const getFrameworkById = query({
  args: {
    frameworkId: v.id("frameworks"),
  },
  handler: async (ctx, args) => {
    const { frameworkId } = args;
    const framework = await ctx.db.get(frameworkId);
    
    if (!framework) {
      return null;
    }
    
    // Get the framework's category
    const category = await ctx.db.get(framework.category);
    
    // Get the most recent metrics snapshot
    const metricsSnapshots = await ctx.db
      .query("metricsSnapshots")
      .withIndex("by_framework_and_timestamp", (q) => 
        q.eq("frameworkId", frameworkId)
      )
      .order("desc")
      .take(1);
    
    // Get resources for this framework
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_framework", (q) => q.eq("frameworkId", frameworkId))
      .collect();
    
    return {
      framework,
      category,
      latestSnapshot: metricsSnapshots[0] || null,
      resources,
    };
  },
});

/**
 * Get framework by repository path
 * This is mainly used by background jobs
 */
export const getFrameworkByRepoPath = query({
  args: {
    repoPath: v.string(),
  },
  handler: async (ctx, args) => {
    const { repoPath } = args;
    
    const frameworks = await ctx.db
      .query("frameworks")
      .withIndex("by_repoPath", (q) => q.eq("repoPath", repoPath))
      .collect();
    
    return frameworks.length > 0 ? frameworks[0] : null;
  },
});

/**
 * Get top trending frameworks
 */
export const getTrendingFrameworks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 10 } = args;
    
    const frameworks = await ctx.db
      .query("frameworks")
      .withIndex("by_trendingScore")
      .order("desc")
      .take(limit);
      
    return frameworks;
  },
});
