declare module '@/lib/sanity' {
  // Minimal safe typings for the Sanity client used in tests/build checks.
  export const client: {
    fetch: (query: string, params?: Record<string, unknown>) => Promise<unknown>;
    getDocument: (id: string) => Promise<unknown>;
    create: (doc: unknown) => Promise<unknown>;
    patch: (id: string) => { set: (v: unknown) => { commit: () => Promise<unknown> } };
    delete: (id: string) => Promise<unknown>;
    assets: {
      upload: (type: 'image' | 'file', file: unknown) => Promise<unknown>;
    };
  };

  export function getClient(usePreview?: boolean): typeof client;
}
