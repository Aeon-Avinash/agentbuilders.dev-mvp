import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * List all resources with optional filtering by framework or type
 */
export const listResources = query({
  args: {
    frameworkId: v.optional(v.id("frameworks")),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { frameworkId, type, limit = 20, skip = 0 } = args;
    
    // Start the query
    let resourcesQuery = ctx.db.query("resources");
    
    // Apply framework filter if provided
    if (frameworkId) {
      resourcesQuery = resourcesQuery.withIndex("by_framework", (q) => 
        q.eq("frameworkId", frameworkId)
      );
    }
    
    // Execute the query
    let resources = await resourcesQuery.collect();
    
    // Apply type filter if provided (done in memory since we don't have an index for it)
    if (type) {
      resources = resources.filter(resource => resource.type === type);
    }
    
    // Apply pagination
    const paginatedResources = resources.slice(skip, skip + limit);
    
    // Fetch related framework data for each resource
    const resourcesWithDetails = await Promise.all(
      paginatedResources.map(async (resource) => {
        const framework = await ctx.db.get(resource.frameworkId);
        return {
          ...resource,
          framework: framework ? {
            _id: framework._id,
            name: framework.name,
          } : null,
        };
      })
    );
    
    return {
      resources: resourcesWithDetails,
      total: resources.length,
      hasMore: skip + limit < resources.length,
    };
  },
});

/**
 * Get a specific resource by ID
 */
export const getResourceById = query({
  args: {
    resourceId: v.id("resources"),
  },
  handler: async (ctx, args) => {
    const { resourceId } = args;
    
    const resource = await ctx.db.get(resourceId);
    if (!resource) {
      return null;
    }
    
    // Get the related framework
    const framework = await ctx.db.get(resource.frameworkId);
    
    return {
      resource,
      framework,
    };
  },
});

/**
 * Get recommendations of similar resources
 */
export const getRelatedResources = query({
  args: {
    resourceId: v.id("resources"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { resourceId, limit = 3 } = args;
    
    const resource = await ctx.db.get(resourceId);
    if (!resource) {
      return [];
    }
    
    // Get resources for the same framework, excluding the current one
    const frameworkResources = await ctx.db
      .query("resources")
      .withIndex("by_framework", (q) => q.eq("frameworkId", resource.frameworkId))
      .filter((q) => q.neq(q.field("_id"), resourceId))
      .take(limit);
    
    // If we don't have enough resources from the same framework, get some of the same type
    if (frameworkResources.length < limit) {
      const typeResources = await ctx.db
        .query("resources")
        .filter((q) => 
          q.and(
            q.eq(q.field("type"), resource.type),
            q.neq(q.field("_id"), resourceId),
            q.neq(q.field("frameworkId"), resource.frameworkId)
          )
        )
        .take(limit - frameworkResources.length);
      
      return [...frameworkResources, ...typeResources];
    }
    
    return frameworkResources;
  },
});
