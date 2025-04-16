import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Calculates a trending score for a framework based on recent metrics changes
 * 
 * The score is calculated based on:
 * - Recent GitHub stars growth rate
 * - Recent download count changes (PyPI and npm)
 * - Recent commit activity
 * 
 * @param frameworkId - The ID of the framework
 * @param currentSnapshots - Current metric values
 * @param previousSnapshots - Previous metric values from comparison period
 * @returns Calculated trending score between 0-100
 */
export const calculateTrendingScore = action({
  args: {
    frameworkId: v.id("frameworks"),
    currentSnapshots: v.object({
      githubStars: v.optional(v.number()),
      pypiDownloads: v.optional(v.number()),
      npmDownloads: v.optional(v.number()),
      lastCommitTimestamp: v.optional(v.number()),
    }),
    previousSnapshots: v.object({
      githubStars: v.optional(v.number()),
      pypiDownloads: v.optional(v.number()),
      npmDownloads: v.optional(v.number()),
      lastCommitTimestamp: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { currentSnapshots, previousSnapshots } = args;
    
    try {
      // Calculate GitHub stars growth
      let starsScore = 0;
      if (currentSnapshots.githubStars && previousSnapshots.githubStars) {
        const starsDiff = currentSnapshots.githubStars - previousSnapshots.githubStars;
        const starsGrowthRate = previousSnapshots.githubStars > 0 
          ? (starsDiff / previousSnapshots.githubStars) * 100 
          : 0;
          
        // Scale stars growth to a 0-40 score component (stars are heavily weighted)
        starsScore = Math.min(40, starsGrowthRate * 4);
      }
      
      // Calculate PyPI downloads growth
      let pypiScore = 0;
      if (currentSnapshots.pypiDownloads && previousSnapshots.pypiDownloads) {
        const pypiDiff = currentSnapshots.pypiDownloads - previousSnapshots.pypiDownloads;
        const pypiGrowthRate = previousSnapshots.pypiDownloads > 0 
          ? (pypiDiff / previousSnapshots.pypiDownloads) * 100 
          : 0;
          
        // Scale PyPI growth to a 0-25 score component
        pypiScore = Math.min(25, pypiGrowthRate * 2.5);
      }
      
      // Calculate npm downloads growth
      let npmScore = 0;
      if (currentSnapshots.npmDownloads && previousSnapshots.npmDownloads) {
        const npmDiff = currentSnapshots.npmDownloads - previousSnapshots.npmDownloads;
        const npmGrowthRate = previousSnapshots.npmDownloads > 0 
          ? (npmDiff / previousSnapshots.npmDownloads) * 100 
          : 0;
          
        // Scale npm growth to a 0-25 score component
        npmScore = Math.min(25, npmGrowthRate * 2.5);
      }
      
      // Calculate commit recency score
      let commitScore = 0;
      if (currentSnapshots.lastCommitTimestamp) {
        const now = Date.now() / 1000; // Current time in seconds
        const daysSinceLastCommit = (now - currentSnapshots.lastCommitTimestamp) / (60 * 60 * 24);
        
        // More recent commits get higher scores
        // 0-7 days: 10-5 points
        // 8-30 days: 5-2 points
        // 31-90 days: 2-1 points
        // 90+ days: 0 points
        if (daysSinceLastCommit <= 7) {
          commitScore = 10 - (daysSinceLastCommit / 7) * 5;
        } else if (daysSinceLastCommit <= 30) {
          commitScore = 5 - ((daysSinceLastCommit - 7) / 23) * 3;
        } else if (daysSinceLastCommit <= 90) {
          commitScore = 2 - ((daysSinceLastCommit - 30) / 60);
        }
      }
      
      // Calculate final trending score (0-100)
      const totalScore = starsScore + pypiScore + npmScore + commitScore;
      
      // Normalize to 0-100 scale
      return Math.min(100, Math.max(0, totalScore));
    } catch (error) {
      console.error("Error calculating trending score:", error);
      return 0;
    }
  },
});
