<script setup lang="ts">
import type { CarouselImage } from './shared/extractCarouselImages'

interface Props {
  images: CarouselImage[]
}

defineProps<Props>()
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
      <p v-if="image.caption" class="article-image-carousel__caption">{{ image.caption }}</p>
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

.article-image-carousel__caption {
  flex: 0 0 auto;
  margin: 0;
  padding: var(--spacing-50, 8px);
  font-size: var(--font-size-small, 12px);
  line-height: var(--line-height-x-small, 18px);
  color: var(--color-base, #202122);
  max-height: calc(2 * var(--line-height-x-small, 18px) + 2 * var(--spacing-50, 8px));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
