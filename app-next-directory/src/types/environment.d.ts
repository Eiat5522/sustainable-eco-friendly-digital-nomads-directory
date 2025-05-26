declare namespace NodeJS {
  interface ProcessEnv {
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    MONGODB_URI: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    NEXT_PUBLIC_SANITY_PROJECT_ID: string;
    NEXT_PUBLIC_SANITY_DATASET: string;
    SANITY_API_TOKEN: string;
  }
}
