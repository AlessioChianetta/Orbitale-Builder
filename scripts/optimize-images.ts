#!/usr/bin/env tsx

/**
 * Image Optimization Script
 * 
 * Automatically converts images to WebP and AVIF formats with multiple responsive sizes.
 * 
 * Usage:
 *   npm run optimize-images
 *   or
 *   tsx scripts/optimize-images.ts
 * 
 * Features:
 * - Converts PNG/JPG to WebP and AVIF
 * - Generates multiple responsive sizes (320w, 640w, 1024w, 1920w)
 * - Preserves aspect ratios
 * - Optimizes file sizes aggressively
 * - Saves to /public/images/optimized/
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Responsive sizes to generate
const SIZES = [320, 640, 768, 1024, 1280, 1920];

// Supported input formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../client/public/images/optimized');

interface OptimizationStats {
  original: number;
  webp: number;
  avif: number;
  savings: number;
}

async function ensureDirectoryExists(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function getFileSizeInKB(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return Math.round(stats.size / 1024);
  } catch {
    return 0;
  }
}

async function optimizeImage(
  inputPath: string,
  outputBaseName: string
): Promise<OptimizationStats> {
  const stats: OptimizationStats = {
    original: 0,
    webp: 0,
    avif: 0,
    savings: 0,
  };

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    stats.original = await getFileSizeInKB(inputPath);
    
    console.log(`\n📷 Processing: ${path.basename(inputPath)}`);
    console.log(`   Original size: ${stats.original} KB`);
    console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);

    // Generate responsive sizes
    for (const size of SIZES) {
      // Skip if size is larger than original
      if (metadata.width && size > metadata.width) continue;

      const resizedImage = image.clone().resize(size, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });

      // Generate WebP
      const webpPath = path.join(
        OUTPUT_DIR,
        `${outputBaseName}-${size}w.webp`
      );
      await resizedImage
        .webp({ quality: 85, effort: 6 })
        .toFile(webpPath);

      // Generate AVIF (smaller but slower to encode)
      const avifPath = path.join(
        OUTPUT_DIR,
        `${outputBaseName}-${size}w.avif`
      );
      await resizedImage
        .avif({ quality: 80, effort: 4 })
        .toFile(avifPath);

      console.log(`   ✅ Generated ${size}w variants`);
    }

    // Get sizes of largest variants for comparison
    const largestSize = SIZES[SIZES.length - 1];
    stats.webp = await getFileSizeInKB(
      path.join(OUTPUT_DIR, `${outputBaseName}-${largestSize}w.webp`)
    );
    stats.avif = await getFileSizeInKB(
      path.join(OUTPUT_DIR, `${outputBaseName}-${largestSize}w.avif`)
    );
    
    stats.savings = Math.round(((stats.original - stats.webp) / stats.original) * 100);

    console.log(`   💾 WebP: ${stats.webp} KB (${stats.savings}% smaller)`);
    console.log(`   💾 AVIF: ${stats.avif} KB (${Math.round(((stats.original - stats.avif) / stats.original) * 100)}% smaller)`);

    return stats;
  } catch (error) {
    console.error(`   ❌ Error processing ${inputPath}:`, error);
    throw error;
  }
}

async function findImages(dir: string): Promise<string[]> {
  const images: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subImages = await findImages(fullPath);
        images.push(...subImages);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_FORMATS.includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return images;
}

async function main() {
  console.log('🚀 Starting image optimization...\n');

  // Ensure output directory exists
  await ensureDirectoryExists(OUTPUT_DIR);

  // Find all images in public directory
  const publicDir = path.join(__dirname, '../client/public');
  const images = await findImages(publicDir);

  // Filter out already optimized images
  const imagesToOptimize = images.filter(
    img => !img.includes('/optimized/')
  );

  if (imagesToOptimize.length === 0) {
    console.log('✅ No images found to optimize');
    return;
  }

  console.log(`Found ${imagesToOptimize.length} images to optimize\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const imagePath of imagesToOptimize) {
    const relativePath = path.relative(publicDir, imagePath);
    const parsedPath = path.parse(relativePath);
    const outputBaseName = path.join(
      parsedPath.dir,
      parsedPath.name
    ).replace(/[\/\\]/g, '-');

    try {
      const stats = await optimizeImage(imagePath, outputBaseName);
      totalOriginal += stats.original;
      totalOptimized += stats.webp;
    } catch (error) {
      console.error(`Failed to optimize ${imagePath}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Total original size: ${totalOriginal} KB`);
  console.log(`   Total optimized size: ${totalOptimized} KB`);
  console.log(`   Total savings: ${totalOriginal - totalOptimized} KB (${Math.round(((totalOriginal - totalOptimized) / totalOriginal) * 100)}%)`);
  console.log(`\n✅ Optimization complete!`);
  console.log(`   Optimized images saved to: client/public/images/optimized/`);
}

main().catch(console.error);
