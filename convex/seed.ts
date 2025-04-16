import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Seeds the database with initial categories and sample frameworks
 * This function should only be run once or when needed to refresh the sample data
 */
export const seedDatabase = mutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { force = false } = args;
    
    // Check if data already exists to prevent duplicate seeding
    const existingCategories = await ctx.db.query("categories").collect();
    const existingFrameworks = await ctx.db.query("frameworks").collect();
    
    if (existingCategories.length > 0 && existingFrameworks.length > 0 && !force) {
      return {
        status: "skipped",
        message: "Database already contains data. Use force=true to reseed.",
        categoriesCount: existingCategories.length,
        frameworksCount: existingFrameworks.length,
      };
    }
    
    // Seed categories
    const categoryIds: Record<string, Id<"categories">> = {};
    
    const categories = [
      {
        name: "Full-code",
        description: "Frameworks that provide libraries and components for building AI agents through programming",
      },
      {
        name: "Low-code",
        description: "Frameworks that provide visual interfaces and abstractions but still require some coding",
      },
      {
        name: "No-code",
        description: "Platforms that allow building AI agents entirely through graphical interfaces",
      },
      {
        name: "Automation Platform",
        description: "End-to-end platforms focused on workflow automation with AI capabilities",
      },
    ];
    
    // Add categories
    for (const category of categories) {
      const categoryId = await ctx.db.insert("categories", category);
      categoryIds[category.name] = categoryId;
    }
    
    // Seed sample frameworks
    const sampleFrameworks = [
      {
        name: "LangChain",
        description: "A framework for developing applications powered by language models through composability",
        websiteUrl: "https://langchain.com",
        githubRepoUrl: "https://github.com/langchain-ai/langchain",
        repoPath: "langchain-ai/langchain",
        category: categoryIds["Full-code"],
        tags: ["Python", "JavaScript", "LLM", "RAG"],
        currentStars: 74500,
        currentPypiDownloads: 8500000,
        lastCommitTimestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      },
      {
        name: "AutoGen",
        description: "A framework for building applications using conversable agents",
        websiteUrl: "https://microsoft.github.io/autogen/",
        githubRepoUrl: "https://github.com/microsoft/autogen",
        repoPath: "microsoft/autogen",
        category: categoryIds["Full-code"],
        tags: ["Python", "LLM", "Multi-agent"],
        currentStars: 18900,
        currentPypiDownloads: 750000,
        lastCommitTimestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
      },
      {
        name: "LlamaIndex",
        description: "A data framework for building LLM applications",
        websiteUrl: "https://www.llamaindex.ai/",
        githubRepoUrl: "https://github.com/run-llama/llama_index",
        repoPath: "run-llama/llama_index",
        category: categoryIds["Full-code"],
        tags: ["Python", "LLM", "RAG", "Data"],
        currentStars: 25700,
        currentPypiDownloads: 3500000,
        lastCommitTimestamp: Math.floor(Date.now() / 1000) - 43200, // 12 hours ago
      },
      {
        name: "Langflow",
        description: "A UI for LangChain, designed to make it easy to prototype and build LLM applications",
        websiteUrl: "https://www.langflow.org/",
        githubRepoUrl: "https://github.com/langflow-ai/langflow",
        repoPath: "langflow-ai/langflow",
        category: categoryIds["Low-code"],
        tags: ["Python", "UI", "LangChain"],
        currentStars: 13200,
        currentPypiDownloads: 120000,
        lastCommitTimestamp: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
      },
      {
        name: "FlowiseAI",
        description: "Open source UI visual tool to build your customized LLM flow using LangchainJS",
        websiteUrl: "https://flowiseai.com/",
        githubRepoUrl: "https://github.com/FlowiseAI/Flowise",
        repoPath: "FlowiseAI/Flowise",
        category: categoryIds["Low-code"],
        tags: ["JavaScript", "UI", "LangChain"],
        currentStars: 18500,
        currentNpmDownloads: 250000,
        lastCommitTimestamp: Math.floor(Date.now() / 1000) - 345600, // 4 days ago
      },
      {
        name: "Airbyte Octavia",
        description: "A no-code platform for creating AI assistants",
        websiteUrl: "https://octavia.airbyte.com/",
        githubRepoUrl: "https://github.com/airbytehq/airbyte",
        repoPath: "airbytehq/airbyte",
        category: categoryIds["No-code"],
        tags: ["UI", "LLM", "Assistant"],
        currentStars: 12000,
        lastCommitTimestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      },
      {
        name: "Zapier AI",
        description: "Create AI-powered automations and workflows without code",
        websiteUrl: "https://zapier.com/ai",
        githubRepoUrl: "",
        repoPath: "",
        category: categoryIds["Automation Platform"],
        tags: ["Automation", "LLM", "Integration"],
        currentSimilarwebRank: 1500,
      },
    ];
    
    // Add frameworks
    const frameworkIds = [];
    for (const framework of sampleFrameworks) {
      const frameworkId = await ctx.db.insert("frameworks", framework);
      frameworkIds.push(frameworkId);
      
      // Add a metrics snapshot for each framework
      if (framework.currentStars || framework.currentPypiDownloads || framework.currentNpmDownloads) {
        await ctx.db.insert("metricsSnapshots", {
          frameworkId,
          timestamp: Math.floor(Date.now() / 1000),
          githubStars: framework.currentStars,
          pypiDownloads: framework.currentPypiDownloads,
          npmDownloads: framework.currentNpmDownloads,
          similarwebRank: framework.currentSimilarwebRank,
          githubLastCommitTimestamp: framework.lastCommitTimestamp,
        });
      }
    }
    
    // Add a couple of sample resources
    const resources = [
      {
        frameworkId: frameworkIds[0], // LangChain
        title: "Getting Started with LangChain",
        url: "https://python.langchain.com/docs/get_started/introduction",
        type: "Documentation",
      },
      {
        frameworkId: frameworkIds[0], // LangChain
        title: "LangChain Cookbook",
        url: "https://github.com/langchain-ai/langchain/tree/master/cookbook",
        type: "Tutorial",
      },
      {
        frameworkId: frameworkIds[1], // AutoGen
        title: "AutoGen Quickstart",
        url: "https://microsoft.github.io/autogen/docs/Getting-Started",
        type: "Documentation",
      },
    ];
    
    // Add resources
    for (const resource of resources) {
      await ctx.db.insert("resources", resource);
    }
    
    return {
      status: "success",
      message: "Database seeded successfully",
      categoriesCount: categories.length,
      frameworksCount: sampleFrameworks.length,
      resourcesCount: resources.length,
    };
  },
});
