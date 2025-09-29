// app-next-directory/types/sanity.d.ts

// Original ambient module for the JS file import.
// app-next-directory/types/sanity.d.ts {
  const schema: {
    name: string;
    title: string;
    type: string;
   fields?: Array<
      name?: string;
      title?: string;
      type?: string;
      options?: unknown;
    }>;
  };
  export default schema;
}

// Cover imports without the .js extension as well.
declare module '../../../../sanity/schemas/amenities' {
  const schema: import('sanity').SchemaTypeDefinition;
  export default schema;
}

// Original ambient module for the JS file import.
declare module '../../../../sanity/schemas/amenities.js' {
  const schema: {
    name: string;
    title: string;
    type: string;
    fields?: Array<{
      name?: string;
      title?: string;
      type?: string;
      options?: unknown;
    }>;
  };
  export default schema;
}

// Cover imports without the .js extension as well.
declare module '../../../../sanity/schemas/amenities' {
  const schema: {
    name: string;
    title: string;
    type: string;
    fields?: Array<{
      name?: string;
      title?: string;
      type?: string;
      options?: unknown;
    }>;
  };
  export default schema;
}
  const schema: {
    name: string;
    title: string;
    type: string;
    fields?: Array<{
      name?: string;
      title?: string;
      type?: string;
      options?: unknown;
    }>;
  };
  export default schema;
}
