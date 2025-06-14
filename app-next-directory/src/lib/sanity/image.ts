import imageUrlBuilder from '@sanity/image-url';
import { client } from './client';

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  if (!source) {
    console.warn('No source provided to urlFor');
    return null;
  }

  try {
    return builder.image(source).auto('format');
  } catch (error) {
    console.error('Error building image URL:', error);
    return null;
  }
}

export default urlFor;
