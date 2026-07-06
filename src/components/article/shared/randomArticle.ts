import { wikimediaApiFetchHeaders } from '@/config'
import { extractCarouselImages } from './extractCarouselImages'

/** Top 20 Wikipedia editions by article count (language code → wiki host). */
export const TOP_20_WIKIPEDIA_LANGUAGE_HOSTS = [
  'en.wikipedia.org', // English
  'es.wikipedia.org', // Spanish
  'fr.wikipedia.org', // French
  'de.wikipedia.org', // German
  'it.wikipedia.org', // Italian
  'ja.wikipedia.org', // Japanese
  'ru.wikipedia.org', // Russian
  'zh.wikipedia.org', // Chinese
  'pl.wikipedia.org', // Polish
  'nl.wikipedia.org', // Dutch
  'pt.wikipedia.org', // Portuguese
  'fa.wikipedia.org', // Persian
  'he.wikipedia.org', // Hebrew
  'ko.wikipedia.org', // Korean
  'ar.wikipedia.org', // Arabic
  'id.wikipedia.org', // Indonesian
  'uk.wikipedia.org', // Ukrainian
  'tr.wikipedia.org', // Turkish
  'vi.wikipedia.org', // Vietnamese
  'cs.wikipedia.org', // Czech
]

export interface RandomArticle {
  host: string
  title: string
}

function randomHost(): string {
  const i = Math.floor(Math.random() * TOP_20_WIKIPEDIA_LANGUAGE_HOSTS.length)
  return TOP_20_WIKIPEDIA_LANGUAGE_HOSTS[i]
}

/** Picks a random language from the top-20 list, then a random article on that wiki. */
export async function fetchRandomArticle(): Promise<RandomArticle> {
  const host = randomHost()
  const response = await fetch(`https://${host}/api/rest_v1/page/random/summary`, {
    headers: {
      Accept: 'application/json',
      ...wikimediaApiFetchHeaders('random-article'),
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  const summary = await response.json()
  const title = summary?.title
  if (typeof title !== 'string' || !title) {
    throw new Error('Random article response had no title')
  }
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
 * Same as `fetchRandomArticle()`, but keeps rerolling (new random language +
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
