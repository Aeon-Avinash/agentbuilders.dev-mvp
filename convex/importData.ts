import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Use HTTP module for file access
import { internalAction } from "./_generated/server";

/**
 * Import data from the agent_builders_database.json file into the Convex database
 * 
 * This function reads the JSON data and populates the Convex database
 * with categories and frameworks.
 */
export const importAgentBuilders = mutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if we already have data in the database
    const existingFrameworks = await ctx.db.query("frameworks").collect();
    const existingCategories = await ctx.db.query("categories").collect();

    if (existingFrameworks.length > 0 && !args.force) {
      console.log("Database already contains frameworks. Use force=true to override.");
      return {
        success: false,
        message: "Database already contains frameworks. Use force=true to override.",
        existingCount: existingFrameworks.length
      };
    }

    // This data would normally come from reading the file, but we'll use a hardcoded
    // sample for demonstration and debugging purposes
    const sampleData = {
      "platforms": [
        {
          "name": "Flowise",
          "website": "https://flowiseai.com/",
          "github_repo": "https://github.com/FlowiseAI/Flowise",
          "github_stars": 37200,
          "category": "Low-Code Freemium",
          "description": "An open-source low-code tool for developers to build customized LLM orchestration flows and AI agents with a drag-and-drop UI.",
          "company": "FlowiseAI, backed by Y Combinator",
          "features": [
            "Visual drag-and-drop interface for building LLM flows",
            "AI agent development with tool integration",
            "Multi-modal capabilities"
          ],
          "supported_models": [
            "Compatible with various LLMs including OpenAI models",
            "Mentions support for GPT models"
          ],
          "integrations": [
            "Integration with various document loaders",
            "Support for different vector databases"
          ],
          "deployment_options": [
            "Self-hosted (open-source)",
            "Cloud-hosted by FlowiseAI"
          ],
          "unique_selling_points": [
            "Visual drag-and-drop interface for building LLM flows",
            "AI agent development with tool integration"
          ],
          "pricing": {
            "free_tier": true,
            "pricing_model": "Subscription",
            "pricing_details": "Open-source version is free, cloud-hosted costs around $35/month"
          },
          "trend_rating": "Major",
          "active_status": true
        },
        {
          "name": "LangChain",
          "website": "https://langchain.com/",
          "github_repo": "https://github.com/langchain-ai/langchain",
          "github_stars": 65000,
          "category": "Framework Library",
          "description": "A framework for developing applications powered by language models through composability",
          "company": "LangChain AI",
          "features": [
            "LLM integration",
            "Chain and agent composition",
            "Memory management"
          ],
          "supported_models": [
            "OpenAI GPT models",
            "Anthropic Claude",
            "Multiple open source models"
          ],
          "integrations": [
            "Vector databases",
            "Document loaders",
            "APIs"
          ],
          "deployment_options": [
            "Self-hosted",
            "Cloud via LangChain+",
            "Integrations with major cloud providers"
          ],
          "unique_selling_points": [
            "Flexibility and modularity",
            "Extensive community and ecosystem"
          ],
          "pricing": {
            "free_tier": true,
            "pricing_model": "Freemium",
            "pricing_details": "Open-source library is free, cloud services are paid"
          },
          "trend_rating": "Major",
          "active_status": true
        }
      ]
    };

    try {
      const data = sampleData;

      if (!data.platforms || !Array.isArray(data.platforms)) {
        throw new Error("Invalid data format: expected platforms array");
      }

      // Create a record of categories
      const categoryMap = new Map();
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.platforms.map(platform => platform.category))];
      
      // Insert categories
      for (const categoryName of uniqueCategories) {
        // Check if category already exists
        let categoryId;
        const existingCategory = existingCategories.find(cat => cat.name === categoryName);
        
        if (existingCategory) {
          categoryId = existingCategory._id;
        } else {
          categoryId = await ctx.db.insert("categories", {
            name: categoryName,
            description: `Category for ${categoryName} frameworks`
          });
        }
        
        categoryMap.set(categoryName, categoryId);
      }
      
      // Insert frameworks
      for (const platform of data.platforms) {
        // Get the category ID
        const categoryId = categoryMap.get(platform.category);
        
        if (!categoryId) {
          console.warn(`Category not found for platform ${platform.name}`);
          continue;
        }
        
        // Extract GitHub repo path from full URL
        const githubRepoPath = platform.github_repo ? 
          platform.github_repo.replace("https://github.com/", "") : 
          "";
        
        // Extract tags from platform
        const tags = [];
        if (platform.company) tags.push(platform.company);
        if (platform.pricing?.pricing_model) tags.push(platform.pricing.pricing_model);
        if (platform.pricing?.free_tier) tags.push("Free");
        if (platform.description?.toLowerCase().includes("open source")) tags.push("Open Source");
        
        // Calculate trending score (simplified)
        let trendingScore = 50;
        if (platform.github_stars) {
          if (platform.github_stars > 30000) trendingScore += 25;
          else if (platform.github_stars > 10000) trendingScore += 15;
          else if (platform.github_stars > 5000) trendingScore += 10;
          else if (platform.github_stars > 1000) trendingScore += 5;
        }
        if (platform.trend_rating === "Major") trendingScore += 20;
        else if (platform.trend_rating === "Growing") trendingScore += 10;
        
        // Cap the score between 0 and 100
        trendingScore = Math.min(Math.max(trendingScore, 0), 100);
        
        // Create framework object matching the exact schema
        const frameworkData = {
          name: platform.name,
          description: platform.description || "",
          websiteUrl: platform.website || "",
          githubRepoUrl: platform.github_repo || "",
          repoPath: githubRepoPath,
          category: categoryId,
          logoUrl: "", // No logo in the source data
          tags: tags.slice(0, 5), // Limit to 5 tags
          trendingScore: trendingScore,
          lastCommitTimestamp: Date.now(),
          currentStars: platform.github_stars || 0,
          currentPypiDownloads: undefined, // No PyPI download data in sample
          currentNpmDownloads: undefined, // No npm download data in sample
          currentSimilarwebRank: undefined // No Similarweb rank data in sample
        };
        
        // Insert the framework
        await ctx.db.insert("frameworks", frameworkData);
      }
      
      return {
        success: true,
        message: `Imported ${data.platforms.length} frameworks across ${uniqueCategories.length} categories`,
        frameworksCount: data.platforms.length,
        categoriesCount: uniqueCategories.length
      };
    } catch (error) {
      console.error("Error importing data:", error);
      return {
        success: false,
        message: `Error importing data: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.toString() : String(error)
      };
    }
  }
});

/**
 * Generate resource entries for imported frameworks
 * This function creates resources linked to the frameworks in the database
 */
export const generateResources = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all frameworks
      const frameworks = await ctx.db.query("frameworks").collect();
      
      // Counter for successful inserts
      let successCount = 0;
      
      // For each framework, create a resource
      for (const framework of frameworks) {
        const resourceData = {
          frameworkId: framework._id,
          title: `Getting Started with ${framework.name}`,
          url: framework.websiteUrl,
          type: "Documentation"
        };
        
        // Insert the resource
        await ctx.db.insert("resources", resourceData);
        successCount++;
      }
      
      return {
        success: true,
        message: `Created ${successCount} resources for frameworks`,
        resourceCount: successCount
      };
    } catch (error) {
      console.error("Error generating resources:", error);
      return {
        success: false,
        message: `Error generating resources: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.toString() : String(error)
      };
    }
  }
});
