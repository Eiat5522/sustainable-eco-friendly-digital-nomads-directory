with open('app-next-directory/src/app/listings/[slug]/page.tsx', 'r') as f:
    content = f.read()

# SonarCloud doesn't like generic async functions sometimes, especially default exports without a clear return type if it infers complex ones, or perhaps `params` isn't properly typed for React components in some NextJS setups.
# But often it's because `params` is a Promise in Next.js 15, let's check next version
