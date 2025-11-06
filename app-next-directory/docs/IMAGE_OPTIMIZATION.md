# Image Optimization Integration

## Overview

This document describes the image optimization integration implemented as part of Task 9. The system automatically optimizes images during upload to Sanity CMS.

## Architecture

### Components

1. **`src/lib/image-optimizer.ts`**: Core optimization module
   - Wraps the Python `batch_optimize_images.py` script
   - Provides Node.js interface for image optimization
   - Handles temporary file management and cleanup

2. **`app/api/upload/route.ts`**: Upload API endpoint
   - Receives image uploads from clients
   - Applies optimization before Sanity upload
   - Returns optimization metadata in response

3. **`listings/batch_optimize_images.py`**: Python optimization script
   - Uses Pillow (PIL) for image processing
   - Converts images to WebP format
   - Applies resizing and compression

## Features

### Automatic Optimization
- Images are automatically optimized during upload
- No manual intervention required
- Transparent to the end user

### Graceful Fallback
- If Python/Pillow is not available, uploads proceed with original images
- If optimization fails, the original image is uploaded
- System never blocks uploads due to optimization issues

### Configurable Settings
Default configuration:
```typescript
{
  maxWidth: 1600,
  maxHeight: 1200,
  quality: 85,
  format: 'webp'
}
```

### Optimization Metadata
The upload API returns metadata about the optimization:
```json
{
  "asset": { ... },
  "optimization": {
    "applied": true,
    "originalSize": 10000,
    "optimizedSize": 5000
  }
}
```

## Installation

### Prerequisites

1. **Python 3.x**
   ```bash
   python3 --version
   ```

2. **Pillow library**
   ```bash
   pip3 install Pillow
   ```

   Or use the project's requirements.txt:
   ```bash
   pip3 install -r requirements.txt
   ```

### Verification

To verify the optimization system is working:

```bash
# Check Python availability
python3 -c "from PIL import Image; print('Pillow installed')"
```

## Usage

### API Endpoint

```typescript
POST /api/upload

Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body:
  file: <image file>

Response:
{
  "asset": {
    "_id": "image-asset-1",
    "url": "https://cdn.sanity.io/images/..."
  },
  "optimization": {
    "applied": boolean,
    "originalSize": number,
    "optimizedSize": number
  }
}
```

### Programmatic Usage

```typescript
import { optimizeFileBuffer } from '@/lib/image-optimizer';

const buffer = Buffer.from(await file.arrayBuffer());
const result = await optimizeFileBuffer(buffer, file.name, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 90,
  format: 'webp'
});

if (result.success) {
  console.log('Optimized:', result.optimizedPath);
  console.log('Saved:', result.originalSize - result.optimizedSize, 'bytes');
}
```

## Testing

### Unit Tests

Run the image optimizer tests:
```bash
pnpm test:unit -- src/lib/__tests__/image-optimizer
```

Run the upload API tests:
```bash
pnpm test:unit -- app/api/upload
```

### Manual Testing

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Upload an image through the UI (requires venue owner role)

3. Check the console for optimization logs:
   - `✅ Using optimized image: test.jpg → test.webp`
   - `⚠️ Optimization skipped, using original file: ...`

4. Verify the image in Sanity CMS

## Performance

### Optimization Time
- Typical optimization: 2-5 seconds per image
- Depends on original image size and server resources

### Size Reduction
- Average compression: 40-60% size reduction
- WebP format typically 25-35% smaller than JPEG
- Quality setting of 85 provides good balance

### Limits
- Maximum file size: 50MB (validated before optimization)
- Timeout: 30 seconds per optimization
- Supported formats: JPEG, PNG, WebP, GIF

## Troubleshooting

### Optimization Not Working

1. **Check Python availability**
   ```bash
   python3 --version
   ```

2. **Check Pillow installation**
   ```bash
   python3 -c "from PIL import Image; print('OK')"
   ```

3. **Check logs**
   Look for warnings in the console:
   - `⚠️ Python or Pillow not available, skipping optimization`
   - `❌ Python optimization failed: ...`

### Common Issues

#### "Python not found"
- Install Python 3.x
- Ensure `python3` is in PATH

#### "Module 'PIL' not found"
- Install Pillow: `pip3 install Pillow`

#### "Optimization timeout"
- Image too large or server too slow
- System will fallback to original image

## Production Deployment

### Environment Setup

1. **Install Python dependencies**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Verify installation in deployment script**
   ```bash
   python3 -c "from PIL import Image" || echo "Warning: Pillow not installed"
   ```

### Monitoring

Monitor these metrics:
- Optimization success rate
- Average optimization time
- Size reduction statistics
- Fallback frequency

### Alternative: Sharp Library

For environments where Python is not available, consider migrating to Sharp:

```typescript
import sharp from 'sharp';

async function optimizeWithSharp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
```

Benefits:
- No Python dependency
- Faster performance (native bindings)
- Better Node.js integration

## Future Enhancements

1. **Batch processing**: Optimize multiple images concurrently
2. **CDN integration**: Pre-generate multiple sizes
3. **AVIF support**: Use AVIF format for even better compression
4. **Smart quality**: Adjust quality based on image content
5. **Progress tracking**: Real-time progress for large files
6. **Background jobs**: Move optimization to queue for faster uploads

## References

- Pillow documentation: https://pillow.readthedocs.io/
- WebP format: https://developers.google.com/speed/webp
- Sanity image API: https://www.sanity.io/docs/image-urls
- Sharp library: https://sharp.pixelplumbing.com/
