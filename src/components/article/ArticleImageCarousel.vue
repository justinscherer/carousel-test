<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

import type { CarouselImage } from './shared/extractCarouselImages'

interface Props {
  images: CarouselImage[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  open: [image: CarouselImage]
}>()

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
    <div
      v-for="(image, index) in images"
      :key="image.src + index"
      class="article-image-carousel__item"
      role="button"
      tabindex="0"
      @click="emit('open', image)"
      @keydown.enter="emit('open', image)"
      @keydown.space.prevent="emit('open', image)"
    >
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
  container-type: inline-size;
  display: flex;
  gap: var(--spacing-35, 6px);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-block: var(--spacing-100, 16px);
  margin-inline-end: calc(-1 * var(--spacing-100, 16px));
}

.article-image-carousel::-webkit-scrollbar {
  display: none;
}

/*
 * Trailing breathing room after the last thumbnail, as a flex item instead
 * of container padding — padding here would shrink the content box that
 * `.article-image-carousel__item`'s percentage-based width resolves
 * against, throwing off the "2 thumbnails + 16px peek" sizing below.
 */
.article-image-carousel::after {
  content: '';
  flex: 0 0 var(--spacing-150, 24px);
}

/*
 * Responsive width: exactly 2 full thumbnails plus a 5px peek of a third
 * fit across the row's own width. Uses `cqw` (container query width, tied
 * to `.article-image-carousel`'s own `container-type: inline-size` above)
 * rather than `100vw` — that would ignore MobileWrapper's centered mobile-
 * column constraint on wider screens — or bare `%`, which would be a bug
 * here: `%` resolves against whichever axis the *consuming* property uses
 * (width vs height), but `cqw` always means "container's inline size"
 * regardless, so `--thumb-width` gives the same pixel value reused below in
 * `height` (custom properties are substituted text, not pre-computed
 * values, so this distinction matters when a variable is reused across
 * differently-axised properties).
 * `size*2 + gap*2 + 5px peek = 100cqw` → `size = (100cqw - gap*2 - 5px) / 2`.
 *
 * Height is that same width plus a fixed 36px — taller than square, but the
 * width (and therefore the peek) is untouched.
 */
.article-image-carousel__item {
  --thumb-width: clamp(175px, calc((100cqw - 2 * var(--spacing-35, 6px) - 5px) / 2), 384px);
  flex: 0 0 auto;
  width: var(--thumb-width);
  height: calc(var(--thumb-width) + 36px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base);
  cursor: pointer;
}

.article-image-carousel__item:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}

.article-image-carousel__image {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  object-fit: cover;
  display: block;
}

/*
 * `max-height` (not `height`) caps a 2-line caption at exactly 2 lines
 * (backstop for the JS truncation above, in case it ever overshoots by a
 * sub-pixel font-metric rounding) while letting a 1-line caption size to its
 * own shorter content — the image below (flex: 1) grows into the difference
 * instead of leaving blank space under a short caption.
 */
.article-image-carousel__caption-clip {
  flex: 0 0 auto;
  max-height: calc(2 * var(--line-height-x-small, 18px) + 2 * var(--spacing-50, 8px));
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
