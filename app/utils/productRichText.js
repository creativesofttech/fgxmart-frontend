import sanitizeHtml from 'sanitize-html'

// Product descriptions support the editor's formatting, never executable HTML.
export const sanitizeProductDescription = value => sanitizeHtml(String(value || ''), {
  allowedTags: ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'br', 'span'],
  allowedAttributes: { p: ['style'], h2: ['style'], h3: ['style'], ol: ['start'] },
  allowedStyles: { '*': { 'font-size': [/^(14|1[6-9]|2[0-2])px$/] } },
})
