import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fetches GitHub repository data including stars count and last commit timestamp
 * @param repoPath - The repository path in format "owner/repo"
 * @returns The repository data with stars count and last commit timestamp
 */
export const fetchRepositoryData = action({
  args: {
    repoPath: v.string(),
  },
  handler: async (ctx, args) => {
    const { repoPath } = args;
    
    try {
      // Get GitHub API token from environment variables
      const githubToken = process.env.GITHUB_API_TOKEN;
      
      // Prepare headers for GitHub API
      const headers: HeadersInit = {
        "Accept": "application/vnd.github.v3+json",
      };
      
      // Add authorization header if token is available
      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`;
      }
      
      // Fetch repository data
      const repoResponse = await fetch(`https://api.github.com/repos/${repoPath}`, {
        headers,
      });
      
      if (!repoResponse.ok) {
        throw new Error(`GitHub API error: ${repoResponse.status} ${await repoResponse.text()}`);
      }
      
      const repoData = await repoResponse.json();
      
      // Fetch last commit data for default branch
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${repoPath}/commits?per_page=1&sha=${repoData.default_branch}`,
        { headers }
      );
      
      if (!commitsResponse.ok) {
        throw new Error(`GitHub API error: ${commitsResponse.status} ${await commitsResponse.text()}`);
      }
      
      const commitsData = await commitsResponse.json();
      const lastCommitData = commitsData.length > 0 ? commitsData[0] : null;
      
      // Extract the timestamp from the last commit
      let lastCommitTimestamp = null;
      if (lastCommitData && lastCommitData.commit && lastCommitData.commit.committer) {
        const commitDate = new Date(lastCommitData.commit.committer.date);
        lastCommitTimestamp = commitDate.getTime() / 1000; // Convert to Unix timestamp
      }
      
      return {
        stars: repoData.stargazers_count,
        lastCommitTimestamp,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        description: repoData.description,
        language: repoData.language,
      };
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      throw error;
    }
  },
});
