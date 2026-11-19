import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ZipArchive } from 'archiver'
import { unzipSync, strFromU8 } from 'fflate'

test('Nitro archive dependency preserves recursive glob matching with the security override', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'fgx-archive-'))
  try {
    await mkdir(path.join(directory, 'nested'))
    await writeFile(path.join(directory, 'entry.txt'), 'root asset')
    await writeFile(path.join(directory, 'nested', 'entry.txt'), 'nested asset')
    await writeFile(path.join(directory, 'nested', 'exclude.log'), 'excluded')
    const archive = new ZipArchive()
    const chunks = []
    const completed = new Promise((resolve, reject) => {
      archive.on('data', chunk => chunks.push(chunk))
      archive.on('end', resolve)
      archive.on('error', reject)
      archive.on('warning', reject)
    })
    archive.glob('**/*.txt', { cwd: directory, nodir: true })
    await archive.finalize()
    await completed
    const files = unzipSync(Buffer.concat(chunks))
    assert.deepEqual(Object.keys(files).sort(), ['entry.txt', 'nested/entry.txt'])
    assert.equal(strFromU8(files['nested/entry.txt']), 'nested asset')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
