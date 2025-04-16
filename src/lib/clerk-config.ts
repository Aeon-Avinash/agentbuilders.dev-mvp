// Configuration for Clerk authentication
// Replace placeholder values with your actual Clerk settings

export const clerkPublishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY
  || 'your_clerk_publishable_key';

export const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY
  || 'your_clerk_secret_key';

export const clerkOptions = {
  // Replace with your actual domain
  domain: 'clerk.agentbuilders.dev',
  
  // Paths that don't require authentication
  publicRoutes: [
    '/',
    '/frameworks',
    '/frameworks/*',
    '/resources',
    '/resources/*',
    '/about',
    '/api/*'
  ],
  
  // Route to redirect to after sign in
  afterSignInUrl: '/',
  
  // Route to redirect to after sign up
  afterSignUpUrl: '/'
};
