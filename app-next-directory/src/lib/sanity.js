import { builder, client, getClient, previewClient, sanityFetch, urlFor } from './sanity/client';

export { client, previewClient, getClient, urlFor, builder, sanityFetch };

const sanityClientExports = {
  client,
  previewClient,
  getClient,
  urlFor,
  builder,
  sanityFetch,
};

export default sanityClientExports;
