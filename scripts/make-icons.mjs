/**
 * Generates the PWA icon set from public/gem-hero.png.
 *   node scripts/make-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "public/gem-hero.png");
const outDir = path.join(root, "public/icons");

fs.mkdirSync(outDir, { recursive: true });

const BG = "#07080a";

async function rounded(size, radiusRatio, { bleed = 0 } = {}) {
  const inner = Math.round(size * (1 - bleed * 2));
  const gem = await sharp(src)
    .resize(inner, inner, { fit: "cover" })
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * radiusRatio)}" fill="#fff"/></svg>`
  );

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 7, g: 8, b: 10, alpha: 1 },
    },
  })
    .composite([{ input: mask, blend: "dest-in" }, { input: gem, gravity: "center" }])
    .png()
    .toBuffer();
}

async function maskable(size) {
  // 20% safe-zone padding on a dark plate so the mask can crop freely
  const inner = Math.round(size * 0.68);
  const gem = await sharp(src).resize(inner, inner, { fit: "cover" }).toBuffer();
  const glow = Buffer.from(
    `<svg width="${size}" height="${size}">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4fd1c5" stop-opacity="0.45"/>
          <stop offset="55%" stop-color="#63b3ed" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#07080a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="#07080a"/>
      <rect width="${size}" height="${size}" fill="url(#g)"/>
    </svg>`
  );
  return sharp(glow)
    .composite([{ input: gem, gravity: "center" }])
    .png()
    .toBuffer();
}

const jobs = [
  ["icon-192.png", () => rounded(192, 0.22)],
  ["icon-512.png", () => rounded(512, 0.22)],
  ["apple-touch-icon.png", () => rounded(180, 0)],
  ["maskable-512.png", () => maskable(512)],
  ["favicon-64.png", () => rounded(64, 0.22)],
];

for (const [name, make] of jobs) {
  const buf = await make();
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log("✓", name, `${(buf.length / 1024).toFixed(1)}kb`);
}
