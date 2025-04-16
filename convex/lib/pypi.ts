import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fetches PyPI download statistics for a package
 * @param packageName - The PyPI package name
 * @param period - The time period to fetch downloads for (default: "month")
 * @returns The download count for the specified period
 */
export const fetchDownloadStats = action({
  args: {
    packageName: v.string(),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { packageName, period = "month" } = args;
    
    try {
      // PyPI Stats API doesn't require authentication
      const response = await fetch(
        `https://pypistats.org/api/packages/${packageName}/recent?period=${period}`
      );
      
      if (!response.ok) {
        throw new Error(`PyPI Stats API error: ${response.status} ${await response.text()}`);
      }
      
      const data = await response.json();
      
      // The API returns a data object with keys for different time periods (day, week, month)
      if (!data.data || typeof data.data[period] !== 'number') {
        throw new Error(`Invalid response format from PyPI Stats API`);
      }
      
      return {
        downloads: data.data[period],
        period,
      };
    } catch (error) {
      console.error("Error fetching PyPI download stats:", error);
      throw error;
    }
  },
});
