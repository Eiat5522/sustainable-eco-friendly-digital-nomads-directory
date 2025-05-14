This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🎭 Testing

This project uses Playwright for end-to-end testing. Our test suite covers:

- Map integration and interactions
- Listing filters and search
- Mobile responsiveness
- API integration
- Error handling

### Running Tests

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/map-integration.spec.ts

# Run tests in debug mode
npm run test:debug
```

### Test Documentation

For detailed information about our testing setup, please refer to:

- [Testing Overview](tests/TESTING.md)
- [Test Writing Guide](tests/WRITING_GUIDE.md)
- [API Mocking Guide](tests/API-MOCKING.md)
- [Test Utilities](tests/utils/README.md)

### Continuous Integration

Tests run automatically on:

- Pull request creation/updates
- Merges to main branch
- Manual trigger via GitHub Actions

For more details about our testing strategy and implementation, see the documentation in the `tests` directory.
