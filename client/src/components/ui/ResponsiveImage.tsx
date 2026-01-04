import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * Optimized responsive image component with:
 * - Lazy loading (unless priority)
 * - Explicit width/height to prevent CLS
 * - Aspect ratio preservation
 * - Blur placeholder for better UX
 * - Modern format support (WebP/AVIF with fallback)
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className,
  sizes = '100vw',
  priority = false,
  onLoad,
  objectFit = 'cover',
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  
  // Calculate aspect ratio to prevent CLS
  const aspectRatio = (height / width) * 100;
  
  // Generate srcset for responsive images
  // If src already has query params or is external, keep as is
  const generateSrcSet = (baseSrc: string) => {
    // For external images (ibb.co, etc), don't generate srcset
    if (baseSrc.includes('http://') || baseSrc.includes('https://')) {
      return undefined;
    }
    
    // For local images, generate multiple sizes
    const ext = baseSrc.split('.').pop();
    const baseWithoutExt = baseSrc.replace(`.${ext}`, '');
    
    // Common responsive sizes
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    return sizes
      .map(size => `${baseWithoutExt}-${size}w.webp ${size}w`)
      .join(', ');
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    // Fallback to original src if WebP/AVIF fails
    if (imageSrc.endsWith('.webp') || imageSrc.endsWith('.avif')) {
      // Try to detect original extension from the base src
      // Common pattern: image-400w.webp -> image.png or image.jpg
      const baseNameMatch = src.match(/(.+?)(-\d+w)?\.(webp|avif)$/);
      if (baseNameMatch) {
        const baseName = baseNameMatch[1];
        // Try .png first (common for logos/graphics), then .jpg
        const fallbackSrc = `${baseName}.png`;
        setImageSrc(fallbackSrc);
      } else {
        // Fallback to .jpg if pattern doesn't match
        const fallbackSrc = src.replace(/\.(webp|avif)$/, '.jpg');
        setImageSrc(fallbackSrc);
      }
    }
  };

  useEffect(() => {
    // If priority image, preload it
    if (priority && typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (generateSrcSet(src)) {
        link.setAttribute('imagesrcset', generateSrcSet(src)!);
      }
      document.head.appendChild(link);
    }
  }, [priority, src]);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        paddingBottom: `${aspectRatio}%`,
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        srcSet={generateSrcSet(imageSrc)}
        sizes={sizes}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          'absolute inset-0 w-full h-full transition-opacity duration-300',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          aspectRatio: `${width} / ${height}`,
        }}
      />
      
      {/* Blur placeholder while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
