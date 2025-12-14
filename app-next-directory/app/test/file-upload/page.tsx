import FileUploadClient from './FileUploadClient';

export default function FileUploadTestPage() {
  const isTestPageEnabled =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_PAGES === 'true';

  if (!isTestPageEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          This test page is not available in production.
        </p>
      </main>
    );
  }

  return <FileUploadClient />;
}

