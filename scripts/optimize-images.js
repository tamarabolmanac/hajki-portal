#!/usr/bin/env node
/**
 * Optimize background images for web.
 * Reduces file size significantly (typically 7MB -> 200-400KB).
 * Run: node scripts/optimize-images.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const IMG_DIR = path.join(__dirname, "../public/img");
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;

const IMAGES_TO_OPTIMIZE = [
  "hike-landing.jpg",
  "hike-login.jpg",
  "routes-bgd.jpg",
  "create-route.jpg",
  "about-us.jpg",
  "contact.jpg",
];

async function optimizeImage(filename) {
  const inputPath = path.join(IMG_DIR, filename);
  const outputPath = path.join(IMG_DIR, filename.replace(".jpg", "-opt.jpg"));

  if (!fs.existsSync(inputPath)) {
    console.log(`⏭️  Skip ${filename} (not found)`);
    return;
  }

  const statsBefore = fs.statSync(inputPath);
  const sizeBefore = (statsBefore.size / 1024).toFixed(1);

  await sharp(inputPath)
    .resize(MAX_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(outputPath);

  const statsAfter = fs.statSync(outputPath);
  const sizeAfter = (statsAfter.size / 1024).toFixed(1);
  const savings = ((1 - statsAfter.size / statsBefore.size) * 100).toFixed(0);

  console.log(`✅ ${filename}: ${sizeBefore}KB → ${sizeAfter}KB (${savings}% smaller)`);

  // Replace original with optimized
  fs.renameSync(outputPath, inputPath);
}

async function main() {
  console.log("🖼️  Optimizing background images...\n");

  for (const filename of IMAGES_TO_OPTIMIZE) {
    try {
      await optimizeImage(filename);
    } catch (err) {
      console.error(`❌ ${filename}:`, err.message);
    }
  }

  console.log("\n✨ Done!");
}

main();
