export const productImageCandidates = (product, apiBase) => {
  if (!product) return []
  let origin
  try { origin = new URL(apiBase).origin } catch { origin = '' }
  const media = [...(product.media || [])].sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sorting_order || 0) - (b.sorting_order || 0))
  const paths = [product.cover_image_url, product.cover_image, ...media.flatMap(item => [item.file_url, item.file_path]), product.cover_thumbnail_url]
  const resolve = value => {
    if (typeof value !== 'string' || !value.trim()) return null
    const path = value.trim()
    if (/^https?:\/\//i.test(path)) return path
    if (path.startsWith('/assets/') || path.startsWith('/images/')) return path
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return null
    return `${origin}/storage/${path.replace(/^\/?storage\//, '').replace(/^\/+/, '')}`
  }
  return [...new Set(paths.map(resolve).filter(Boolean))]
}
