This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🔧 Troubleshooting

### Dev Server Issues (Worker Module Errors)

**Note:** The pino-pretty worker.js MODULE_NOT_FOUND error has been fixed (as of latest commit). The logger now uses synchronous mode to avoid worker thread path resolution issues with Next.js custom distDir.

If you encounter other worker module errors or WSL disconnection issues:

```bash
# Clean build artifacts
npm run clean

# Or start with a clean slate
npm run dev:clean
```

For detailed troubleshooting, see the **[WSL Disconnection Fix Guide](../WSL_DISCONNECTION_FIX_GUIDE.md)**.

### Common Issues

- **"Cannot find module .../worker.js"**: This has been fixed for pino-pretty. For other cases, run `npm run clean` to remove corrupted build artifacts
- **WSL disconnects during dev**: Use an external terminal or see the troubleshooting guide
- **TypeScript errors**: Some errors are expected in the current codebase

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:clean` - Clean artifacts and start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run lint` - Run ESLint
- `npm run clean` - Remove build artifacts

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
