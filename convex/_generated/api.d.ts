/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as frameworks from "../frameworks.js";
import type * as lib_github from "../lib/github.js";
import type * as lib_npm from "../lib/npm.js";
import type * as lib_pypi from "../lib/pypi.js";
import type * as lib_similarweb from "../lib/similarweb.js";
import type * as lib_trending from "../lib/trending.js";
import type * as resources from "../resources.js";
import type * as scheduledJobs from "../scheduledJobs.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  crons: typeof crons;
  frameworks: typeof frameworks;
  "lib/github": typeof lib_github;
  "lib/npm": typeof lib_npm;
  "lib/pypi": typeof lib_pypi;
  "lib/similarweb": typeof lib_similarweb;
  "lib/trending": typeof lib_trending;
  resources: typeof resources;
  scheduledJobs: typeof scheduledJobs;
  seed: typeof seed;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
