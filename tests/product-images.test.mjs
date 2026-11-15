import assert from 'node:assert/strict'
import { test } from 'node:test'
import { productImageCandidates } from '../app/utils/productImages.js'

test('homepage product images prioritize covers and resolve gallery files safely', () => {
  assert.deepEqual(productImageCandidates({ cover_image_url: 'https://cdn.example.test/cover.webp', cover_image: 'products/cover.webp', media: [{ file_path: 'products/secondary.webp', sorting_order: 20 }, { file_url: 'https://cdn.example.test/primary.webp', is_primary: true }] }, 'https://api.example.test/api/v1'), ['https://cdn.example.test/cover.webp', 'https://api.example.test/storage/products/cover.webp', 'https://cdn.example.test/primary.webp', 'https://api.example.test/storage/products/secondary.webp'])
  assert.deepEqual(productImageCandidates({ cover_image_url: 'javascript:alert(1)', media: [{ file_path: '/storage/products/item.webp' }] }, 'https://api.example.test/api/v1'), ['https://api.example.test/storage/products/item.webp'])
  assert.deepEqual(productImageCandidates(null, ''), [])
})
