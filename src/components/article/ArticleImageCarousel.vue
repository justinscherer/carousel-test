<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

import type { CarouselImage } from './shared/extractCarouselImages'

interface Props {
  images: CarouselImage[]
}

const props = defineProps<Props>()

const captionEls: (HTMLElement | null)[] = []
// Vue owns the template's rendered text via this ref; truncateToTwoLines()
// only ever mutates textContent on a DOM node transiently, for measurement,
// within a single synchronous task — never as the node's lasting value.
const displayCaptions = ref<string[]>([])

function setCaptionRef(el: Element | null, index: number) {
  captionEls[index] = el as HTMLElement | null
}

/**
 * `-webkit-line-clamp` visually paints a sliver of the clamped-away line past
 * its own clip boundary in some engines when it's a flex item — no CSS-only
 * workaround (fixed height, separate clip wrapper, `max-height`) stopped it.
 * Truncating the actual text to what fits in 2 lines sidesteps the whole
 * fragmentation box: there's nothing left to leak because nothing overflows.
 */
function truncateToTwoLines(el: HTMLElement, fullText: string): string {
  // `el` (the `<p>`) has no fixed height of its own — only its parent
  // `.caption-clip` does. Measuring `el.clientHeight` here would be
  // self-referential (a block's clientHeight always matches its own
  // content), so the fit check must be against the fixed-height ancestor.
  const maxHeight = el.parentElement?.clientHeight ?? el.clientHeight
  el.textContent = fullText
  if (el.scrollHeight <= maxHeight + 1) return fullText

  let lo = 0
  let hi = fullText.length
  let best = '…'
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const candidate = `${fullText.slice(0, mid).trimEnd()}…`
    el.textContent = candidate
    if (el.scrollHeight <= maxHeight + 1) {
      best = candidate
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

async function updateCaptions() {
  await nextTick()
  props.images.forEach((image, index) => {
    if (!image.caption) return
    const el = captionEls[index]
    if (!el) return
    displayCaptions.value[index] = truncateToTwoLines(el, image.caption)
  })
}

watch(() => props.images, () => void updateCaptions(), { immediate: true })
</script>

<template>
  <div v-if="images.length" class="article-image-carousel" role="group" aria-label="Article images">
    <div v-for="(image, index) in images" :key="image.src + index" class="article-image-carousel__item">
      <img
        :src="image.src"
        :srcset="image.srcset"
        :alt="image.alt"
        loading="lazy"
        class="article-image-carousel__image"
      />
      <div v-if="image.caption" class="article-image-carousel__caption-clip">
        <p :ref="(el) => setCaptionRef(el as Element | null, index)" class="article-image-carousel__caption">
          {{ displayCaptions[index] ?? image.caption }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-image-carousel {
  display: flex;
  gap: var(--spacing-35, 6px);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-block: var(--spacing-100, 16px);
  margin-inline-end: calc(-1 * var(--spacing-100, 16px));
  padding-inline-end: var(--spacing-150, 24px);
}

.article-image-carousel::-webkit-scrollbar {
  display: none;
}

.article-image-carousel__item {
  flex: 0 0 auto;
  width: 256px;
  height: 256px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base);
}

.article-image-carousel__image {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  object-fit: cover;
  display: block;
}

/* Fixed 2-line height + plain block overflow clip — a backstop in case the
   JS truncation above ever overshoots by a sub-pixel font-metric rounding. */
.article-image-carousel__caption-clip {
  flex: 0 0 auto;
  height: calc(2 * var(--line-height-x-small, 18px) + 2 * var(--spacing-50, 8px));
  overflow: hidden;
}

.article-image-carousel__caption {
  margin: 0;
  padding: var(--spacing-50, 8px);
  font-size: var(--font-size-small, 12px);
  line-height: var(--line-height-x-small, 18px);
  color: var(--color-base, #202122);
}
</style>
