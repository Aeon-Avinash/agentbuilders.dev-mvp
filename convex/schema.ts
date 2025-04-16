import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for Agentbuilders.dev
 * This schema defines the database tables and fields for the application.
 */
export default defineSchema({
  // Frameworks table - stores information about AI agent frameworks
  frameworks: defineTable({
    name: v.string(), // Unique name of the framework (e.g., "LangChain", "AutoGen")
    description: v.string(), // Detailed description
    websiteUrl: v.string(), // URL to the official website
    githubRepoUrl: v.string(), // URL to the primary GitHub repository
    repoPath: v.string(), // Path part of the URL (e.g., "langchain-ai/langchain")
    category: v.id("categories"), // Foreign key relationship to the categories table
    logoUrl: v.optional(v.string()), // Optional URL for the framework's logo
    tags: v.optional(v.array(v.string())), // Optional tags for finer-grained classification
    
    // Denormalized fields for performance (updated by scheduled jobs)
    trendingScore: v.optional(v.float64()), // Latest calculated trending score
    lastCommitTimestamp: v.optional(v.float64()), // Unix timestamp of the last commit fetched
    currentStars: v.optional(v.number()), // Latest GitHub star count
    currentPypiDownloads: v.optional(v.number()), // Latest PyPI downloads (e.g., last 30 days)
    currentNpmDownloads: v.optional(v.number()), // Latest npm downloads (e.g., last 30 days)
    currentSimilarwebRank: v.optional(v.number()), // Latest Similarweb global rank
  })
    .index("by_category", ["category"]) // For filtering by category
    .index("by_trendingScore", ["trendingScore"]) // For sorting by trending score
    .index("by_stars", ["currentStars"]) // For sorting by stars
    .index("by_repoPath", ["repoPath"]), // For looking up framework by repo path during data ingestion

  // Categories table - stores framework categories
  categories: defineTable({
    name: v.string(), // Category name (e.g., "Full-code", "Low-code", "No-code", "Automation Platform")
    description: v.optional(v.string()), // Optional description of the category
  }).index("by_name", ["name"]), // Index for potential lookups by name

  // MetricsSnapshots table - stores historical metric data for trend analysis
  metricsSnapshots: defineTable({
    frameworkId: v.id("frameworks"), // Foreign key relationship to the frameworks table
    timestamp: v.float64(), // Unix timestamp when the snapshot was taken
    githubStars: v.optional(v.number()), // GitHub stars at snapshot time
    pypiDownloads: v.optional(v.number()), // PyPI downloads for the period ending at snapshot time
    npmDownloads: v.optional(v.number()), // npm downloads for the period ending at snapshot time
    similarwebRank: v.optional(v.number()), // Similarweb rank at snapshot time
    githubLastCommitTimestamp: v.optional(v.float64()), // Last commit timestamp observed at snapshot time
  })
    // Index for retrieving time-series data for a specific framework
    .index("by_framework_and_timestamp", ["frameworkId", "timestamp"]),

  // Resources table - links to relevant resources (tutorials, articles, docs)
  resources: defineTable({
    frameworkId: v.id("frameworks"), // Foreign key relationship to the frameworks table
    title: v.string(), // Title of the resource
    url: v.string(), // URL of the resource
    type: v.string(), // Type of resource (e.g., "Tutorial", "Article", "Video", "Docs")
  }).index("by_framework", ["frameworkId"]), // Index for fetching resources for a framework

  // Users table - stores application-specific user data, linked to Clerk
  users: defineTable({
    clerkId: v.string(), // Unique user ID from Clerk authentication provider
    name: v.optional(v.string()), // User's name (synced from Clerk)
    email: v.optional(v.string()), // User's email (synced from Clerk)
    // Example Post-MVP field:
    favoriteFrameworkIds: v.optional(v.array(v.id("frameworks"))),
  })
    // Index for efficiently finding the user record based on Clerk ID
    .index("by_clerkId", ["clerkId"]),
}, 
// Schema Options
{
  // Enable schema validation in production
  schemaValidation: true,
  // Ensure TypeScript types only allow known table names
  strictTableNameTypes: true,
});
