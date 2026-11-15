import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { test } from 'node:test'

// Keep the shared dropdown standard in place when new screens are added.
test('application selectors use AppSelect rather than native or legacy controls', async () => {
  const root = fileURLToPath(new URL('../app/', import.meta.url))
  const violations = []
  const walk = async directory => {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name)
      if (item.isDirectory()) await walk(file)
      else if (file.endsWith('.vue') && /<(?:select|v-select|v-autocomplete|CustomSelect)\b/.test(await readFile(file, 'utf8'))) violations.push(path.relative(root, file))
    }
  }
  await walk(root)
  assert.deepEqual(violations, [], 'Use AppSelect for new or changed selection controls')
})
