import sharp from 'sharp'
import path from 'node:path'
import { mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const inputDirectory = process.argv[2]
if (!inputDirectory) {
  console.error('Usage: npm run images:home -- "path/to/source-images"')
  process.exit(1)
}
const outputDirectory = fileURLToPath(new URL('../public/assets/images/home/', import.meta.url))
await mkdir(outputDirectory, { recursive: true })
const images = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'product-placeholder', 'card-1', 'card-2']
const results = await Promise.all(images.map(async name => {
  const source = path.resolve(inputDirectory, `${name}.png`)
  const original = await stat(source)
  const output = await sharp(source).rotate()
    .resize({ width: name.startsWith('card-') ? 1200 : name === 'product-placeholder' ? 960 : 640, withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toFile(path.join(outputDirectory, `${name}.webp`))
  return { image: `${name}.webp`, dimensions: `${output.width}x${output.height}`, originalKB: Math.round(original.size / 1000), webpKB: Math.round(output.size / 1000), saved: `${Math.round((1 - output.size / original.size) * 100)}%` }
}))
console.table(results)
