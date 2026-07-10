import { wikimediaApiFetchHeaders } from '@/config'
import { extractCarouselImages } from './extractCarouselImages'
import { VITAL_ARTICLE_TITLES } from './vitalArticles'

const VITAL_ARTICLE_HOST = 'en.wikipedia.org'

export interface RandomArticle {
  host: string
  title: string
}

function randomVitalArticleTitle(): string {
  const i = Math.floor(Math.random() * VITAL_ARTICLE_TITLES.length)
  return VITAL_ARTICLE_TITLES[i]
}

/** Resolves a (possibly non-canonical) title to its actual wiki title via Action API `opensearch`. */
async function resolveArticleTitle(host: string, title: string): Promise<string> {
  const params = new URLSearchParams({
    action: 'opensearch',
    search: title,
    limit: '1',
    namespace: '0',
    format: 'json',
    origin: '*',
  })
  const response = await fetch(`https://${host}/w/api.php?${params.toString()}`, {
    headers: wikimediaApiFetchHeaders('random-article-resolve'),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as [string, string[], string[], string[]]
  const resolved = data?.[1]?.[0]
  return typeof resolved === 'string' && resolved ? resolved : title
}

/** Picks a random English "vital article" and resolves it to its canonical wiki title. */
export async function fetchRandomArticle(): Promise<RandomArticle> {
  const host = VITAL_ARTICLE_HOST
  const title = await resolveArticleTitle(host, randomVitalArticleTitle())
  return { host, title }
}

/** Fetches `page/html` for a candidate and counts its carousel-qualifying images (no DOM mount needed — parsed off-screen). */
async function countQualifyingImages(host: string, title: string): Promise<number> {
  const response = await fetch(`https://${host}/api/rest_v1/page/html/${encodeURIComponent(title)}`, {
    headers: {
      Accept: 'text/html; charset=utf-8',
      ...wikimediaApiFetchHeaders('random-article-gallery-check'),
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  const html = await response.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return extractCarouselImages(doc.body).length
}

const DEFAULT_MIN_GALLERY_IMAGES = 3
const MAX_RANDOM_ARTICLE_ATTEMPTS = 15

/**
 * Same as `fetchRandomArticle()`, but keeps rerolling (new random vital
 * article each time) until a candidate has at least `minImages` carousel-
 * qualifying images, or `maxAttempts` is exhausted (falls back to the last
 * candidate tried so the tap never dead-ends).
 */
export async function fetchRandomArticleWithGallery(
  minImages = DEFAULT_MIN_GALLERY_IMAGES,
  maxAttempts = MAX_RANDOM_ARTICLE_ATTEMPTS,
): Promise<RandomArticle> {
  let lastCandidate: RandomArticle | null = null
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const candidate = await fetchRandomArticle()
      lastCandidate = candidate
      const count = await countQualifyingImages(candidate.host, candidate.title)
      if (count >= minImages) return candidate
    } catch (err) {
      console.error('[ProtoWiki] random article gallery check failed, retrying', err)
    }
  }
  if (!lastCandidate) {
    throw new Error(`Could not find a random article after ${maxAttempts} attempts`)
  }
  return lastCandidate
}
