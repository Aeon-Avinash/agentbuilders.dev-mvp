import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled jobs configuration for Agentbuilders.dev
 * 
 * GitHub metrics: Runs every 12 hours
 * PyPI metrics: Runs daily
 * npm metrics: Runs daily
 * Trending scores: Runs daily after other metrics are updated
 */
const crons = cronJobs();

// GitHub stars and activity - run every 12 hours
crons.interval(
  "update-github-metrics",
  { hours: 12 },
  internal.scheduledJobs.updateGitHubMetrics,
);

// PyPI download stats - run daily
crons.interval(
  "update-pypi-metrics",
  { hours: 24 },
  internal.scheduledJobs.updatePyPIMetrics,
);

// npm download stats - run daily
crons.interval(
  "update-npm-metrics", 
  { hours: 24 },
  internal.scheduledJobs.updateNpmMetrics,
);

// Trending score calculation - run daily after metrics are updated
// Adding a 1-hour delay to ensure all metrics have been updated
crons.interval(
  "update-trending-scores",
  { hours: 24 },
  internal.scheduledJobs.updateTrendingScores,
  { runAt: { hours: 1 } } // Run at 1 AM
);

export default crons;
