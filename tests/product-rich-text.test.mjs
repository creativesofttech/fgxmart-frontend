import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sanitizeProductDescription } from '../app/utils/productRichText.js'

test('product descriptions preserve supported tags and block sizes while removing executable HTML', () => {
  const html = '<h2 style="font-size:22px;color:red" onclick="alert(1)">Title</h2><p style="font-size:14px">Body <strong>bold</strong></p><h3 style="font-size:18px">Small heading</h3><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://example.com"></iframe>'
  assert.equal(sanitizeProductDescription(html), '<h2 style="font-size:22px">Title</h2><p style="font-size:14px">Body <strong>bold</strong></p><h3 style="font-size:18px">Small heading</h3>')
  assert.equal(sanitizeProductDescription('<p style="font-size:99px;background:url(javascript:alert(1))">Safe</p>'), '<p>Safe</p>')
  assert.equal(sanitizeProductDescription('Plain description & details'), 'Plain description &amp; details')
})
