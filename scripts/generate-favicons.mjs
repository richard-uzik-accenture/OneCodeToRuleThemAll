import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const svg = readFileSync(path.join(publicDir, 'favicon.svg'))

const targets = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, file))
  console.log(`wrote ${file} (${size}x${size})`)
}

// maskable icon: same mark, but padded so it survives a circular safe-zone crop
// (Android adaptive icons crop ~10% margin on each side)
const maskableSize = 512
const safeMargin = Math.round(maskableSize * 0.1)
await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: '#171335',
  },
})
  .composite([
    {
      input: await sharp(svg, { density: 384 })
        .resize(maskableSize - safeMargin * 2, maskableSize - safeMargin * 2)
        .toBuffer(),
      top: safeMargin,
      left: safeMargin,
    },
  ])
  .png()
  .toFile(path.join(publicDir, 'icon-512-maskable.png'))
console.log('wrote icon-512-maskable.png (512x512, padded for safe zone)')
