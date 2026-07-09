<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconArrowDown, cdxIconClose, cdxIconFullscreen } from '@wikimedia/codex-icons'

import type { CarouselImage } from './shared/extractCarouselImages'

interface Props {
  image: CarouselImage | null
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  scrollToImage: []
}>()

// "View details" is intentionally a no-op for now.
function onViewDetailsClick() {}
</script>

<template>
  <Teleport to="body">
    <Transition name="article-image-preview-fade">
      <div v-if="image" class="article-image-preview" @click="emit('close')">
        <div class="article-image-preview__card" @click.stop>
          <img
            :src="image.src"
            :srcset="image.srcset"
            :alt="image.alt"
            class="article-image-preview__image"
          />
          <p v-if="image.caption" class="article-image-preview__caption">{{ image.caption }}</p>
          <div class="article-image-preview__actions">
            <button
              type="button"
              class="article-image-preview__action"
              @click="emit('scrollToImage')"
            >
              <CdxIcon :icon="cdxIconArrowDown" />
              Scroll to image
            </button>
            <button type="button" class="article-image-preview__action" @click="onViewDetailsClick">
              <CdxIcon :icon="cdxIconFullscreen" />
              View details
            </button>
          </div>
          <button
            type="button"
            class="article-image-preview__close"
            aria-label="Close"
            @click="emit('close')"
          >
            <CdxIcon :icon="cdxIconClose" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.article-image-preview {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-overlay-backdrop, 400);
  display: flex;
  align-items: center;
  justify-content: center;
  /*
   * Padding on the centering flex box — not vw/vh arithmetic on the card —
   * is what guarantees "at least 16px each side, 32px top/bottom": the
   * card's max-width/max-height: 100% below resolve against this box's
   * content area, which already excludes this padding.
   */
  padding: 32px 16px;
  background-color: var(--background-color-backdrop-dark);
}

.article-image-preview__card {
  position: relative;
  z-index: var(--z-index-overlay, 450);
  /*
   * `width: 100%` (not just `max-width`) so the card actively fills the
   * available width up to the margin — "expand the image as wide as it can
   * go" — rather than shrinking to the image's natural resolution. A flex
   * item centered by `justify-content: center` with no explicit width
   * defaults to fit-content, which left `max-width: 100%` as an unreached
   * ceiling whenever the source image was narrower than the available space.
   */
  width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  padding-bottom: var(--spacing-100, 16px);
  overflow: auto;
  background-color: var(--background-color-base);
  border: 1px solid var(--border-color-muted, #dadde3);
  border-radius: var(--border-radius-base, 2px);
  box-shadow: var(--box-shadow-large);
}

.article-image-preview__image {
  /*
   * Still fills the card's full width (upscaling a smaller source image if
   * needed) whenever that's compatible with the 50vh height cap below —
   * `object-fit: contain` is what keeps it undistorted (scaled down
   * proportionally, not squashed) on the images where it isn't.
   */
  width: 100%;
  height: auto;
  max-height: 50vh;
  object-fit: contain;
  display: block;
}

.article-image-preview__caption {
  margin: 0;
  padding-inline: var(--spacing-100, 16px);
  font-size: var(--font-size-small, 12px);
  line-height: var(--line-height-x-small, 18px);
  color: var(--color-base, #202122);
}

.article-image-preview__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-75, 12px);
  padding-inline: var(--spacing-100, 16px);
}

.article-image-preview__action {
  display: flex;
  align-items: center;
  gap: var(--spacing-25, 6px);
  height: 32px;
  padding-inline: var(--spacing-75, 12px);
  border: none;
  border-radius: var(--border-radius-base, 2px);
  background-color: transparent;
  color: var(--color-progressive, #36c);
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium, 14px);
  white-space: nowrap;
  cursor: pointer;
}

.article-image-preview__action:hover {
  background-color: var(--background-color-progressive-subtle, #e8eeff);
}

/* CdxIcon sets its own `color` on `.cdx-icon` rather than inheriting —
   match the icon to this button's own label color. */
.article-image-preview__action :deep(.cdx-icon) {
  color: inherit;
}

.article-image-preview__close {
  position: absolute;
  top: var(--spacing-50, 8px);
  right: var(--spacing-50, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-backdrop-light);
  color: var(--color-base, #202122);
  cursor: pointer;
}

.article-image-preview-fade-enter-active,
.article-image-preview-fade-leave-active {
  transition: opacity 0.2s ease;
}

.article-image-preview-fade-enter-active .article-image-preview__card,
.article-image-preview-fade-leave-active .article-image-preview__card {
  transition: transform 0.2s ease;
}

.article-image-preview-fade-enter-from,
.article-image-preview-fade-leave-to {
  opacity: 0;
}

.article-image-preview-fade-enter-from .article-image-preview__card,
.article-image-preview-fade-leave-to .article-image-preview__card {
  transform: scale(0.92);
}
</style>
