/**
 * Cloudinary Helpers
 * 
 * Generates optimized Cloudinary URLs for thumbnails, HD delivery,
 * and responsive images. In production, CLOUDINARY_CLOUD_NAME and
 * CLOUDINARY_UPLOAD_PRESET would be set via environment variables.
 * 
 * For this demo, we use placeholder URLs and simulate the transformations.
 */

/* ============================================================
   Types
   ============================================================ */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'limit' | 'thumb' | 'scale';
  gravity?: 'face' | 'center' | 'auto';
  radius?: number;
  opacity?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  thumbnailUrl: string;
}

/* ============================================================
   Default Configuration (environment-driven in production)
   ============================================================ */

const DEFAULT_CONFIG: CloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo-elegance',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned-invitation',
  folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'elegant-invitations',
};

/* ============================================================
   URL Builders
   ============================================================ */

/**
 * Build a Cloudinary delivery URL with optional transformations.
 * 
 * Example:
 *   buildUrl('events/wedding/photo1', { width: 400, format: 'webp', crop: 'fill' })
 *   → https://res.cloudinary.com/demo-elegance/image/upload/c_fill,f_webp,w_400/events/wedding/photo1
 */
export function buildUrl(
  publicId: string,
  options: TransformationOptions = {}
): string {
  const { cloudName } = DEFAULT_CONFIG;
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  
  const transformations: string[] = [];

  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.radius) transformations.push(`r_${options.radius}`);
  if (options.opacity !== undefined) transformations.push(`o_${options.opacity}`);
  if (options.brightness) transformations.push(`e_brightness:${options.brightness}`);
  if (options.contrast) transformations.push(`e_contrast:${options.contrast}`);
  if (options.saturation) transformations.push(`e_saturation:${options.saturation}`);

  const transformString = transformations.length > 0
    ? transformations.join(',') + '/'
    : '';

  return `${baseUrl}/${transformString}${publicId}`;
}

/**
 * Generate a lightweight thumbnail URL for gallery grid display.
 * Uses WebP format, 400px width, and smart crop.
 */
export function buildThumbnailUrl(publicId: string, width = 400): string {
  return buildUrl(publicId, {
    width,
    crop: 'fill',
    format: 'webp',
    quality: 70,
    gravity: 'auto',
  });
}

/**
 * Generate the HD original URL for full-quality download.
 * Preserves the original format with no destructive transformations.
 */
export function buildHDUrl(publicId: string): string {
  return buildUrl(publicId, {
    quality: 95,
    format: 'jpg',
  });
}

/**
 * Generate a responsive srcset string for the <img> element.
 * Provides multiple sizes for the browser to pick the best one.
 * 
 * Example output:
 *   "https://.../w_400/id 400w,
 *    https://.../w_800/id 800w,
 *    https://.../w_1200/id 1200w"
 */
export function buildSrcset(
  publicId: string,
  widths = [400, 800, 1200],
  baseOptions: Omit<TransformationOptions, 'width'> = {}
): string {
  return widths
    .map((w) => `${buildUrl(publicId, { ...baseOptions, width: w })} ${w}w`)
    .join(',\n    ');
}

/**
 * Build a signed upload URL for direct client-side uploads.
 * In production, this would call a server-side endpoint to generate
 * a signed upload signature. For demo, returns the unsigned endpoint.
 */
export function getUploadEndpoint(): string {
  const { cloudName, uploadPreset } = DEFAULT_CONFIG;
  return `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
}

/**
 * Build the upload payload for direct client-side upload to Cloudinary.
 */
export function buildUploadPayload(
  file: File,
  folder?: string
): FormData {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', DEFAULT_CONFIG.uploadPreset ?? 'unsigned-invitation');
  if (folder) {
    formData.append('folder', `${DEFAULT_CONFIG.folder ?? 'elegant-invitations'}/${folder}`);
  } else {
    formData.append('folder', DEFAULT_CONFIG.folder ?? 'elegant-invitations');
  }
  formData.append('context', `event=elegance-demo`);
  return formData;
}

/**
 * Process an upload response from Cloudinary into our internal format.
 */
export function processUploadResponse(response: Record<string, unknown>): UploadResult {
  const publicId = response.public_id as string;
  return {
    publicId,
    secureUrl: response.secure_url as string,
    width: (response.width as number) || 0,
    height: (response.height as number) || 0,
    format: response.format as string,
    bytes: (response.bytes as number) || 0,
    thumbnailUrl: buildThumbnailUrl(publicId),
  };
}

/**
 * Build a video/audio delivery URL (for background music on invitations).
 */
export function buildMediaUrl(publicId: string): string {
  const { cloudName } = DEFAULT_CONFIG;
  return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}`;
}

/**
 * Generate a placeholder gradient URL for demo/preview purposes.
 * Used when no real Cloudinary image is available.
 */
export function getPlaceholderUrl(width: number, height: number, text?: string): string {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#F0E6D3"/>
      <text x="50%" y="50%" font-family="Georgia" font-size="16" fill="#C5A880" text-anchor="middle" dy=".3em">${text || 'Image'}</text>
    </svg>
  `);
  return `data:image/svg+xml,${svg}`;
}

/**
 * Get all Cloudinary configuration for client-side use.
 * Only exposes non-sensitive values.
 */
export function getPublicConfig(): Pick<CloudinaryConfig, 'cloudName' | 'uploadPreset' | 'folder'> {
  return {
    cloudName: DEFAULT_CONFIG.cloudName,
    uploadPreset: DEFAULT_CONFIG.uploadPreset,
    folder: DEFAULT_CONFIG.folder,
  };
}
