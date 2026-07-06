import { wikimediaApiFetchHeaders } from '@/config'

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
