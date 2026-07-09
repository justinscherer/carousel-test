/**
 * Pulls every "real" image (as opposed to icons/flags/OOUI glyphs) out of a
 * rendered `.mw-parser-output` subtree for display in `ArticleImageCarousel`.
 *
 * "Real" is decided by the `<img>` tag's own `width`/`height` attributes,
 * which Parsoid `page/html` sets to the rendered thumbnail size (e.g.
 * `width="250" height="167"` for a photo vs `width="10" height="10"` for an
 * OOUI icon). That's synchronous and stable, unlike `naturalWidth` /
 * `getBoundingClientRect`, which depend on the image finishing its network
 * load or on layout that hasn't happened yet.
 *
 * Infobox images are excluded — they're already visible above the fold on
 * mobile in most languages, so pulling them into the carousel too would be
 * redundant. This also means an infobox's lead photo doesn't count toward
 * the minimum-image gallery threshold (see `randomArticle.ts`).
 */

const MIN_DIMENSION = 50

export interface CarouselImage {
  src: string
  srcset?: string
  alt: string
  caption?: string
}

function readDimension(img: HTMLImageElement, attr: 'width' | 'height'): number {
  const fromAttr = Number(img.getAttribute(attr))
  if (Number.isFinite(fromAttr) && fromAttr > 0) return fromAttr
  return attr === 'width' ? img.naturalWidth : img.naturalHeight
}

function captionFor(img: HTMLImageElement): string | undefined {
  const figcaption = img.closest('figure')?.querySelector('figcaption')
  const text = figcaption?.textContent?.trim()
  return text || undefined
}

export function extractCarouselImages(root: HTMLElement): CarouselImage[] {
  const images: CarouselImage[] = []
  const seenSrc = new Set<string>()

  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (img.closest('table.infobox')) return

    const width = readDimension(img, 'width')
    const height = readDimension(img, 'height')
    if (width <= MIN_DIMENSION && height <= MIN_DIMENSION) return

    // The literal `src` attribute first, not `currentSrc`: `currentSrc` is
    // empty until the browser's responsive-image selection algorithm runs,
    // then can resolve to a *different* srcset entry than whatever this
    // image was displayed at when first extracted (e.g. a higher-res entry
    // once actually decoded) — an unstable key for later re-matching this
    // same `<img>` (see ArticleRenderer.vue's "scroll to image" handler).
    const src = img.getAttribute('src') || img.currentSrc || ''
    if (!src || seenSrc.has(src)) return
    seenSrc.add(src)

    const caption = captionFor(img)

    images.push({
      src,
      srcset: img.getAttribute('srcset') ?? undefined,
      alt: img.getAttribute('alt') || caption || '',
      caption,
    })
  })

  return images
}
