# Production Release Plan

## 1. Quality Assurance
- [ ] **Linting**: Run `pnpm lint` to check for code style and potential errors.
- [ ] **Type Checking**: Run `pnpm check-types` to ensure TypeScript type safety.
- [ ] **Unit Tests**: Run `pnpm test:unit` to verify individual components and logic.
- [ ] **E2E Tests**: Run `pnpm test:e2e` to verify critical user flows.
- [ ] **Build Verification**: Run `pnpm build` locally to ensure the build process completes without errors.

## 2. Environment Configuration
### Next.js (Vercel)
Ensure the following environment variables are set in Vercel:
- `MONGODB_URI`: Connection string for production MongoDB.
- `NEXT_PUBLIC_SANITY_PROJECT_ID`: Your Sanity Project ID.
- `NEXT_PUBLIC_SANITY_DATASET`: `production` (or your target dataset).
- `SANITY_API_TOKEN`: Token with write access for webhooks/ISR.
- `SANITY_API_VERSION`: e.g., `2024-05-16`.
- `NEXTAUTH_URL`: The full URL of your production site (e.g., `https://your-domain.com`).
- `NEXTAUTH_SECRET`: A strong random string.
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret.
- `UPSTASH_REDIS_REST_URL`: For rate limiting.
- `UPSTASH_REDIS_REST_TOKEN`: For rate limiting.
- `REVALIDATION_TOKEN`: Secure token for ISR revalidation.
- `CONTACT_EMAIL`: Email address to receive contact form submissions.
- `RESEND_API_KEY` (Optional): If using Resend for emails.

### Sanity Studio (Sanity Cloud)
Ensure the following are configured:
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`

## 3. Deployment Preparation
- [ ] **Update Version**: Bump version in `app-next-directory/package.json` (e.g., to `1.0.0`).
- [ ] **Update Changelog**: Move `[Unreleased]` items to the new version in `docs/reference/CHANGELOG.md`.
- [ ] **Commit Changes**: Commit the version bump and changelog update.
    ```bash
    git add app-next-directory/package.json docs/reference/CHANGELOG.md
    git commit -m "chore: bump version to 1.0.0 for production release"
    ```

## 4. Deployment Steps
1.  **Sanity Studio**:
    ```bash
    cd sanity
    npx sanity deploy
    ```
2.  **Next.js App**:
    - Merge changes to `main` branch.
    - Push to GitHub.
    - Monitor Vercel deployment dashboard.

## 5. Post-Deployment Verification
- [ ] **Homepage**: Verify the homepage loads correctly.
- [ ] **Authentication**: Test login/logout functionality.
- [ ] **Directory**: Check if city listings are displayed.
- [ ] **Sanity Studio**: Verify access to the CMS.

## 6. Rollback Plan
- In case of critical failure, revert the deployment in Vercel to the previous stable deployment.
