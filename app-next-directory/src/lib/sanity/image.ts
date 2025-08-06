import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { client } from './client'

const builder = imageUrlBuilder(client)

export const urlFor = (source: SanityImageSource) => {
  // Handle mock data or direct URLs
  if (source && typeof source === 'object' && 'asset' in source) {
    const asset = source.asset as any;
    if (asset && typeof asset === 'object' && 'url' in asset && typeof asset.url === 'string') {
      // Return a mock builder-like object for direct URLs
      return {
        width: (w: number) => ({ 
          height: (h: number) => ({ 
            fit: (f: string) => ({ 
              auto: (a: string) => ({ 
                url: () => asset.url 
              }) 
            }) 
          }) 
        }),
        url: () => asset.url
      };
    }
  }
  
  try {
    return builder.image(source);
  } catch (error) {
    console.warn('Failed to build image URL, using fallback:', error);
    // Return a fallback builder-like object
    return {
      width: (w: number) => ({ 
        height: (h: number) => ({ 
          fit: (f: string) => ({ 
            auto: (a: string) => ({ 
              url: () => 'https://via.placeholder.com/800x600/22c55e/ffffff?text=No+Image' 
            }) 
          }) 
        }) 
      }),
      url: () => 'https://via.placeholder.com/800x600/22c55e/ffffff?text=No+Image'
    };
  }
}

export default urlFor
