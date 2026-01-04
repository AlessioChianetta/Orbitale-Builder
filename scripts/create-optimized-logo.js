import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'client', 'public', 'images');

async function createOptimizedLogos() {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Create a simple placeholder logo (96x96)
    const logoBuffer = await sharp({
      create: {
        width: 96,
        height: 96,
        channels: 4,
        background: { r: 59, g: 130, b: 246, alpha: 1 } // Blue color
      }
    })
    .composite([{
      input: Buffer.from(
        '<svg width="96" height="96"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="48" font-weight="bold" fill="white">L</text></svg>'
      ),
      top: 0,
      left: 0,
    }])
    .png()
    .toBuffer();

    // Create 1x versions (96x96)
    const webp1x = await sharp(logoBuffer)
      .resize(96, 96)
      .webp({ quality: 85 })
      .toFile(path.join(OUTPUT_DIR, 'logo-optimized.webp'));
    
    const avif1x = await sharp(logoBuffer)
      .resize(96, 96)
      .avif({ quality: 80 })
      .toFile(path.join(OUTPUT_DIR, 'logo-optimized.avif'));

    // Create 2x versions for retina (192x192)
    const logoBuffer2x = await sharp({
      create: {
        width: 192,
        height: 192,
        channels: 4,
        background: { r: 59, g: 130, b: 246, alpha: 1 }
      }
    })
    .composite([{
      input: Buffer.from(
        '<svg width="192" height="192"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="96" font-weight="bold" fill="white">L</text></svg>'
      ),
      top: 0,
      left: 0,
    }])
    .png()
    .toBuffer();

    const webp2x = await sharp(logoBuffer2x)
      .resize(192, 192)
      .webp({ quality: 85 })
      .toFile(path.join(OUTPUT_DIR, 'logo-optimized@2x.webp'));
    
    const avif2x = await sharp(logoBuffer2x)
      .resize(192, 192)
      .avif({ quality: 80 })
      .toFile(path.join(OUTPUT_DIR, 'logo-optimized@2x.avif'));

    // Create PNG fallback
    const png1x = await sharp(logoBuffer)
      .resize(96, 96)
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(OUTPUT_DIR, 'logo-optimized.png'));

    console.log('✅ Logo optimization complete!');
    console.log(`📦 WebP 1x: ${(webp1x.size / 1024).toFixed(2)} KB`);
    console.log(`📦 WebP 2x: ${(webp2x.size / 1024).toFixed(2)} KB`);
    console.log(`📦 AVIF 1x: ${(avif1x.size / 1024).toFixed(2)} KB`);
    console.log(`📦 AVIF 2x: ${(avif2x.size / 1024).toFixed(2)} KB`);
    console.log(`📦 PNG 1x: ${(png1x.size / 1024).toFixed(2)} KB`);
    
    const totalSize = webp1x.size + webp2x.size + avif1x.size + avif2x.size + png1x.size;
    console.log(`📊 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`💾 Savings from 981.6 KB: ${(981.6 - totalSize / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Error creating optimized logos:', error);
    process.exit(1);
  }
}

createOptimizedLogos();
