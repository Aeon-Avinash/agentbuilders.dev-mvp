import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { fetchRepositoryData } from "./lib/github";
import { fetchDownloadStats as fetchPypiDownloadStats } from "./lib/pypi";
import { fetchDownloadStats as fetchNpmDownloadStats } from "./lib/npm";
import { fetchGlobalRank } from "./lib/similarweb";
import { calculateTrendingScore } from "./lib/trending";

/**
 * Updates GitHub metrics (stars, last commit) for a specific framework
 */
export const updateGitHubMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all frameworks with GitHub repositories
    const frameworks = await ctx.db
      .query("frameworks")
      .filter((q) => q.neq(q.field("repoPath"), ""))
      .collect();
    
    const updates = [];
    
    for (const framework of frameworks) {
      try {
        if (!framework.repoPath) continue;
        
        // Fetch latest GitHub data
        const repoData = await fetchRepositoryData(
          { convex: ctx.runQuery, convexImport: ctx.runAction }, 
          { repoPath: framework.repoPath }
        );
        
        if (!repoData) continue;
        
        // Update the framework with latest metrics
        const updateData: Record<string, any> = {
          currentStars: repoData.stars,
        };
        
        if (repoData.lastCommitTimestamp) {
          updateData.lastCommitTimestamp = repoData.lastCommitTimestamp;
        }
        
        await ctx.db.patch(framework._id, updateData);
        
        // Record a metrics snapshot
        await ctx.db.insert("metricsSnapshots", {
          frameworkId: framework._id,
          timestamp: Math.floor(Date.now() / 1000),
          githubStars: repoData.stars,
          githubLastCommitTimestamp: repoData.lastCommitTimestamp,
        });
        
        updates.push({
          framework: framework.name,
          stars: repoData.stars,
          success: true,
        });
      } catch (error) {
        console.error(`Error updating GitHub metrics for ${framework.name}:`, error);
        updates.push({
          framework: framework.name,
          error: String(error),
          success: false,
        });
      }
    }
    
    return { updates };
  },
});

/**
 * Updates PyPI download metrics for frameworks
 */
export const updatePyPIMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get frameworks with current PyPI downloads (as a proxy to identify Python packages)
    const frameworks = await ctx.db
      .query("frameworks")
      .filter((q) => q.gt(q.field("currentPypiDownloads"), 0))
      .collect();
    
    const updates = [];
    
    for (const framework of frameworks) {
      try {
        // Extract package name from GitHub repo path or use custom mapping
        // This is a simplification; in a real app, you might have a packageName field
        const repoPath = framework.repoPath;
        let packageName = repoPath.split('/')[1]?.toLowerCase();
        
        // Handle special cases
        if (repoPath === "langchain-ai/langchain") {
          packageName = "langchain";
        } else if (repoPath === "run-llama/llama_index") {
          packageName = "llama-index";
        }
        
        if (!packageName) continue;
        
        // Fetch latest download stats
        const downloadData = await fetchPypiDownloadStats(
          { convex: ctx.runQuery, convexImport: ctx.runAction },
          { packageName }
        );
        
        if (!downloadData) continue;
        
        // Update the framework with latest metrics
        await ctx.db.patch(framework._id, {
          currentPypiDownloads: downloadData.downloads,
        });
        
        // Update the metrics snapshot
        // Find if there's a snapshot from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Math.floor(today.getTime() / 1000);
        
        const existingSnapshots = await ctx.db
          .query("metricsSnapshots")
          .withIndex("by_framework_and_timestamp", (q) => 
            q.eq("frameworkId", framework._id)
              .gte("timestamp", todayTimestamp)
          )
          .collect();
        
        if (existingSnapshots.length > 0) {
          // Update existing snapshot
          await ctx.db.patch(existingSnapshots[0]._id, {
            pypiDownloads: downloadData.downloads,
          });
        } else {
          // Create new snapshot
          await ctx.db.insert("metricsSnapshots", {
            frameworkId: framework._id,
            timestamp: Math.floor(Date.now() / 1000),
            pypiDownloads: downloadData.downloads,
          });
        }
        
        updates.push({
          framework: framework.name,
          downloads: downloadData.downloads,
          success: true,
        });
      } catch (error) {
        console.error(`Error updating PyPI metrics for ${framework.name}:`, error);
        updates.push({
          framework: framework.name,
          error: String(error),
          success: false,
        });
      }
    }
    
    return { updates };
  },
});

/**
 * Updates npm download metrics for frameworks
 */
export const updateNpmMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get frameworks with current npm downloads (as a proxy to identify JavaScript packages)
    const frameworks = await ctx.db
      .query("frameworks")
      .filter((q) => q.gt(q.field("currentNpmDownloads"), 0))
      .collect();
    
    const updates = [];
    
    for (const framework of frameworks) {
      try {
        // Extract package name from GitHub repo path or use custom mapping
        // This is a simplification; in a real app, you might have a packageName field
        const repoPath = framework.repoPath;
        let packageName = repoPath.split('/')[1]?.toLowerCase();
        
        // Handle special cases
        if (repoPath === "langchain-ai/langchainjs") {
          packageName = "langchain";
        }
        
        if (!packageName) continue;
        
        // Fetch latest download stats
        const downloadData = await fetchNpmDownloadStats(
          { convex: ctx.runQuery, convexImport: ctx.runAction },
          { packageName }
        );
        
        if (!downloadData) continue;
        
        // Update the framework with latest metrics
        await ctx.db.patch(framework._id, {
          currentNpmDownloads: downloadData.downloads,
        });
        
        // Update the metrics snapshot
        // Find if there's a snapshot from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Math.floor(today.getTime() / 1000);
        
        const existingSnapshots = await ctx.db
          .query("metricsSnapshots")
          .withIndex("by_framework_and_timestamp", (q) => 
            q.eq("frameworkId", framework._id)
              .gte("timestamp", todayTimestamp)
          )
          .collect();
        
        if (existingSnapshots.length > 0) {
          // Update existing snapshot
          await ctx.db.patch(existingSnapshots[0]._id, {
            npmDownloads: downloadData.downloads,
          });
        } else {
          // Create new snapshot
          await ctx.db.insert("metricsSnapshots", {
            frameworkId: framework._id,
            timestamp: Math.floor(Date.now() / 1000),
            npmDownloads: downloadData.downloads,
          });
        }
        
        updates.push({
          framework: framework.name,
          downloads: downloadData.downloads,
          success: true,
        });
      } catch (error) {
        console.error(`Error updating npm metrics for ${framework.name}:`, error);
        updates.push({
          framework: framework.name,
          error: String(error),
          success: false,
        });
      }
    }
    
    return { updates };
  },
});

/**
 * Updates trending scores for all frameworks
 */
export const updateTrendingScores = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all frameworks
    const frameworks = await ctx.db.query("frameworks").collect();
    
    const now = Math.floor(Date.now() / 1000);
    const oneMonthAgo = now - 30 * 24 * 60 * 60; // 30 days ago
    
    const updates = [];
    
    for (const framework of frameworks) {
      try {
        // Get the latest metrics snapshot
        const latestSnapshots = await ctx.db
          .query("metricsSnapshots")
          .withIndex("by_framework_and_timestamp", (q) => 
            q.eq("frameworkId", framework._id)
          )
          .order("desc")
          .take(1);
        
        // Get a snapshot from around 30 days ago for comparison
        const historicalSnapshots = await ctx.db
          .query("metricsSnapshots")
          .withIndex("by_framework_and_timestamp", (q) => 
            q.eq("frameworkId", framework._id)
              .lte("timestamp", oneMonthAgo)
          )
          .order("desc")
          .take(1);
        
        if (latestSnapshots.length === 0) continue;
        
        const latestSnapshot = latestSnapshots[0];
        const historicalSnapshot = historicalSnapshots.length > 0 ? historicalSnapshots[0] : null;
        
        // Calculate trending score
        const currentValues = {
          githubStars: framework.currentStars,
          pypiDownloads: framework.currentPypiDownloads,
          npmDownloads: framework.currentNpmDownloads,
          lastCommitTimestamp: framework.lastCommitTimestamp,
        };
        
        const previousValues = historicalSnapshot ? {
          githubStars: historicalSnapshot.githubStars,
          pypiDownloads: historicalSnapshot.pypiDownloads,
          npmDownloads: historicalSnapshot.npmDownloads,
          lastCommitTimestamp: historicalSnapshot.githubLastCommitTimestamp,
        } : {
          githubStars: framework.currentStars ? Math.floor(framework.currentStars * 0.9) : undefined,
          pypiDownloads: framework.currentPypiDownloads ? Math.floor(framework.currentPypiDownloads * 0.9) : undefined,
          npmDownloads: framework.currentNpmDownloads ? Math.floor(framework.currentNpmDownloads * 0.9) : undefined,
          lastCommitTimestamp: framework.lastCommitTimestamp ? framework.lastCommitTimestamp - 30 * 24 * 60 * 60 : undefined,
        };
        
        const trendingScore = await calculateTrendingScore(
          { convex: ctx.runQuery, convexImport: ctx.runAction },
          {
            frameworkId: framework._id,
            currentSnapshots: currentValues,
            previousSnapshots: previousValues,
          }
        );
        
        // Update framework with new trending score
        await ctx.db.patch(framework._id, {
          trendingScore,
        });
        
        updates.push({
          framework: framework.name,
          trendingScore,
          success: true,
        });
      } catch (error) {
        console.error(`Error updating trending score for ${framework.name}:`, error);
        updates.push({
          framework: framework.name,
          error: String(error),
          success: false,
        });
      }
    }
    
    return { updates };
  },
});
