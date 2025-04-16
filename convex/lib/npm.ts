import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fetches npm download statistics for a package
 * @param packageName - The npm package name
 * @param period - The time period to fetch downloads for (default: "last-month")
 * @returns The download count for the specified period
 */
export const fetchDownloadStats = action({
  args: {
    packageName: v.string(),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { packageName, period = "last-month" } = args;
    
    try {
      // npm registry API doesn't require authentication
      const response = await fetch(
        `https://api.npmjs.org/downloads/point/${period}/${packageName}`
      );
      
      if (!response.ok) {
        throw new Error(`npm API error: ${response.status} ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (typeof data.downloads !== 'number') {
        throw new Error(`Invalid response format from npm API`);
      }
      
      return {
        downloads: data.downloads,
        period,
        start: data.start,
        end: data.end,
      };
    } catch (error) {
      console.error("Error fetching npm download stats:", error);
      throw error;
    }
  },
});
