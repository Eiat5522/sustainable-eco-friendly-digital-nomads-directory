declare module '@/lib/sanity' {
  export type ChainablePatch = {
    set: (patch: unknown) => ChainablePatch;
    setIfMissing: (patch: unknown) => ChainablePatch;
    append: (path: string, items: unknown[]) => ChainablePatch;
    commit: <T = unknown>(opts?: Record<string, unknown>) => Promise<T>;
  };

  export interface SanityClientLike {
    fetch: <T = unknown>(query: string, params?: Record<string, unknown>) => Promise<T | null>;
    getDocument: <T = unknown>(id: string) => Promise<T | null>;
    create: <T = unknown>(doc: T) => Promise<T>;
    createIfNotExists: <T = unknown>(doc: T) => Promise<T>;
    patch: (id: string) => ChainablePatch;
    delete: (id: string) => Promise<unknown>;
    assets: {
      upload: (type: 'image' | 'file', file: unknown) => Promise<unknown>;
    };
    transaction: () => {
      patch: (id: string, cb?: (patch: ChainablePatch) => unknown) => void;
      commit: <T = unknown>(opts?: Record<string, unknown>) => Promise<T>;
    };
  }

  export const client: SanityClientLike;

  export function getClient(usePreview?: boolean): SanityClientLike;
}
