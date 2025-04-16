import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fetches Similarweb global rank for a website
 * @param domain - The website domain (e.g., "langchain.com")
 * @returns The global rank data
 */
export const fetchGlobalRank = action({
  args: {
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const { domain } = args;
    
    try {
      // Get Similarweb API key from environment variables
      const similarwebApiKey = process.env.SIMILARWEB_API_KEY;
      
      if (!similarwebApiKey) {
        throw new Error("Similarweb API key is not configured");
      }
      
      // Fetch rank data from Similarweb API
      const response = await fetch(
        `https://api.similarweb.com/v1/website/${domain}/traffic-and-engagement/visits?api_key=${similarwebApiKey}&main_domain_only=false&granularity=monthly`
      );
      
      if (!response.ok) {
        throw new Error(`Similarweb API error: ${response.status} ${await response.text()}`);
      }
      
      const data = await response.json();
      
      // Extract global rank information
      if (!data.global_rank) {
        return { rank: null, message: "No global rank data available" };
      }
      
      return {
        rank: data.global_rank,
        domain,
      };
    } catch (error) {
      console.error("Error fetching Similarweb data:", error);
      throw error;
    }
  },
});
